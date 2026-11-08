<?php
header('Content-Type: application/json; charset=utf-8');

function respond($status, array $data)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function requiredText(array $data, $field, $label, $maxLength)
{
    $value = isset($data[$field]) && is_string($data[$field]) ? trim($data[$field]) : '';
    if ($value === '' || mb_strlen($value) > $maxLength) {
        respond(422, ['success' => false, 'message' => $label . ' es obligatorio y debe tener un máximo de ' . $maxLength . ' caracteres.']);
    }
    return $value;
}

function requiredCount(array $data, $field, $label, $allowZero = false)
{
    $value = $data[$field] ?? null;
    if (!is_scalar($value) || filter_var($value, FILTER_VALIDATE_INT) === false) {
        respond(422, ['success' => false, 'message' => $label . ' debe ser un número entero válido.']);
    }

    $count = (int) $value;
    if ($count < ($allowZero ? 0 : 1) || $count > 1000) {
        respond(422, ['success' => false, 'message' => $label . ' está fuera del rango permitido.']);
    }
    return $count;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, ['success' => false, 'message' => 'Método no permitido.']);
}

$data = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    respond(400, ['success' => false, 'message' => 'El cuerpo de la solicitud debe ser JSON válido.']);
}

$tipo = $data['tipo'] ?? '';
$tipoVisita = $tipo === 'personal' ? 'Publica' : 'Institucional';
if (!in_array($tipo, ['personal', 'escolar', 'institucional'], true)) {
    respond(422, ['success' => false, 'message' => 'El tipo de reserva no es válido.']);
}

$idVisita = filter_var($data['id_visita'] ?? null, FILTER_VALIDATE_INT);
if ($idVisita === false || $idVisita < 1) {
    respond(422, ['success' => false, 'message' => 'Seleccioná una fecha y horario disponibles.']);
}

$extraPersonas = requiredCount($data, 'extra_personas', 'La cantidad de acompañantes', true);

if ($tipo === 'personal') {
    $nombre = requiredText($data, 'nombre', 'El nombre', 100);
    $apellido = requiredText($data, 'apellido', 'El apellido', 100);
    $email = requiredText($data, 'email', 'El email', 150);
    $dni = requiredText($data, 'dni', 'El DNI', 20);
    $telefono = requiredText($data, 'tel', 'El teléfono', 50);
    $cantidadPersonas = 1 + $extraPersonas;
    $tipoInstitucion = null;
    $institucion = null;
    $cue = null;
} elseif ($tipo === 'escolar') {
    $nombre = requiredText($data, 'docente_nombre', 'El nombre de la persona responsable', 100);
    $apellido = requiredText($data, 'docente_apellido', 'El apellido de la persona responsable', 100);
    $institucion = requiredText($data, 'institucion', 'El nombre de la institución', 150);
    $cue = requiredText($data, 'cue', 'El CUE', 9);
    $alumnos = requiredCount($data, 'alumnos', 'La cantidad de alumnos');
    $docentes = requiredCount($data, 'docentes', 'La cantidad de docentes', true);
    $email = requiredText($data, 'email_institucional', 'El email institucional', 150);
    $telefono = requiredText($data, 'tel_institucional', 'El teléfono', 50);
    $tipoInstitucion = 'Escuela';
    $cantidadPersonas = $alumnos + $docentes + $extraPersonas;
    $dni = null;
} else {
    $nombre = requiredText($data, 'referente_nombre', 'El nombre de la persona responsable', 100);
    $apellido = requiredText($data, 'referente_apellido', 'El apellido de la persona responsable', 100);
    $institucion = requiredText($data, 'organizacion', 'El nombre de la organización', 150);
    $cantidad = requiredCount($data, 'personas', 'La cantidad de personas');
    $email = requiredText($data, 'email_institucional2', 'El email', 150);
    $telefono = requiredText($data, 'tel_institucional2', 'El teléfono', 50);
    $tipoInstitucion = 'Institucion';
    $cantidadPersonas = $cantidad + $extraPersonas;
    $cue = null;
    $dni = null;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['success' => false, 'message' => 'Ingresá un email válido.']);
}
if ($tipo === 'personal' && !preg_match('/^\d{8}$/', $dni)) {
    respond(422, ['success' => false, 'message' => 'El DNI debe tener 8 dígitos.']);
}
if ($tipo === 'escolar' && !preg_match('/^\d{9}$/', $cue)) {
    respond(422, ['success' => false, 'message' => 'El CUE debe tener 9 dígitos.']);
}
if (!preg_match('/^[0-9+()\-\s]{7,20}$/', $telefono)) {
    respond(422, ['success' => false, 'message' => 'Ingresá un teléfono válido.']);
}

require_once __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance();
    $db->beginTransaction();

    $visitStatement = $db->prepare(
        'SELECT tipo_visita, cupo_actual, cupo_maximo
         FROM visitas_programadas
         WHERE id_visita = :id_visita AND fecha_hora >= CURRENT_TIMESTAMP
         FOR UPDATE'
    );
    $visitStatement->execute([':id_visita' => $idVisita]);
    $visit = $visitStatement->fetch();

    if (!$visit || $visit['tipo_visita'] !== $tipoVisita) {
        $db->rollBack();
        respond(422, ['success' => false, 'message' => 'La fecha seleccionada ya no está disponible.']);
    }

    if ((int) $visit['cupo_maximo'] - (int) $visit['cupo_actual'] < $cantidadPersonas) {
        $db->rollBack();
        respond(409, ['success' => false, 'message' => 'No hay cupos suficientes para la cantidad de personas indicada.']);
    }

    if ($tipo === 'personal') {
        $insert = $db->prepare(
            "INSERT INTO public_reservations
                (id_visita, nombre, apellido, email, dni, telefono, cantidad_personas, estado)
             VALUES
                (:id_visita, :nombre, :apellido, :email, :dni, :telefono, :cantidad_personas, 'pendiente')"
        );
        $insert->execute([
            ':id_visita' => $idVisita,
            ':nombre' => $nombre,
            ':apellido' => $apellido,
            ':email' => $email,
            ':dni' => $dni,
            ':telefono' => $telefono,
            ':cantidad_personas' => $cantidadPersonas,
        ]);
    } else {
        $insert = $db->prepare(
            "INSERT INTO institutional_reservations
                (id_visita, nombre_institucion, tipo_institucion, cue, cantidad_personas,
                 nombre_responsable, apellido_responsable, email_contacto, telefono_contacto, estado)
             VALUES
                (:id_visita, :nombre_institucion, :tipo_institucion, :cue, :cantidad_personas,
                 :nombre_responsable, :apellido_responsable, :email_contacto, :telefono_contacto, 'pendiente')"
        );
        $insert->execute([
            ':id_visita' => $idVisita,
            ':nombre_institucion' => $institucion,
            ':tipo_institucion' => $tipoInstitucion,
            ':cue' => $cue,
            ':cantidad_personas' => $cantidadPersonas,
            ':nombre_responsable' => $nombre,
            ':apellido_responsable' => $apellido,
            ':email_contacto' => $email,
            ':telefono_contacto' => $telefono,
        ]);
    }

    $update = $db->prepare(
        'UPDATE visitas_programadas
         SET cupo_actual = cupo_actual + :cantidad_sumar
         WHERE id_visita = :id_visita AND cupo_actual + :cantidad_validar <= cupo_maximo'
    );
    $update->execute([
        ':cantidad_sumar' => $cantidadPersonas,
        ':id_visita' => $idVisita,
        ':cantidad_validar' => $cantidadPersonas,
    ]);

    if ($update->rowCount() !== 1) {
        throw new RuntimeException('Visit capacity changed during reservation.');
    }

    $db->commit();
    respond(201, ['success' => true, 'message' => 'La solicitud de reserva fue enviada y quedó pendiente de confirmación.']);
} catch (Throwable $error) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Unable to create reservation: ' . $error->getMessage());
    respond(500, ['success' => false, 'message' => 'No se pudo registrar la reserva. Intentá nuevamente.']);
}
