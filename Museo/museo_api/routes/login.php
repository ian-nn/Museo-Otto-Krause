<?php
require_once __DIR__ . '/../controllers/AuthController.php';

// Instancia y ejecuta la acción del controlador
$authController = new AuthController();
$authController->loginUsuario();