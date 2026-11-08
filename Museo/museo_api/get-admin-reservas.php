<?php
header('Content-Type: application/json; charset=utf-8');

function respond($status, array $data)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    respond(405, ['success' => false, 'message' => 'Método no permitido.']);
}

require_once __DIR__ . '/middlewares/AuthMiddleware.php';
$user = AuthMiddleware::checkAuth();
if (($user['rol'] ?? '') !== 'admin') {
    respond(403, ['success' => false, 'message' => 'Se requiere una cuenta de administración.']);
}

require_once __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance();
    $sql = "
        SELECT CONCAT('publica-', r.id_public_reservation) AS id_reserva,
               'publica' AS origen, v.id_visita, v.fecha_hora, 'Personal' AS tipo,
               r.nombre, r.apellido, r.email, r.dni, r.telefono,
               r.cantidad_personas, r.estado, NULL AS institucion, NULL AS cue,
               r.creado_en
        FROM public_reservations r
        INNER JOIN visitas_programadas v ON v.id_visita = r.id_visita
        UNION ALL
        SELECT CONCAT('institucional-', r.id_institutional_reservation) AS id_reserva,
               'institucional' AS origen, v.id_visita, v.fecha_hora,
               CASE WHEN r.tipo_institucion = 'Escuela' THEN 'Escolar' ELSE 'Institucional' END AS tipo,
               r.nombre_responsable AS nombre, r.apellido_responsable AS apellido,
               r.email_contacto AS email, r.dni_responsable AS dni,
               r.telefono_contacto AS telefono, r.cantidad_personas, r.estado,
               r.nombre_institucion AS institucion, r.cue, r.creado_en
        FROM institutional_reservations r
        INNER JOIN visitas_programadas v ON v.id_visita = r.id_visita
        ORDER BY creado_en DESC";
    $reservas = $db->query($sql)->fetchAll();

    respond(200, ['success' => true, 'reservas' => $reservas]);
} catch (Throwable $error) {
    error_log('Unable to fetch admin reservations: ' . $error->getMessage());
    respond(500, ['success' => false, 'message' => 'No se pudieron cargar las reservas.']);
}
