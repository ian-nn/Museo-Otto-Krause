<?php
class Database {
    private static $instance = null;
    private $conn;

    private function __construct() {
        // Configuración para XAMPP (modificable)
        $host = 'localhost';
        $db   = 'museo_db'; //YO LA NOMBRE ASI PORQUE QUISE PERO SE PUEDE CAMBIAR EL NOMBRE
        $user = 'root';      
        $pass = '';          
        $charset = 'utf8';

        // DSN para MySQL
        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        
        // Para pasar a PostgreSQL cambiar a: $dsn = "pgsql:host=$host;dbname=$db";

        try {
            $this->conn = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Error de conexión a la base de datos: " . $e->getMessage()
            ]);
            exit;
        }
    }

    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new Database();
        }
        return self::$instance->conn;
    }
}