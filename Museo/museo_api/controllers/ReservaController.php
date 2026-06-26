<?php
require_once __DIR__ . '/../config/database.php';

class ReservaController {
    private function sendJson($statusCode, $payload) {
        http_response_code($statusCode);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }

    private function sendValidationError($errors, $message = 'Error de validación en los datos enviados.') {
        $this->sendJson(400, [
            'status' => 'error',
            'code' => 'BAD_REQUEST',
            'message' => $message,
            'errors' => $errors
        ]);
    }

    private function ensureSchema(PDO $db) {
        $db->exec("CREATE TABLE IF NOT EXISTS reservas_publicas (
            id_reserva_pub INT AUTO_INCREMENT PRIMARY KEY,
            id_visita INT NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            apellido VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL,
            dni VARCHAR(20) NOT NULL,
            telefono VARCHAR(50) DEFAULT NULL,
            cantidad_personas INT NOT NULL,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_visita) REFERENCES visitas_programadas(id_visita) ON DELETE CASCADE
        ) ENGINE=InnoDB");

        $db->exec("CREATE TABLE IF NOT EXISTS reservas_publicas_personas (
            id_persona INT AUTO_INCREMENT PRIMARY KEY,
            id_reserva_pub INT NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            apellido VARCHAR(100) NOT NULL,
            dni VARCHAR(20) NOT NULL,
            FOREIGN KEY (id_reserva_pub) REFERENCES reservas_publicas(id_reserva_pub) ON DELETE CASCADE
        ) ENGINE=InnoDB");

        $db->exec("CREATE TABLE IF NOT EXISTS reservas_institucionales (
            id_reserva_inst INT AUTO_INCREMENT PRIMARY KEY,
            id_visita INT NOT NULL,
            nombre_institucion VARCHAR(150) NOT NULL,
            tipo_institucion ENUM('Escuela','Institucion') NOT NULL DEFAULT 'Escuela',
            cue VARCHAR(9) DEFAULT NULL,
            cantidad_alumnos INT NOT NULL,
            nombre_responsable VARCHAR(100) NOT NULL,
            apellido_responsable VARCHAR(100) NOT NULL,
            email_contacto VARCHAR(150) NOT NULL,
            telefono_contacto VARCHAR(50) NOT NULL,
            dni_responsable VARCHAR(20) NOT NULL,
            estado ENUM('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_visita) REFERENCES visitas_programadas(id_visita) ON DELETE CASCADE
        ) ENGINE=InnoDB");

        $stmt = $db->query("SHOW COLUMNS FROM reservas_institucionales LIKE 'estado'");
        if ($stmt->rowCount() === 0) {
            $db->exec("ALTER TABLE reservas_institucionales ADD COLUMN estado ENUM('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente'");
        }
    }

    public function listarVisitasDisponibles() {
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json; charset=UTF-8");
        header("Access-Control-Allow-Methods: GET");
        header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendJson(405, ['success' => false, 'message' => 'Método no permitido']);
        }

        try {
            $db = Database::getInstance();
            $sql = "SELECT id_visita, fecha_hora, tipo_visita, cupo_maximo, cupo_actual
                    FROM visitas_programadas
                    WHERE fecha_hora >= NOW()
                      AND cupo_actual < cupo_maximo
                    ORDER BY fecha_hora ASC";

            $stmt = $db->query($sql);
            $visitas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->sendJson(200, ['success' => true, 'visitas_disponibles' => $visitas]);
        } catch (Exception $e) {
            $this->sendJson(500, ['success' => false, 'message' => 'Error al obtener visitas: ' . $e->getMessage()]);
        }
    }

    public function cambiarEstadoReservaInstitucional() {
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json; charset=UTF-8");
        header("Access-Control-Allow-Methods: POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendJson(405, ['success' => false, 'message' => 'Método no permitido']);
        }

        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true);
        if (!is_array($input)) {
            parse_str($rawInput, $parsedInput);
            $input = !empty($parsedInput) ? $parsedInput : $_POST;
        }

        $idReserva = isset($input['id_reserva_inst']) ? (int)$input['id_reserva_inst'] : null;
        $accion = strtolower(trim((string)($input['action'] ?? $input['accion'] ?? '')));

        if (!$idReserva || !in_array($accion, ['aprobar', 'rechazar'], true)) {
            $this->sendValidationError([
                ['field' => 'id_reserva_inst', 'message' => 'La reserva institucional es obligatoria.'],
                ['field' => 'action', 'message' => 'La acción debe ser aprobar o rechazar.']
            ], 'Faltan datos para cambiar el estado de la reserva institucional.');
        }

        try {
            $db = Database::getInstance();
            $this->ensureSchema($db);
            $db->beginTransaction();

            $stmt = $db->prepare("SELECT id_visita, cantidad_alumnos, estado FROM reservas_institucionales WHERE id_reserva_inst = :id LIMIT 1 FOR UPDATE");
            $stmt->execute([':id' => $idReserva]);
            $reserva = $stmt->fetch();

            if (!$reserva) {
                $db->rollBack();
                $this->sendJson(404, ['status' => 'error', 'code' => 'NOT_FOUND', 'message' => 'No existe una reserva institucional con ese id.']);
            }

            if ($reserva['estado'] !== 'pendiente') {
                $db->rollBack();
                $this->sendJson(400, ['status' => 'error', 'code' => 'BAD_REQUEST', 'message' => 'La reserva ya fue procesada previamente.']);
            }

            if ($accion === 'aprobar') {
                $stmtUpdate = $db->prepare("UPDATE visitas_programadas SET cupo_actual = cupo_actual + :cant WHERE id_visita = :id");
                $stmtUpdate->execute([':cant' => (int)$reserva['cantidad_alumnos'], ':id' => (int)$reserva['id_visita']]);
                $db->exec("UPDATE reservas_institucionales SET estado = 'aprobada' WHERE id_reserva_inst = {$idReserva}");
                $db->commit();
                $this->sendJson(200, ['status' => 'success', 'message' => 'Reserva institucional aprobada.', 'data' => ['id_reserva_inst' => $idReserva, 'estado' => 'aprobada']]);
            }

            $db->exec("UPDATE reservas_institucionales SET estado = 'rechazada' WHERE id_reserva_inst = {$idReserva}");
            $db->commit();
            $this->sendJson(200, ['status' => 'success', 'message' => 'Reserva institucional rechazada.', 'data' => ['id_reserva_inst' => $idReserva, 'estado' => 'rechazada']]);
        } catch (Exception $e) {
            if (isset($db) && $db->inTransaction()) {
                $db->rollBack();
            }
            $this->sendJson(500, ['status' => 'error', 'code' => 'SERVER_ERROR', 'message' => 'Error al actualizar el estado: ' . $e->getMessage()]);
        }
    }

    public function registrarReserva() {
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json; charset=UTF-8");
        header("Access-Control-Allow-Methods: POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendJson(405, ['success' => false, 'message' => 'Método no permitido']);
        }

        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true);
        if (!is_array($input)) {
            parse_str($rawInput, $parsedInput);
            $input = !empty($parsedInput) ? $parsedInput : $_POST;
        }

        $id_visita = isset($input['id_visita']) ? (int)$input['id_visita'] : null;
        $tipo_solicitado = $input['tipo_visita'] ?? null;

        if (is_string($tipo_solicitado)) {
            $tipo = strtolower(trim($tipo_solicitado));
            if (in_array($tipo, ['personal', 'publica', 'publico', 'public'])) {
                $tipo_solicitado = 'Publica';
            } elseif (in_array($tipo, ['institucional', 'escolar', 'escuela'])) {
                $tipo_solicitado = 'Institucional';
            }
        }

        if (empty($id_visita) || empty($tipo_solicitado) || !in_array($tipo_solicitado, ['Publica', 'Institucional'])) {
            $this->sendValidationError([
                ['field' => 'id_visita', 'message' => 'La visita es obligatoria.'],
                ['field' => 'tipo_visita', 'message' => 'El tipo de reserva es inválido.']
            ], 'Faltan parámetros o tipo de reserva inválido.');
        }

        try {
            $db = Database::getInstance();
            $this->ensureSchema($db);
            $db->beginTransaction();

            $stmtVisita = $db->prepare("SELECT cupo_maximo, cupo_actual, tipo_visita FROM visitas_programadas WHERE id_visita = :id LIMIT 1 FOR UPDATE");
            $stmtVisita->execute([':id' => $id_visita]);
            $visita = $stmtVisita->fetch();

            if (!$visita) {
                $db->rollBack();
                $this->sendJson(404, ['status' => 'error', 'code' => 'NOT_FOUND', 'message' => 'No existe ninguna visita registrada con el id_visita: ' . $id_visita]);
            }

            if (strtolower($visita['tipo_visita']) !== strtolower($tipo_solicitado)) {
                $db->rollBack();
                $this->sendValidationError([
                    ['field' => 'tipo_visita', 'message' => 'El tipo de reserva no coincide con el tipo de visita configurado por el museo.']
                ], 'El tipo de reserva no coincide con el tipo de visita configurado por el museo.');
            }

            if ($tipo_solicitado === 'Publica') {
                $nombre = trim((string)($input['nombre'] ?? ''));
                $apellido = trim((string)($input['apellido'] ?? ''));
                $email = trim((string)($input['email'] ?? ''));
                $dni = trim((string)($input['dni'] ?? ''));
                $telefono = trim((string)($input['telefono'] ?? ''));
                $cantidad = isset($input['cantidad_personas']) ? (int)$input['cantidad_personas'] : 1;
                $personas = isset($input['personas']) && is_array($input['personas']) ? $input['personas'] : [];

                if ($cantidad <= 0) {
                    $db->rollBack();
                    $this->sendValidationError([['field' => 'cantidad_personas', 'message' => 'La cantidad de personas debe ser mayor a 0.']], 'Error de validación en los datos enviados.');
                }

                if (empty($nombre) || empty($apellido) || empty($email) || empty($dni)) {
                    $db->rollBack();
                    $this->sendValidationError([
                        ['field' => 'nombre', 'message' => 'El nombre es obligatorio.'],
                        ['field' => 'apellido', 'message' => 'El apellido es obligatorio.'],
                        ['field' => 'email', 'message' => 'El correo electrónico es obligatorio.'],
                        ['field' => 'dni', 'message' => 'El DNI es obligatorio.']
                    ], 'Faltan datos obligatorios del titular de la reserva.');
                }

                if (empty($personas)) {
                    $personas = [[
                        'nombre' => $nombre,
                        'apellido' => $apellido,
                        'dni' => $dni
                    ]];
                }

                $personasNormalizadas = [];
                foreach ($personas as $persona) {
                    if (!is_array($persona)) {
                        continue;
                    }
                    $personaNombre = trim((string)($persona['nombre'] ?? ''));
                    $personaApellido = trim((string)($persona['apellido'] ?? ''));
                    $personaDni = trim((string)($persona['dni'] ?? ''));
                    if ($personaNombre !== '' && $personaApellido !== '' && $personaDni !== '') {
                        $personasNormalizadas[] = [
                            'nombre' => $personaNombre,
                            'apellido' => $personaApellido,
                            'dni' => $personaDni
                        ];
                    }
                }

                if (count($personasNormalizadas) !== $cantidad) {
                    $db->rollBack();
                    $this->sendValidationError([
                        ['field' => 'personas', 'message' => 'La cantidad de personas no coincide con la información cargada.']
                    ], 'La cantidad de personas no coincide con la información cargada.');
                }

                if (($visita['cupo_actual'] + $cantidad) > $visita['cupo_maximo']) {
                    $db->rollBack();
                    $this->sendJson(409, ['status' => 'error', 'code' => 'CUP_FULL', 'message' => 'Cupo insuficiente. Lugares disponibles: ' . ($visita['cupo_maximo'] - $visita['cupo_actual'])]);
                }

                $stmtPub = $db->prepare("INSERT INTO reservas_publicas (id_visita, nombre, apellido, email, dni, telefono, cantidad_personas) VALUES (:id_visita, :nombre, :apellido, :email, :dni, :telefono, :cantidad)");
                $stmtPub->execute([
                    ':id_visita' => $id_visita,
                    ':nombre' => $nombre,
                    ':apellido' => $apellido,
                    ':email' => $email,
                    ':dni' => $dni,
                    ':telefono' => $telefono ?: null,
                    ':cantidad' => $cantidad
                ]);
                $idReserva = (int)$db->lastInsertId();

                $stmtPersona = $db->prepare("INSERT INTO reservas_publicas_personas (id_reserva_pub, nombre, apellido, dni) VALUES (:id_reserva_pub, :nombre, :apellido, :dni)");
                foreach ($personasNormalizadas as $persona) {
                    $stmtPersona->execute([
                        ':id_reserva_pub' => $idReserva,
                        ':nombre' => $persona['nombre'],
                        ':apellido' => $persona['apellido'],
                        ':dni' => $persona['dni']
                    ]);
                }

                $stmtUpdate = $db->prepare("UPDATE visitas_programadas SET cupo_actual = cupo_actual + :cant WHERE id_visita = :id");
                $stmtUpdate->execute([':cant' => $cantidad, ':id' => $id_visita]);

                $db->commit();
                $this->sendJson(201, [
                    'status' => 'success',
                    'message' => 'Reserva pública creada con éxito.',
                    'data' => [
                        'id_reserva_pub' => $idReserva,
                        'id_visita' => $id_visita,
                        'nombre' => $nombre,
                        'apellido' => $apellido,
                        'email' => $email,
                        'dni' => $dni,
                        'telefono' => $telefono ?: null,
                        'cantidad_personas' => $cantidad,
                        'personas' => $personasNormalizadas
                    ]
                ]);
            }

            if ($tipo_solicitado === 'Institucional') {
                $nombre_institucion = trim((string)($input['nombre_institucion'] ?? $input['institucion'] ?? ''));
                $tipo_institucion = trim((string)($input['tipo_institucion'] ?? 'Escuela'));
                $cue = trim((string)($input['cue'] ?? '')) ?: null;
                $cantidad_alumnos = isset($input['cantidad_alumnos']) ? (int)$input['cantidad_alumnos'] : (isset($input['alumnos']) ? (int)$input['alumnos'] : 0);
                $nombre_responsable = trim((string)($input['nombre_responsable'] ?? $input['docente_nombre'] ?? $input['referente_nombre'] ?? ''));
                $apellido_responsable = trim((string)($input['apellido_responsable'] ?? $input['docente_apellido'] ?? $input['referente_apellido'] ?? ''));
                $email_contacto = trim((string)($input['email_contacto'] ?? $input['email_institucional'] ?? $input['email_institucional2'] ?? ''));
                $telefono_contacto = trim((string)($input['telefono_contacto'] ?? $input['tel_institucional'] ?? $input['tel_institucional2'] ?? ''));
                $dni_responsable = trim((string)($input['dni_responsable'] ?? ''));

                if (empty($nombre_institucion) || empty($nombre_responsable) || empty($apellido_responsable) || empty($email_contacto) || $cantidad_alumnos <= 0 || empty($dni_responsable)) {
                    $db->rollBack();
                    $this->sendValidationError([
                        ['field' => 'nombre_institucion', 'message' => 'La institución es obligatoria.'],
                        ['field' => 'nombre_responsable', 'message' => 'El responsable es obligatorio.'],
                        ['field' => 'email_contacto', 'message' => 'El correo de contacto es obligatorio.'],
                        ['field' => 'cantidad_alumnos', 'message' => 'La cantidad de alumnos debe ser mayor a 0.'],
                        ['field' => 'dni_responsable', 'message' => 'El DNI del responsable es obligatorio.']
                    ], 'Faltan datos obligatorios del formulario institucional.');
                }

                $stmtInst = $db->prepare("INSERT INTO reservas_institucionales (id_visita, nombre_institucion, tipo_institucion, cue, cantidad_alumnos, nombre_responsable, apellido_responsable, email_contacto, telefono_contacto, dni_responsable, estado) VALUES (:id_visita, :nombre_institucion, :tipo_institucion, :cue, :cantidad_alumnos, :nombre_responsable, :apellido_responsable, :email_contacto, :telefono_contacto, :dni_responsable, :estado)");
                $stmtInst->execute([
                    ':id_visita' => $id_visita,
                    ':nombre_institucion' => $nombre_institucion,
                    ':tipo_institucion' => in_array($tipo_institucion, ['Escuela', 'Institucion']) ? $tipo_institucion : 'Escuela',
                    ':cue' => $cue,
                    ':cantidad_alumnos' => $cantidad_alumnos,
                    ':nombre_responsable' => $nombre_responsable,
                    ':apellido_responsable' => $apellido_responsable,
                    ':email_contacto' => $email_contacto,
                    ':telefono_contacto' => $telefono_contacto ?: null,
                    ':dni_responsable' => $dni_responsable,
                    ':estado' => 'pendiente'
                ]);

                $idReservaInst = (int)$db->lastInsertId();
                $estadoReserva = (($visita['cupo_actual'] + $cantidad_alumnos) <= $visita['cupo_maximo']) ? 'aprobada' : 'pendiente';

                if ($estadoReserva === 'aprobada') {
                    $stmtUpdate = $db->prepare("UPDATE visitas_programadas SET cupo_actual = cupo_actual + :cant WHERE id_visita = :id");
                    $stmtUpdate->execute([':cant' => $cantidad_alumnos, ':id' => $id_visita]);
                }

                $db->prepare("UPDATE reservas_institucionales SET estado = :estado WHERE id_reserva_inst = :id")->execute([
                    ':estado' => $estadoReserva,
                    ':id' => $idReservaInst
                ]);

                $db->commit();
                $this->sendJson(201, [
                    'status' => 'success',
                    'message' => $estadoReserva === 'aprobada' ? 'Reserva institucional creada con éxito.' : 'Reserva institucional registrada y pendiente de aprobación por el administrador.',
                    'data' => [
                        'id_reserva_inst' => $idReservaInst,
                        'id_visita' => $id_visita,
                        'nombre_institucion' => $nombre_institucion,
                        'tipo_institucion' => in_array($tipo_institucion, ['Escuela', 'Institucion']) ? $tipo_institucion : 'Escuela',
                        'cue' => $cue,
                        'cantidad_alumnos' => $cantidad_alumnos,
                        'nombre_responsable' => $nombre_responsable,
                        'apellido_responsable' => $apellido_responsable,
                        'email_contacto' => $email_contacto,
                        'telefono_contacto' => $telefono_contacto ?: null,
                        'dni_responsable' => $dni_responsable,
                        'estado' => $estadoReserva
                    ]
                ]);
            }
        } catch (Exception $e) {
            if (isset($db) && $db->inTransaction()) {
                $db->rollBack();
            }
            $this->sendJson(500, ['status' => 'error', 'code' => 'SERVER_ERROR', 'message' => 'Error crítico interno en el controlador: ' . $e->getMessage()]);
        }
    }
}