<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../controllers/ObjetosController.php';

$objetosController = new ObjetosController();
$requestMethod = $_SERVER['REQUEST_METHOD'];

if ($requestMethod === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    if (!is_array($input)) {
        parse_str($rawInput, $parsedInput);
        $input = !empty($parsedInput) ? $parsedInput : $_POST;
    }

    if (!empty($input['id_objeto'])) {
        $objetosController->updateObjeto();
    } else {
        $objetosController->createObjeto();
    }
    return;
}

if ($requestMethod === 'PUT') {
    $objetosController->updateObjeto();
    return;
}

if ($requestMethod === 'DELETE') {
    $objetosController->deleteObjeto();
    return;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Método no permitido"]);
