<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../controllers/CatalogosController.php';

$controller = new CatalogosController();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    if (!is_array($input)) {
        parse_str($rawInput, $parsedInput);
        $input = !empty($parsedInput) ? $parsedInput : $_POST;
    }

    if (!empty($input['id_sala']) || !empty($input['id_vitrina']) || !empty($input['id_cajon']) || !empty($input['id_categoria']) || !empty($input['id_coleccion']) || !empty($input['id_autor']) || !empty($input['id_propietario']) || !empty($input['id_donador']) || !empty($input['id_epoca']) || !empty($input['id_material']) || isset($input['id_sala']) || isset($input['id_vitrina']) || isset($input['id_cajon']) || isset($input['id_categoria']) || isset($input['id_coleccion']) || isset($input['id_autor']) || isset($input['id_propietario']) || isset($input['id_donador']) || isset($input['id_epoca']) || isset($input['id_material'])) {
        $controller->updateResource();
        return;
    }

    $controller->createResource();
    return;
}

if ($method === 'PUT') {
    $controller->updateResource();
    return;
}

if ($method === 'DELETE') {
    $controller->deleteResource();
    return;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Método no permitido"]);
