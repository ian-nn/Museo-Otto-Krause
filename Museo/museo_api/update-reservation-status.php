<?php
header('Content-Type: application/json; charset=utf-8');

function respond($status, array $data)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, ['success' => false, 'message' => 'Método no permitido.']);
}

$data = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    respond(400, ['success' => false, 'message' => 'El cuerpo de la solicitud debe ser JSON válido.']);
}

$rawId = $data['id'] ?? null;
$id = is_scalar($rawId) ? filter_var($rawId, FILTER_VALIDATE_INT) : false;
$type = $data['tipo'] ?? null;
$newStatus = $data['nuevo_estado'] ?? null;

if ($id === false || $id < 1) {
    respond(422, ['success' => false, 'message' => 'El identificador de la reserva no es válido.']);
}
if (!in_array($type, ['public', 'institutional'], true)) {
    respond(422, ['success' => false, 'message' => 'El tipo de reserva no es válido.']);
}
if (!in_array($newStatus, ['aprobada', 'rechazada'], true)) {
    respond(422, ['success' => false, 'message' => 'El estado solicitado no es válido.']);
}

$table = $type === 'public' ? 'public_reservations' : 'institutional_reservations';
$idColumn = $type === 'public' ? 'id_public_reservation' : 'id_institutional_reservation';

require_once __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance();
    $db->beginTransaction();

    $reservationStatement = $db->prepare(
        "SELECT id_visita, cantidad_personas, estado
         FROM {$table}
         WHERE {$idColumn} = :id
         FOR UPDATE"
    );
    $reservationStatement->execute([':id' => $id]);
    $reservation = $reservationStatement->fetch();

    if (!$reservation) {
        $db->rollBack();
        respond(404, ['success' => false, 'message' => 'No se encontró la reserva.']);
    }

    $visitStatement = $db->prepare(
        'SELECT cupo_maximo
         FROM visitas_programadas
         WHERE id_visita = :id_visita
         FOR UPDATE'
    );
    $visitStatement->execute([':id_visita' => $reservation['id_visita']]);
    $visit = $visitStatement->fetch();

    if (!$visit) {
        $db->rollBack();
        respond(404, ['success' => false, 'message' => 'No se encontró la visita asociada.']);
    }

    $publicApprovedStatement = $db->prepare(
        "SELECT COALESCE(SUM(cantidad_personas), 0)
         FROM public_reservations
         WHERE id_visita = :id_visita AND estado = 'aprobada'"
    );
    $publicApprovedStatement->execute([':id_visita' => $reservation['id_visita']]);
    $institutionalApprovedStatement = $db->prepare(
        "SELECT COALESCE(SUM(cantidad_personas), 0)
         FROM institutional_reservations
         WHERE id_visita = :id_visita AND estado = 'aprobada'"
    );
    $institutionalApprovedStatement->execute([':id_visita' => $reservation['id_visita']]);

    $approvedCount = (int) $publicApprovedStatement->fetchColumn()
        + (int) $institutionalApprovedStatement->fetchColumn();
    $reservationCount = (int) $reservation['cantidad_personas'];
    $currentStatus = $reservation['estado'];
    $newApprovedCount = $approvedCount
        - ($currentStatus === 'aprobada' ? $reservationCount : 0)
        + ($newStatus === 'aprobada' ? $reservationCount : 0);

    if ($newApprovedCount > (int) $visit['cupo_maximo']) {
        $db->rollBack();
        respond(409, [
            'success' => false,
            'message' => 'No hay cupos suficientes para aprobar esta reserva.'
        ]);
    }

    $updateReservation = $db->prepare(
        "UPDATE {$table}
         SET estado = :estado
         WHERE {$idColumn} = :id"
    );
    $updateReservation->execute([':estado' => $newStatus, ':id' => $id]);

    $updateVisit = $db->prepare(
        'UPDATE visitas_programadas
         SET cupo_actual = :cupo_actual
         WHERE id_visita = :id_visita'
    );
    $updateVisit->execute([
        ':cupo_actual' => $newApprovedCount,
        ':id_visita' => $reservation['id_visita'],
    ]);

    $db->commit();
    respond(200, [
        'success' => true,
        'estado' => $newStatus,
        'cupo_actual' => $newApprovedCount,
    ]);
} catch (Throwable $error) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Unable to update reservation status: ' . $error->getMessage());
    respond(500, ['success' => false, 'message' => 'No se pudo actualizar el estado de la reserva.']);
}
