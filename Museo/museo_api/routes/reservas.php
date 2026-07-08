<?php
// backend/api/reservas.php

require_once __DIR__ . '/../controllers/ReservasController.php';

$reserva = new ReservasController();
$reserva->crearReserva();