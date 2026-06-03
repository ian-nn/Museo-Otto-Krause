<?php
// Enrutador básico para la API
header('Content-Type: application/json');

$request_method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', $uri);

// Ejemplo de boilerplate para enrutamiento:
// if ($uri[2] == 'visitas') { ... }
