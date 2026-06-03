<?php
class Visita {
    private $conn;
    private $table_name = 'VISITAS_PROGRAMADAS';

    public function __construct($db) {
        $this->conn = $db;
    }
}
