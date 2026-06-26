<?php
// backend/api/obtener_visitas.php

require_once __DIR__ . '/../controllers/ReservaController.php';

$reserva = new ReservaController();
$reserva->listarVisitasDisponibles();