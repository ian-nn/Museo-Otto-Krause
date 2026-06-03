<?php
require_once __DIR__ . '/../helpers/JWTHelper.php';

class AuthMiddleware {
    public static function checkAuth(): array {
        $headers = getallheaders();
        // Captura en minusculas y mayusculas por compatibilidad de servers
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            http_response_code(401);
            echo json_encode([
                "success" => false,
                "message" => "Acceso denegado: Token invalido"
            ]);
            exit;
        }

        // Extrae el token separando la cadena despues de "Bearer "
        $token = explode(" ", $authHeader)[1] ?? '';
        $decoded = JWTHelper::decode($token);

        if (!$decoded) {
            http_response_code(403);
            echo json_encode([
                "success" => false,
                "message" => "Token invalido o expirado"
            ]);
            exit;
        }

        // Retorna el payload decodificado (id_usuario, rol, etc) para el controlador
        return $decoded; 
    }
}