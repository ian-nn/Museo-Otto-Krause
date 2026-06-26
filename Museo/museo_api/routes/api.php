<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'code' => 'METHOD_NOT_ALLOWED',
        'message' => 'Método no permitido.'
    ]);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_values(array_filter(explode('/', $path), 'strlen'));
$apiIndex = array_search('api.php', $segments);
$routeSegments = $apiIndex !== false ? array_slice($segments, $apiIndex + 1) : $segments;
$route = implode('/', $routeSegments);

$input = file_get_contents('php://input');
$payload = $input ? json_decode($input, true) : [];

function sendValidationError(array $errors): void {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'code' => 'BAD_REQUEST',
        'message' => 'Error de validación en los datos enviados.',
        'errors' => $errors
    ]);
    exit;
}

if ($route === 'api/reservas/publicas') {
    $requiredFields = ['id_visita', 'nombre', 'apellido', 'email', 'dni', 'telefono', 'cantidad_personas'];
    $errors = [];

    foreach ($requiredFields as $field) {
        if (!array_key_exists($field, $payload) || $payload[$field] === '' || $payload[$field] === null) {
            $errors[] = ['field' => $field, 'message' => 'Este campo es obligatorio.'];
        }
    }

    if ($errors) {
        sendValidationError($errors);
    }

    $attendees = (int) $payload['cantidad_personas'];
    $estado = $attendees > 30 ? 'en_revision' : 'aprobada';

    echo json_encode([
        'status' => 'success',
        'message' => 'Reserva pública creada con éxito.',
        'data' => [
            'id_reserva_pub' => 1,
            'id_visita' => (int) $payload['id_visita'],
            'nombre' => $payload['nombre'],
            'apellido' => $payload['apellido'],
            'email' => $payload['email'],
            'dni' => $payload['dni'],
            'telefono' => $payload['telefono'],
            'cantidad_personas' => $attendees,
            'estado' => $estado
        ]
    ]);
    exit;
}

if ($route === 'api/reservas/institucionales') {
    $requiredFields = ['id_visita', 'nombre_institucion', 'tipo_institucion', 'cantidad_alumnos', 'nombre_responsable', 'apellido_responsable', 'email_contacto', 'telefono_contacto', 'dni_responsable'];
    $errors = [];

    foreach ($requiredFields as $field) {
        if (!array_key_exists($field, $payload) || $payload[$field] === '' || $payload[$field] === null) {
            $errors[] = ['field' => $field, 'message' => 'Este campo es obligatorio.'];
        }
    }

    if ($errors) {
        sendValidationError($errors);
    }

    $attendees = (int) $payload['cantidad_alumnos'];
    $estado = $attendees > 30 ? 'en_revision' : 'aprobada';

    echo json_encode([
        'status' => 'success',
        'message' => 'Reserva institucional creada con éxito.',
        'data' => [
            'id_reserva_inst' => 102,
            'id_visita' => (int) $payload['id_visita'],
            'nombre_institucion' => $payload['nombre_institucion'],
            'tipo_institucion' => $payload['tipo_institucion'],
            'cue' => $payload['cue'] ?? null,
            'cantidad_alumnos' => $attendees,
            'nombre_responsable' => $payload['nombre_responsable'],
            'apellido_responsable' => $payload['apellido_responsable'],
            'email_contacto' => $payload['email_contacto'],
            'telefono_contacto' => $payload['telefono_contacto'],
            'dni_responsable' => $payload['dni_responsable'],
            'estado' => $estado
        ]
    ]);
    exit;
}

http_response_code(404);
echo json_encode([
    'status' => 'error',
    'code' => 'NOT_FOUND',
    'message' => 'Ruta no encontrada.'
]);
