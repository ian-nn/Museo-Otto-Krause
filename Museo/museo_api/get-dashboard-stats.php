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

require_once __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance();
    $statement = $db->prepare("
        SELECT
            (SELECT COUNT(*) FROM public_reservations WHERE estado = 'aprobada')
                + (SELECT COUNT(*) FROM institutional_reservations WHERE estado = 'aprobada')
                AS approved_visits,
            (SELECT COUNT(*) FROM institutional_reservations)
                AS institutional_reservations,
            (SELECT COUNT(*) FROM public_reservations WHERE estado = 'pendiente')
                + (SELECT COUNT(*) FROM institutional_reservations WHERE estado = 'pendiente')
                AS pending_reservations,
            (SELECT COUNT(*) FROM public_reservations)
                + (SELECT COUNT(*) FROM institutional_reservations)
                AS total_visits
    ");
    $statement->execute();
    $stats = $statement->fetch();

    foreach ($stats as $key => $value) {
        $stats[$key] = (int) $value;
    }

    respond(200, ['success' => true, 'stats' => $stats]);
} catch (Throwable $error) {
    error_log('Unable to fetch dashboard stats: ' . $error->getMessage());
    respond(500, ['success' => false, 'message' => 'No se pudieron cargar las estadísticas.']);
}
