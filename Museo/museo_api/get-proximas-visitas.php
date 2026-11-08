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
        SELECT referente, tipo, fecha_hora, estado
        FROM (
            SELECT CONCAT(r.nombre, ' ', r.apellido) AS referente,
                   'Personal' AS tipo, v.fecha_hora, r.estado
            FROM public_reservations r
            INNER JOIN visitas_programadas v ON v.id_visita = r.id_visita
            WHERE v.fecha_hora >= CURRENT_TIMESTAMP
              AND v.fecha_hora <= DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)

            UNION ALL

            SELECT CONCAT(r.nombre_responsable, ' ', r.apellido_responsable) AS referente,
                   CASE
                       WHEN r.tipo_institucion = 'Escuela' THEN 'Escolar'
                       ELSE 'Institucional'
                   END AS tipo,
                   v.fecha_hora, r.estado
            FROM institutional_reservations r
            INNER JOIN visitas_programadas v ON v.id_visita = r.id_visita
            WHERE v.fecha_hora >= CURRENT_TIMESTAMP
              AND v.fecha_hora <= DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
        ) AS proximas_visitas
        ORDER BY fecha_hora ASC
    ");
    $statement->execute();

    respond(200, $statement->fetchAll());
} catch (Throwable $error) {
    error_log('Unable to fetch upcoming visits: ' . $error->getMessage());
    respond(500, ['success' => false, 'message' => 'No se pudieron cargar las próximas visitas.']);
}
