<?php
// backend/controllers/ReservaController.php
require_once __DIR__ . '/../config/Database.php';

class ReservaController {

    public function crearReserva() {
        // Cabeceras CORS obligatorias (RNF04, RNF06)
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json; charset=UTF-8");
        header("Access-Control-Allow-Methods: POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Método no permitido"]);
            exit;
        }

        $input = json_decode(file_get_contents("php://input"), true);

        // Datos troncales obligatorios para cualquier reserva
        $id_visita = $input['id_visita'] ?? null;
        $tipo_visita = $input['tipo_visita'] ?? null; // 'Publica' o 'Institucional'

        if (empty($id_visita) || empty($tipo_visita)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Faltan datos troncales: id_visita y tipo_visita son requeridos."]);
            exit;
        }

        try {
            $db = Database::getInstance();
            
            // -----------------------------------------------------------------
            // 1. INICIAR TRANSACCIÓN (Bloquea las tablas para evitar fallos de cupo concurrentes)
            // -----------------------------------------------------------------
            $db->beginTransaction();

            // 2. Verificar existencia de la visita y traer cupos actuales
            $stmtVisita = $db->prepare("SELECT cupo_maximo, cupo_actual, tipo_visita FROM visitas_programadas WHERE id_visita = :id LIMIT 1 FOR UPDATE");
            $stmtVisita->execute([':id' => $id_visita]);
            $visita = $stmtVisita->fetch();

            if (!$visita) {
                $db->rollBack();
                http_response_code(444);
                echo json_encode(["success" => false, "message" => "La visita seleccionada no existe."]);
                exit;
            }

            // Validar que el usuario no mande datos de 'Publica' a una visita agendada como 'Institucional'
            if ($visita['tipo_visita'] !== $tipo_visita) {
                $db->rollBack();
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "El tipo de reserva no coincide con el tipo de visita programada."]);
                exit;
            }

            // -----------------------------------------------------------------
            // 3. LOGICA CONDICIONAL SEGÚN EL TIPO DE VISITA
            // -----------------------------------------------------------------
            if ($tipo_visita === 'Publica') {
                // Captura de datos para reservas_publicas
                $nombre = $input['nombre'] ?? null;
                $apellido = $input['apellido'] ?? null;
                $email = $input['email'] ?? null;
                $telefono = $input['telefono'] ?? null;
                $cantidad = isset($input['cantidad_personas']) ? (int)$input['cantidad_personas'] : 0;

                if (empty($nombre) || empty($apellido) || empty($email) || $cantidad <= 0) {
                    $db->rollBack();
                    http_response_code(400);
                    echo json_encode(["success" => false, "message" => "Campos públicos incompletos o cantidad inválida."]);
                    exit;
                }

                // Verificar cupo disponible
                if (($visita['cupo_actual'] + $cantidad) > $visita['cupo_maximo']) {
                    $db->rollBack();
                    http_response_code(409); // Conflict
                    echo json_encode(["success" => false, "message" => "Cupo insuficiente. Lugares disponibles: " . ($visita['cupo_maximo'] - $visita['cupo_actual'])]);
                    exit;
                }

                // Insertar en reservas_publicas
                $sqlInsert = "INSERT INTO reservas_publicas (id_visita, nombre, apellido, email, telefono, cantidad_personas) 
                              VALUES (:id_visita, :nombre, :apellido, :email, :telefono, :cantidad)";
                $stmtInsert = $db->prepare($sqlInsert);
                $stmtInsert->execute([
                    ':id_visita' => $id_visita,
                    ':nombre' => $nombre,
                    ':apellido' => $apellido,
                    ':email' => $email,
                    ':telefono' => $telefono,
                    ':cantidad' => $cantidad
                ]);

            } else if ($tipo_visita === 'Institucional') {
                // Captura de datos para reservas_institucionales
                $nombre_institucion = $input['nombre_institucion'] ?? null;
                $grado_curso = $input['grado_curso'] ?? null;
                $cantidad = isset($input['cantidad_alumnos']) ? (int)$input['cantidad_alumnos'] : 0;
                $nombre_docente = $input['nombre_docente'] ?? null;
                $apellido_docente = $input['apellido_docente'] ?? null;
                $email_contacto = $input['email_contacto'] ?? null;
                $telefono_contacto = $input['telefono_contacto'] ?? null;

                if (empty($nombre_institucion) || empty($grado_curso) || empty($nombre_docente) || empty($apellido_docente) || empty($email_contacto) || $cantidad <= 0) {
                    $db->rollBack();
                    http_response_code(400);
                    echo json_encode(["success" => false, "message" => "Campos institucionales incompletos."]);
                    exit;
                }

                // Verificar cupo disponible
                if (($visita['cupo_actual'] + $cantidad) > $visita['cupo_maximo']) {
                    $db->rollBack();
                    http_response_code(409);
                    echo json_encode(["success" => false, "message" => "La cantidad de alumnos excede el cupo disponible de la visita."]);
                    exit;
                }

                // Insertar en reservas_institucionales (Con tus campos atomizados)
                $sqlInsert = "INSERT INTO reservas_institucionales (id_visita, nombre_institucion, grado_curso, cantidad_alumnos, nombre_docente, apellido_docente, email_contacto, telefono_contacto) 
                              VALUES (:id_visita, :inst, :curso, :cantidad, :nom_doc, :ape_doc, :email, :tel)";
                $stmtInsert = $db->prepare($sqlInsert);
                $stmtInsert->execute([
                    ':id_visita' => $id_visita,
                    ':inst' => $nombre_institucion,
                    ':curso' => $grado_curso,
                    ':cantidad' => $cantidad,
                    ':nom_doc' => $nombre_docente,
                    ':ape_doc' => $apellido_docente,
                    ':email' => $email_contacto,
                    ':tel' => $telefono_contacto
                ]);
            } else {
                $db->rollBack();
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Tipo de visita no válido."]);
                exit;
            }

            // -----------------------------------------------------------------
            // 4. ACTUALIZAR CUPO ACTUAL EN VISITAS_PROGRAMADAS
            // -----------------------------------------------------------------
            $stmtUpdateCupo = $db->prepare("UPDATE visitas_programadas SET cupo_actual = cupo_actual + :cant WHERE id_visita = :id");
            $stmtUpdateCupo->execute([
                ':cant' => $cantidad,
                ':id' => $id_visita
            ]);

            // Si todo salió joya, consolidamos los cambios en la BDD
            $db->commit();

            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "¡Reserva completada con éxito! Cupo actualizado."
            ]);

        } catch (Exception $e) {
            // Si algo explota en el medio, se cancela todo y la BDD queda intacta
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Error de servidor al procesar la reserva: " . $e->getMessage()
            ]);
        }
    }
}