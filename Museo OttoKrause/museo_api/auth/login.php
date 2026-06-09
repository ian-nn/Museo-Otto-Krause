<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'JSON inválido']);
    exit();
}

$username = isset($data['username']) ? trim($data['username']) : '';
$password = isset($data['password']) ? trim($data['password']) : '';

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Usuario y contraseña son requeridos']);
    exit();
}

// Nota: Se elimina la validación estricta de formato de correo aquí para permitir
// nombres de usuario de respaldo (por ejemplo 'admin') y evitar respuestas 422
// que interrumpen el flujo del cliente. La existencia del usuario se valida
// contra la base de datos y las cuentas de ejemplo más abajo.

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No se pudo conectar a la base de datos']);
    exit();
}

try {
    // Buscar por email o por nombre de usuario según el esquema proporcionado
    $stmt = $conn->prepare('SELECT id_usuario, nombre_usuario, email, contrasena, rol FROM usuarios WHERE email = :user OR nombre_usuario = :user LIMIT 1');
    $stmt->bindParam(':user', $username, PDO::PARAM_STR);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Error al consultar la base de datos (no exponer detalles al cliente)
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al consultar el usuario']);
    exit();
}

$authenticated = false;
$role = 'colaborador';

if ($user) {
    $stored = $user['contrasena'] ?? '';
    // Preferir verificación segura con password_verify si la contraseña está hasheada.
    if ($stored !== '' && (password_verify($password, $stored) || $password === $stored)) {
        $authenticated = true;
        $role = $user['rol'] ?? 'colaborador';
        // Mostrar nombre de usuario real en la respuesta si está disponible
        $username = $user['nombre_usuario'] ?? $user['email'] ?? $username;
    }
}

// No se permiten cuentas de ejemplo en producción; si no está autenticado, fallará abajo.


if (!$authenticated) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas']);
    exit();
}

$token = bin2hex(random_bytes(32));

echo json_encode([
    'success' => true,
    'message' => 'Autenticación exitosa',
    'token' => $token,
    'user' => [
        'username' => $username,
        'role' => $role,
    ],
]);
exit();
