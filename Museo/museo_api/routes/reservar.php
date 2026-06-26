<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../controllers/ReservaController.php';

$reserva = new ReservaController();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $reserva->listarVisitasDisponibles();
} else {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    if (!is_array($input)) {
        parse_str($rawInput, $parsedInput);
        $input = !empty($parsedInput) ? $parsedInput : $_POST;
    }

    if (is_array($input) && isset($input['action']) && in_array(strtolower(trim((string)$input['action'])), ['aprobar', 'rechazar'], true)) {
        $reserva->cambiarEstadoReservaInstitucional();
    } else {
        $reserva->registrarReserva();
    }
}