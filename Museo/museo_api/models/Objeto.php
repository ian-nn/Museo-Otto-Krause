<?php
class Objeto {
    private $conn;
    private $table_name = 'OBJETOS';

    public function __construct($db) {
        $this->conn = $db;
    }
}
