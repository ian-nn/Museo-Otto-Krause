<?php
class Vitrina {
    private $conn;
    private $table_name = 'VITRINAS';

    public function __construct($db) {
        $this->conn = $db;
    }
}
