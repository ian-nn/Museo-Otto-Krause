<?php
require_once __DIR__ . '/../config/database.php';

class CatalogosController {
    private $db;
    private $resources = [
        'salas' => [
            'table' => 'salas',
            'id' => 'id_sala',
            'fields' => ['nombre_sala', 'id_piso'],
            'fks' => ['id_piso' => ['table' => 'pisos', 'col' => 'id_piso']]
        ],
        'vitrinas' => [
            'table' => 'vitrinas',
            'id' => 'id_vitrina',
            'fields' => ['nombre_vitrina', 'id_sala'],
            'fks' => ['id_sala' => ['table' => 'salas', 'col' => 'id_sala']]
        ],
        'cajones' => [
            'table' => 'cajones',
            'id' => 'id_cajon',
            'fields' => ['nombre_cajon', 'id_vitrina'],
            'fks' => ['id_vitrina' => ['table' => 'vitrinas', 'col' => 'id_vitrina']]
        ],
        'categorias' => [
            'table' => 'categorias',
            'id' => 'id_categoria',
            'fields' => ['nombre_categoria'],
            'fks' => []
        ],
        'colecciones' => [
            'table' => 'colecciones',
            'id' => 'id_coleccion',
            'fields' => ['nombre_coleccion'],
            'fks' => []
        ],
        'autores' => [
            'table' => 'autores',
            'id' => 'id_autor',
            'fields' => ['nombre_autor'],
            'fks' => []
        ],
        'propietarios' => [
            'table' => 'propietarios',
            'id' => 'id_propietario',
            'fields' => ['nombre_propietario'],
            'fks' => []
        ],
        'donadores' => [
            'table' => 'donadores',
            'id' => 'id_donador',
            'fields' => ['nombre_donador'],
            'fks' => []
        ],
        'epocas' => [
            'table' => 'epocas',
            'id' => 'id_epoca',
            'fields' => ['nombre_epoca'],
            'fks' => []
        ],
        'materiales' => [
            'table' => 'materiales',
            'id' => 'id_material',
            'fields' => ['nombre_material'],
            'fks' => []
        ]
    ];

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

    private function getResourceConfig(string $resource): ?array {
        $resourceKey = strtolower(trim($resource));
        return $this->resources[$resourceKey] ?? null;
    }

    private function buildValidationErrors(array $config, array $data, bool $requireAllFields = true): array {
        $errors = [];

        foreach ($config['fields'] as $field) {
            if ($requireAllFields) {
                if (!isset($data[$field]) || trim((string)$data[$field]) === '') {
                    $errors[] = "El campo {$field} es obligatorio para {$config['table']}.";
                }
            }

            if (isset($data[$field]) && trim((string)$data[$field]) === '') {
                $errors[] = "El campo {$field} no puede estar vacío.";
            }
        }

        foreach ($config['fks'] as $field => $ref) {
            if (isset($data[$field]) && $data[$field] !== null && !is_numeric($data[$field])) {
                $errors[] = "El campo {$field} debe ser un identificador numérico válido.";
                continue;
            }

            if (isset($data[$field]) && $data[$field] !== null && !$this->referenceExists($ref['table'], $ref['col'], (int)$data[$field])) {
                $errors[] = "El valor de {$field} no corresponde a un registro existente en {$ref['table']}";
            }
        }

        return $errors;
    }

    private function referenceExists(string $table, string $col, int $value): bool {
        $stmt = $this->db->prepare("SELECT 1 FROM {$table} WHERE {$col} = :value LIMIT 1");
        $stmt->execute([':value' => $value]);
        return (bool)$stmt->fetch();
    }

    private function getResourceById(array $config, int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM {$config['table']} WHERE {$config['id']} = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $item = $stmt->fetch();
        return $item === false ? null : $item;
    }

    public function createResource(): void {
        $data = $this->getInputData();
        $resource = $data['resource'] ?? null;

        if (!$resource) {
            $this->sendJson(400, ['success' => false, 'message' => 'El campo resource es obligatorio. Ej: salas, vitrinas, categorias.']);
        }

        $config = $this->getResourceConfig($resource);
        if (!$config) {
            $this->sendJson(400, ['success' => false, 'message' => 'Recurso inválido.']);
        }

        $errors = $this->buildValidationErrors($config, $data, true);
        if (!empty($errors)) {
            $this->sendJson(400, ['success' => false, 'message' => 'Error de validación.', 'errors' => $errors]);
        }

        try {
            $fields = $config['fields'];
            $columnList = implode(', ', $fields);
            $paramList = implode(', ', array_map(function ($f) { return ":{$f}"; }, $fields));

            $stmt = $this->db->prepare("INSERT INTO {$config['table']} ({$columnList}) VALUES ({$paramList})");
            $params = [];
            foreach ($fields as $field) {
                $params[":{$field}"] = $data[$field] ?? null;
            }

            $stmt->execute($params);
            $insertId = (int)$this->db->lastInsertId();

            $this->sendJson(201, [
                'success' => true,
                'message' => ucfirst($resource) . ' creada correctamente.',
                $config['id'] => $insertId
            ]);
        } catch (Exception $e) {
            $this->sendJson(500, ['success' => false, 'message' => 'Error interno en el servidor: ' . $e->getMessage()]);
        }
    }

    public function updateResource(): void {
        $data = $this->getInputData();
        $resource = $data['resource'] ?? null;

        if (!$resource) {
            $this->sendJson(400, ['success' => false, 'message' => 'El campo resource es obligatorio.']);
        }

        $config = $this->getResourceConfig($resource);
        if (!$config) {
            $this->sendJson(400, ['success' => false, 'message' => 'Recurso inválido.']);
        }

        $idField = $config['id'];
        $idValue = isset($data[$idField]) ? (int)$data[$idField] : null;
        if (!$idValue) {
            $this->sendJson(400, ['success' => false, 'message' => "El campo {$idField} es obligatorio para actualizar el recurso."]); 
        }

        $existing = $this->getResourceById($config, $idValue);
        if (!$existing) {
            $this->sendJson(404, ['success' => false, 'message' => "El {$idField} proporcionado no coincide con ningún registro."]); 
        }

        $fieldsToUpdate = array_values(array_filter($config['fields'], function ($field) use ($data) { return array_key_exists($field, $data); }));
        if (empty($fieldsToUpdate)) {
            $this->sendJson(400, ['success' => false, 'message' => 'No hay campos válidos para actualizar.']);
        }

        $errors = $this->buildValidationErrors($config, $data, false);
        if (!empty($errors)) {
            $this->sendJson(400, ['success' => false, 'message' => 'Error de validación.', 'errors' => $errors]);
        }

        try {
            $setSegments = implode(', ', array_map(function ($field) { return "{$field} = :{$field}"; }, $fieldsToUpdate));
            $sql = "UPDATE {$config['table']} SET {$setSegments} WHERE {$config['id']} = :id";
            $stmt = $this->db->prepare($sql);
            $params = [':id' => $idValue];
            foreach ($fieldsToUpdate as $field) {
                $params[":{$field}"] = $data[$field] ?? null;
            }

            $stmt->execute($params);

            $this->sendJson(200, [
                'success' => true,
                'message' => ucfirst($resource) . ' actualizada correctamente.',
                $idField => $idValue
            ]);
        } catch (Exception $e) {
            $this->sendJson(500, ['success' => false, 'message' => 'Error interno en el servidor: ' . $e->getMessage()]);
        }
    }

    public function deleteResource(): void {
        $data = $this->getInputData();
        $resource = $data['resource'] ?? null;

        if (!$resource) {
            $this->sendJson(400, ['success' => false, 'message' => 'El campo resource es obligatorio.']);
        }

        $config = $this->getResourceConfig($resource);
        if (!$config) {
            $this->sendJson(400, ['success' => false, 'message' => 'Recurso inválido.']);
        }

        $idField = $config['id'];
        $idValue = isset($data[$idField]) ? (int)$data[$idField] : null;
        if (!$idValue) {
            $this->sendJson(400, ['success' => false, 'message' => "El campo {$idField} es obligatorio para eliminar el recurso."]); 
        }

        $existing = $this->getResourceById($config, $idValue);
        if (!$existing) {
            $this->sendJson(404, ['success' => false, 'message' => "El {$idField} proporcionado no coincide con ningún registro."]); 
        }

        try {
            $stmt = $this->db->prepare("DELETE FROM {$config['table']} WHERE {$config['id']} = :id");
            $stmt->execute([':id' => $idValue]);

            $this->sendJson(200, [
                'success' => true,
                'message' => ucfirst($resource) . ' eliminada correctamente.'
            ]);
        } catch (Exception $e) {
            $this->sendJson(500, ['success' => false, 'message' => 'Error interno en el servidor: ' . $e->getMessage()]);
        }
    }
}
