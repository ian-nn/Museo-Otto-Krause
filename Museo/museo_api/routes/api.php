<?php
// Enrutador básico para la API
header('Content-Type: application/json');

$request_method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($uri, '/'));

$resource = null;
foreach ($segments as $segment) {
    if (trim($segment) === 'objetos') {
        $resource = 'objetos';
        break;
    }
    if (trim($segment) === 'catalogos') {
        $resource = 'catalogos';
        break;
    }
}

if ($resource === 'objetos') {
    require_once __DIR__ . '/objetos.php';
    return;
}

if ($resource === 'catalogos') {
    require_once __DIR__ . '/catalogos.php';
    return;
}

http_response_code(404);
echo json_encode([
    'success' => false,
    'message' => 'Recurso no encontrado.'
]);
