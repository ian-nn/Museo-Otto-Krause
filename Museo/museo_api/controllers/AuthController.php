<?php
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../helpers/JWTHelper.php';

class AuthController {
    
    public function loginUsuario() {
        // Configuracion de cabeceras CORS (RNF04, RNF06)
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json; charset=UTF-8");
        header("Access-Control-Allow-Methods: POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

        // Soporte para Preflight OPTIONS del navegador (CORS)
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Método no permitido"]);
            exit;
        }

        // Captura y decodifica del flujo JSON entrante
        $input = json_decode(file_get_contents("php://input"), true);

        // Mapeo tolerante y compatible con el contrato de Notion del Sprint 1
        $email = $input['email_usuario'] ?? $input['email'] ?? null;
        $contrasena = $input['password_hash'] ?? $input['contrasena'] ?? null;

        if (empty($email) || empty($contrasena)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Error de credenciales: Campos incompletos"
            ]);
            exit;
        }

        try {
            $db = Database::getInstance();

            // Consulta segura con preparacion de sentencias, previene inyeciones sql
            $stmt = $db->prepare("SELECT id_usuario, nombre_usuario, email, contrasena, rol FROM usuarios WHERE email = :email LIMIT 1");
            $stmt->execute([':email' => $email]);
            $usuario = $stmt->fetch();

            // verifica existencia y validacion de hash nativo de contraseña
            if (!$usuario || !password_verify($contrasena, $usuario['contrasena'])) {
                http_response_code(404);
                echo json_encode([
                    "success" => false,
                    "message" => "Error de credenciales: Usuario o contraseña incorrectos"
                ]);
                exit;
            }

            // Generación del Payload e inclusión del Token JWT
            $tokenPayload = [
                "id_usuario" => $usuario['id_usuario'],
                "nombre_usuario" => $usuario['nombre_usuario'],
                "email" => $usuario['email'],
                "rol" => $usuario['rol']
            ];
            $token = JWTHelper::encode($tokenPayload);

            // Respuesta JSON Final
            http_response_code(200);
            echo json_encode([
                "success" => true, // true o false
                "message" => "Login exitoso",
                "token" => $token, // Incluido en formato Bearer listo para el header
                "id_usuario" => (int)$usuario['id_usuario'],
                "nombre_usuario" => $usuario['nombre_usuario'],
                "email" => $usuario['email'],
                "rol" => $usuario['rol']
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Error interno en el servidor: " . $e->getMessage()
            ]);
        }
    }

    public function registrarUsuario() {
        // Configuracion de cabeceras CORS (RNF04, RNF06)
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json; charset=UTF-8");
        header("Access-Control-Allow-Methods: POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

        // Soporte para Preflight OPTIONS
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Método no permitido"]);
            exit;
        }

        // Captura y decodifica el JSON entrante
        $input = json_decode(file_get_contents("php://input"), true);

        $nombre = $input['nombre_usuario'] ?? null;
        $email = $input['email'] ?? null;
        $contrasena = $input['contrasena'] ?? null;
        $rol = $input['rol'] ?? 'colaborador'; // Si el front no manda rol por defecto es colaborador

        // Validacion de campos obligatorios
        if (empty($nombre) || empty($email) || empty($contrasena)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Faltan datos obligatorios (nombre_usuario, email o contrasena)"
            ]);
            exit;
        }

        try {
            $db = Database::getInstance();

            // Verifica si el email ya existe en la BDD
            $checkStmt = $db->prepare("SELECT id_usuario FROM usuarios WHERE email = :email LIMIT 1");
            $checkStmt->execute([':email' => $email]);
            if ($checkStmt->fetch()) {
                http_response_code(409); // 409 Conflict
                echo json_encode([
                    "success" => false,
                    "message" => "El correo electrónico ya está registrado"
                ]);
                exit;
            }

            // HASHEAR LA CONTRASEÑA AUTOMÁTICAMENTE
            // PASSWORD_BCRYPT genera el hash seguro de 60 caracteres que machea con password_verify
            $contrasenaHasheada = password_hash($contrasena, PASSWORD_BCRYPT);

            // Inserta el nuevo usuario en la base de datos
            $sql = "INSERT INTO usuarios (nombre_usuario, email, contrasena, rol) 
                    VALUES (:nombre, :email, :contrasena, :rol)";
            
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':nombre' => $nombre,
                ':email' => $email,
                ':contrasena' => $contrasenaHasheada,
                ':rol' => $rol
            ]);

            // Obtiene el ID del usuario recién creado
            $idCreado = $db->lastInsertId();

            // Respuesta w (201 Created)
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Usuario registrado con éxito",
                "id_usuario" => (int)$idCreado
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Error interno al registrar usuario: " . $e->getMessage()
            ]);
        }
    }
}