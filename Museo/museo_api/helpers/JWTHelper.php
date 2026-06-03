<?php
class JWTHelper {
    // Clave secreta para los tokens. MODIFICAR EN PRODUCCION
    private static $secret = 'OKNET_MUSEO_SUPER_SECRET_KEY'; 

    public static function encode(array $payload, int $expiry = 86400): string {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        // Añadir tiempo de expiración son 24 horas por defecto
        $payload['exp'] = time() + $expiry;
        $payloadJson = json_encode($payload);

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payloadJson);

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        list($header, $payload, $signature) = $parts;

        // Verifica firma
        $validSignature = hash_hmac('sha256', $header . "." . $payload, self::$secret, true);
        if (!hash_equals(self::base64UrlEncode($validSignature), $signature)) {
            return null;
        }

        $payloadData = json_decode(self::base64UrlDecode($payload), true);
        
        // Verifica si el token expiro
        if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
            return null; 
        }

        return $payloadData;
    }

    private static function base64UrlEncode(string $text): string {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($text));
    }

    private static function base64UrlDecode(string $text): string {
        $base64 = str_replace(['-', '_'], ['+', '/'], $text);
        $padding = strlen($base64) % 4;
        if ($padding) {
            $base64 .= str_repeat('=', 4 - $padding);
        }
        return base64_decode($base64);
    }
}