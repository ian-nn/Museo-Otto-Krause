<?php
class Usuario {
    private $conn;
    private $table_name = 'USUARIOS';

    public function __construct($db) {
        $this->conn = $db;
    }
}
