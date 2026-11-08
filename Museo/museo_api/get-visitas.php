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

$incluirCompletas = $_GET['include_full'] ?? '0';
if (!in_array($incluirCompletas, ['0', '1'], true)) {
    respond(400, ['success' => false, 'message' => 'El parámetro include_full no es válido.']);
}

require_once __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance();
    $sql = 'SELECT id_visita, fecha_hora, tipo_visita, cupo_actual, cupo_maximo,
                   cupos_disponibles
            FROM (
                SELECT v.id_visita, v.fecha_hora, v.tipo_visita,
                       COALESCE(public_counts.cupo_aprobado, 0)
                           + COALESCE(institutional_counts.cupo_aprobado, 0) AS cupo_actual,
                       v.cupo_maximo,
                       v.cupo_maximo
                           - COALESCE(public_counts.cupo_aprobado, 0)
                           - COALESCE(institutional_counts.cupo_aprobado, 0) AS cupos_disponibles
                FROM visitas_programadas v
                LEFT JOIN (
                    SELECT id_visita, SUM(cantidad_personas) AS cupo_aprobado
                    FROM public_reservations
                    WHERE estado = \'aprobada\'
                    GROUP BY id_visita
                ) AS public_counts ON public_counts.id_visita = v.id_visita
                LEFT JOIN (
                    SELECT id_visita, SUM(cantidad_personas) AS cupo_aprobado
                    FROM institutional_reservations
                    WHERE estado = \'aprobada\'
                    GROUP BY id_visita
                ) AS institutional_counts ON institutional_counts.id_visita = v.id_visita
            ) AS visitas
            WHERE fecha_hora >= CURRENT_TIMESTAMP';

    if ($incluirCompletas !== '1') {
        $sql .= ' AND cupo_actual < cupo_maximo';
    }

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
