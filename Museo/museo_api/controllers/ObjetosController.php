<?php
require_once __DIR__ . '/../config/database.php';

class ObjetosController {
    private $db;
    private $tableName = 'OBJETOS';
    private $bridgeTable = 'objeto_materiales';
    private $historyTable = 'historial_ubicaciones';

    public function __construct() {
        $this->db = Database::getInstance();
    }

    private function sendJson(int $statusCode, array $payload): void {
        http_response_code($statusCode);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }

    private function getInputData(): array {
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        if (!is_array($data)) {
            parse_str($rawInput, $parsedInput);
            $data = !empty($parsedInput) ? $parsedInput : $_POST;
        }

        return is_array($data) ? $data : [];
    }

    private function validateCreateData(array $data): array {
        $required = [
            'codigo_actual',
            'nombre_objeto',
            'descripcion',
            'estado_conservacion',
            'fecha_ingreso',
            'id_piso',
            'id_sala',
            'id_categoria',
            'id_coleccion',
            'id_epoca',
            'materiales'
        ];

        $errors = [];
        foreach ($required as $field) {
            if ($field === 'materiales') {
                if (!isset($data[$field]) || !is_array($data[$field]) || empty($data[$field])) {
                    $errors[] = "El campo {$field} es obligatorio y debe ser un arreglo de identificadores.";
                }
                continue;
            }

            if (!isset($data[$field]) || trim((string)$data[$field]) === '') {
                $errors[] = "El campo {$field} es obligatorio.";
            }
        }

        if (isset($data['materiales']) && !is_array($data['materiales'])) {
            $errors[] = 'El campo materiales debe ser un arreglo de identificadores.';
        }

        $numericFields = ['id_piso', 'id_sala', 'id_categoria', 'id_coleccion', 'id_epoca'];
        foreach ($numericFields as $field) {
            if (isset($data[$field]) && !is_numeric($data[$field])) {
                $errors[] = "El campo {$field} debe ser un número válido.";
            }
        }

        if (isset($data['fecha_ingreso']) && !$this->isValidDate($data['fecha_ingreso'])) {
            $errors[] = 'El campo fecha_ingreso debe tener formato YYYY-MM-DD.';
        }

        return $errors;
    }

    private function validateUpdateData(array $data): array {
        $errors = [];

        if (empty($data['id_objeto'])) {
            $errors[] = 'El campo id_objeto es obligatorio.';
        }

        if (isset($data['materiales']) && !is_array($data['materiales'])) {
            $errors[] = 'El campo materiales debe ser un arreglo de identificadores.';
        }

        if (isset($data['fecha_ingreso']) && !$this->isValidDate($data['fecha_ingreso'])) {
            $errors[] = 'El campo fecha_ingreso debe tener formato YYYY-MM-DD.';
        }

        return array_merge($errors, $this->validateCreateData($data));
    }

    private function validateDeleteData(array $data): array {
        return empty($data['id_objeto']) ? ['El campo id_objeto es obligatorio.'] : [];
    }

    private function isValidDate(string $value): bool {
        $date = DateTime::createFromFormat('Y-m-d', $value);
        return $date && $date->format('Y-m-d') === $value;
    }

    private function getObjetoById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM {$this->tableName} WHERE id_objeto = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch();
        return $result === false ? null : $result;
    }

    private function inventoryNumberExists(string $codigoActual, ?int $excludeId = null): bool {
        $sql = "SELECT id_objeto FROM {$this->tableName} WHERE codigo_actual = :codigo_actual";
        if ($excludeId !== null) {
            $sql .= " AND id_objeto != :exclude_id";
        }

        $stmt = $this->db->prepare($sql);
        $params = [':codigo_actual' => $codigoActual];
        if ($excludeId !== null) {
            $params[':exclude_id'] = $excludeId;
        }

        $stmt->execute($params);
        return (bool)$stmt->fetch();
    }

    private function insertObjetoMateriales(int $idObjeto, array $materiales): void {
        if (empty($materiales)) {
            return;
        }

        $stmt = $this->db->prepare("INSERT INTO {$this->bridgeTable} (id_objeto, id_material) VALUES (:id_objeto, :id_material)");
        foreach ($materiales as $materialId) {
            $materialId = (int)$materialId;
            if ($materialId <= 0) {
                continue;
            }
            $stmt->execute([':id_objeto' => $idObjeto, ':id_material' => $materialId]);
        }
    }

    private function deleteObjetoMateriales(int $idObjeto): void {
        $stmt = $this->db->prepare("DELETE FROM {$this->bridgeTable} WHERE id_objeto = :id_objeto");
        $stmt->execute([':id_objeto' => $idObjeto]);
    }

    private function locationChanged(array $old, array $new): bool {
        $fields = ['id_piso', 'id_sala', 'id_vitrina', 'id_cajon'];
        foreach ($fields as $field) {
            $oldValue = $old[$field] ?? null;
            $newValue = $new[$field] ?? null;
            if ($oldValue !== $newValue) {
                return true;
            }
        }
        return false;
    }

    private function recordLocationHistory(int $idObjeto, array $locationData, int $idUsuarioCambio): void {
        $stmt = $this->db->prepare("INSERT INTO {$this->historyTable} (id_objeto, id_usuario_cambio, fecha_cambio, id_piso, id_sala, id_vitrina, id_cajon)
            VALUES (:id_objeto, :id_usuario_cambio, NOW(), :id_piso, :id_sala, :id_vitrina, :id_cajon)");
        $stmt->execute([
            ':id_objeto' => $idObjeto,
            ':id_usuario_cambio' => $idUsuarioCambio,
            ':id_piso' => $locationData['id_piso'],
            ':id_sala' => $locationData['id_sala'],
            ':id_vitrina' => $locationData['id_vitrina'],
            ':id_cajon' => $locationData['id_cajon']
        ]);
    }

    public function createObjeto(): void {
        $data = $this->getInputData();
        if (empty($data)) {
            $this->sendJson(400, ['success' => false, 'message' => 'Faltan parámetros requeridos para procesar la acción.']);
        }

        $errors = $this->validateCreateData($data);
        if (!empty($errors)) {
            $this->sendJson(400, ['success' => false, 'message' => 'Faltan parámetros requeridos para procesar la acción.', 'errors' => $errors]);
        }

        if ($this->inventoryNumberExists($data['codigo_actual'])) {
            $this->sendJson(409, ['success' => false, 'message' => 'El código actual ingresado ya se encuentra registrado por otro objeto.']);
        }

        try {
            $this->db->beginTransaction();

            $sql = "INSERT INTO {$this->tableName} (
                codigo_actual,
                codigo_antiguo,
                codigo_sigaf,
                codigo_fisico,
                nombre_objeto,
                descripcion,
                estado_conservacion,
                fecha_ingreso,
                activo,
                id_piso,
                id_sala,
                id_vitrina,
                id_cajon,
                id_categoria,
                id_coleccion,
                id_autor,
                id_propietario,
                id_donador,
                id_epoca
            ) VALUES (
                :codigo_actual,
                :codigo_antiguo,
                :codigo_sigaf,
                :codigo_fisico,
                :nombre_objeto,
                :descripcion,
                :estado_conservacion,
                :fecha_ingreso,
                :activo,
                :id_piso,
                :id_sala,
                :id_vitrina,
                :id_cajon,
                :id_categoria,
                :id_coleccion,
                :id_autor,
                :id_propietario,
                :id_donador,
                :id_epoca
            )";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':codigo_actual' => $data['codigo_actual'],
                ':codigo_antiguo' => $data['codigo_antiguo'] ?? null,
                ':codigo_sigaf' => $data['codigo_sigaf'] ?? null,
                ':codigo_fisico' => $data['codigo_fisico'] ?? null,
                ':nombre_objeto' => $data['nombre_objeto'],
                ':descripcion' => $data['descripcion'],
                ':estado_conservacion' => $data['estado_conservacion'],
                ':fecha_ingreso' => $data['fecha_ingreso'],
                ':activo' => isset($data['activo']) ? (int)(bool)$data['activo'] : 1,
                ':id_piso' => $data['id_piso'],
                ':id_sala' => $data['id_sala'],
                ':id_vitrina' => $data['id_vitrina'] ?? null,
                ':id_cajon' => $data['id_cajon'] ?? null,
                ':id_categoria' => $data['id_categoria'],
                ':id_coleccion' => $data['id_coleccion'],
                ':id_autor' => $data['id_autor'] ?? null,
                ':id_propietario' => $data['id_propietario'] ?? null,
                ':id_donador' => $data['id_donador'] ?? null,
                ':id_epoca' => $data['id_epoca']
            ]);

            $idObjeto = (int)$this->db->lastInsertId();
            $materiales = is_array($data['materiales']) ? $data['materiales'] : [];
            $this->insertObjetoMateriales($idObjeto, $materiales);
            $this->db->commit();

            $this->sendJson(201, [
                'success' => true,
                'message' => 'Objeto registrado exitosamente en el inventario.',
                'id_objeto' => $idObjeto
            ]);
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            $this->sendJson(500, ['success' => false, 'message' => 'Error interno en el servidor: ' . $e->getMessage()]);
        }
    }

    public function updateObjeto(): void {
        $data = $this->getInputData();
        if (empty($data)) {
            $this->sendJson(400, ['success' => false, 'message' => 'Faltan parámetros requeridos para procesar la acción.']);
        }

        $errors = $this->validateUpdateData($data);
        if (!empty($errors)) {
            $this->sendJson(400, ['success' => false, 'message' => 'Faltan parámetros requeridos para procesar la acción.', 'errors' => $errors]);
        }

        $idObjeto = (int)$data['id_objeto'];
        $objetoExistente = $this->getObjetoById($idObjeto);
        if (!$objetoExistente) {
            $this->sendJson(404, ['success' => false, 'message' => 'El id_objeto proporcionado no coincide con ningún registro.']);
        }

        if ($this->inventoryNumberExists($data['codigo_actual'], $idObjeto)) {
            $this->sendJson(409, ['success' => false, 'message' => 'El código actual ingresado ya se encuentra registrado por otro objeto.']);
        }

        try {
            $this->db->beginTransaction();

            $sql = "UPDATE {$this->tableName} SET
                codigo_actual = :codigo_actual,
                codigo_antiguo = :codigo_antiguo,
                codigo_sigaf = :codigo_sigaf,
                codigo_fisico = :codigo_fisico,
                nombre_objeto = :nombre_objeto,
                descripcion = :descripcion,
                estado_conservacion = :estado_conservacion,
                fecha_ingreso = :fecha_ingreso,
                activo = :activo,
                id_piso = :id_piso,
                id_sala = :id_sala,
                id_vitrina = :id_vitrina,
                id_cajon = :id_cajon,
                id_categoria = :id_categoria,
                id_coleccion = :id_coleccion,
                id_autor = :id_autor,
                id_propietario = :id_propietario,
                id_donador = :id_donador,
                id_epoca = :id_epoca
            WHERE id_objeto = :id_objeto";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':codigo_actual' => $data['codigo_actual'],
                ':codigo_antiguo' => $data['codigo_antiguo'] ?? null,
                ':codigo_sigaf' => $data['codigo_sigaf'] ?? null,
                ':codigo_fisico' => $data['codigo_fisico'] ?? null,
                ':nombre_objeto' => $data['nombre_objeto'],
                ':descripcion' => $data['descripcion'],
                ':estado_conservacion' => $data['estado_conservacion'],
                ':fecha_ingreso' => $data['fecha_ingreso'],
                ':activo' => isset($data['activo']) ? (int)(bool)$data['activo'] : 1,
                ':id_piso' => $data['id_piso'],
                ':id_sala' => $data['id_sala'],
                ':id_vitrina' => $data['id_vitrina'] ?? null,
                ':id_cajon' => $data['id_cajon'] ?? null,
                ':id_categoria' => $data['id_categoria'],
                ':id_coleccion' => $data['id_coleccion'],
                ':id_autor' => $data['id_autor'] ?? null,
                ':id_propietario' => $data['id_propietario'] ?? null,
                ':id_donador' => $data['id_donador'] ?? null,
                ':id_epoca' => $data['id_epoca'],
                ':id_objeto' => $idObjeto
            ]);

            $this->deleteObjetoMateriales($idObjeto);
            $materiales = isset($data['materiales']) && is_array($data['materiales']) ? $data['materiales'] : [];
            $this->insertObjetoMateriales($idObjeto, $materiales);

            $nuevoLocation = [
                'id_piso' => $data['id_piso'],
                'id_sala' => $data['id_sala'],
                'id_vitrina' => $data['id_vitrina'] ?? null,
                'id_cajon' => $data['id_cajon'] ?? null
            ];

            if ($this->locationChanged($objetoExistente, $nuevoLocation)) {
                if (empty($data['id_usuario_cambio'])) {
                    $this->db->rollBack();
                    $this->sendJson(400, ['success' => false, 'message' => 'El campo id_usuario_cambio es obligatorio cuando cambia la ubicación física.']);
                }
                $this->recordLocationHistory($idObjeto, $nuevoLocation, (int)$data['id_usuario_cambio']);
            }

            $this->db->commit();

            $this->sendJson(200, [
                'success' => true,
                'message' => 'Datos del objeto actualizados e historial de ubicaciones registrado.',
                'id_objeto' => $idObjeto
            ]);
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            $this->sendJson(500, ['success' => false, 'message' => 'Error interno en el servidor: ' . $e->getMessage()]);
        }
    }

    public function deleteObjeto(): void {
        $data = $this->getInputData();
        $errors = $this->validateDeleteData($data);
        if (!empty($errors)) {
            $this->sendJson(400, ['success' => false, 'message' => 'Faltan parámetros requeridos para procesar la acción.', 'errors' => $errors]);
        }

        $idObjeto = (int)$data['id_objeto'];
        $objetoExistente = $this->getObjetoById($idObjeto);
        if (!$objetoExistente) {
            $this->sendJson(404, ['success' => false, 'message' => 'El id_objeto proporcionado no coincide con ningún registro.']);
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("DELETE FROM {$this->tableName} WHERE id_objeto = :id_objeto");
            $stmt->execute([':id_objeto' => $idObjeto]);

            $this->db->commit();
            $this->sendJson(200, ['success' => true, 'message' => 'El objeto y sus dependencias asociadas fueron eliminados correctamente del sistema.']);
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            $this->sendJson(500, ['success' => false, 'message' => 'Error interno en el servidor: ' . $e->getMessage()]);
        }
    }
}
