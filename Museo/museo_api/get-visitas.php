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

$tipoVisita = $_GET['tipo_visita'] ?? null;
if ($tipoVisita !== null && !in_array($tipoVisita, ['Publica', 'Institucional'], true)) {
    respond(400, ['success' => false, 'message' => 'El tipo de visita no es válido.']);
}

require_once __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance();
    $sql = 'SELECT id_visita, fecha_hora, tipo_visita, cupo_actual, cupo_maximo,
                   (cupo_maximo - cupo_actual) AS cupos_disponibles
            FROM visitas_programadas
            WHERE cupo_actual < cupo_maximo
              AND fecha_hora >= CURRENT_TIMESTAMP';
    $params = [];

    if ($tipoVisita !== null) {
        $sql .= ' AND tipo_visita = :tipo_visita';
        $params[':tipo_visita'] = $tipoVisita;
    }

    $sql .= ' ORDER BY fecha_hora ASC';
    $statement = $db->prepare($sql);
    $statement->execute($params);

    respond(200, ['success' => true, 'visitas' => $statement->fetchAll()]);
} catch (Throwable $error) {
    error_log('Unable to fetch available visits: ' . $error->getMessage());
    respond(500, ['success' => false, 'message' => 'No se pudieron cargar las fechas disponibles.']);
}
