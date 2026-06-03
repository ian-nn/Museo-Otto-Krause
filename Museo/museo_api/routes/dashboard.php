<?php
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

// Ejecutamos el middleware. Si el token no sirve o no existe, frena acá mismo.
$usuarioLogueado = AuthMiddleware::checkAuth();

// Si pasa el middleware, significa que el usuario es válido
header("Content-Type: application/json");
echo json_encode([
    "success" => true,
    "message" => "¡Acceso concedido al panel del Museo!",
    "datos_del_token" => $usuarioLogueado
]);