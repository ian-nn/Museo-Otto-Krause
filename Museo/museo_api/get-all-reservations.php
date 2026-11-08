<?php
header('Content-Type: application/json; charset=utf-8');

function respond($status, $data)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    respond(405, ['success' => false, 'message' => 'Método no permitido.']);
}

require_once __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance();
    $statement = $db->prepare("
        SELECT id, tipo_reserva, nombre, apellido, email, tipo,
               fecha_hora, estado, cantidad_personas, institucion,
               cue, dni, telefono, id_visita
        FROM (
            SELECT r.id_public_reservation AS id,
                   'public' AS tipo_reserva,
                   r.nombre, r.apellido, r.email,
                   'Personal' AS tipo,
                   v.fecha_hora, r.estado, r.cantidad_personas,
                   NULL AS institucion, NULL AS cue, r.dni, r.telefono,
                   v.id_visita, r.creado_en
            FROM public_reservations r
            INNER JOIN visitas_programadas v ON v.id_visita = r.id_visita

            UNION ALL

            SELECT r.id_institutional_reservation AS id,
                   'institutional' AS tipo_reserva,
                   r.nombre_responsable AS nombre,
                   r.apellido_responsable AS apellido,
                   r.email_contacto AS email,
                   CASE
                       WHEN r.tipo_institucion = 'Escuela' THEN 'Escolar'
                       ELSE 'Institucional'
                   END AS tipo,
                   v.fecha_hora, r.estado, r.cantidad_personas,
                   r.nombre_institucion AS institucion, r.cue,
                   r.dni_responsable AS dni,
                   r.telefono_contacto AS telefono,
                   v.id_visita, r.creado_en
            FROM institutional_reservations r
            INNER JOIN visitas_programadas v ON v.id_visita = r.id_visita
        ) AS reservas
        ORDER BY creado_en DESC
    ");
    $statement->execute();

    respond(200, $statement->fetchAll());
} catch (Throwable $error) {
    error_log('Unable to fetch all reservations: ' . $error->getMessage());
    respond(500, ['success' => false, 'message' => 'No se pudieron cargar las reservas.']);
}
