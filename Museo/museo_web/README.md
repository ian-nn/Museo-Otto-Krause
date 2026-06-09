# MuseOK 🏛️💻

**MuseOK** es el sistema digital de gestión del Museo Tecnológico Eduardo Latzina de la Escuela Técnica N°1 Otto Krause. Su objetivo es modernizar la administración del patrimonio, digitalizar el inventario histórico y gestionar reservas públicas e institucionales con un diseño ligero y fiable para equipos escolares con hardware limitado.

---

## 🔧 Arquitectura y Stack Tecnológico

MuseOK está construido con una separación clara entre backend y frontend:

- **Backend**: PHP Vanilla con arquitectura MVC pura.
- **Frontend**: HTML, CSS y JavaScript nativos.
- **Persistencia**: MySQL mediante PDO.

### Backend MVC en PHP

La estructura del backend sigue el patrón MVC clásico para mantener responsabilidades separadas:

- **Modelos**: encapsulan la lógica de datos y la interacción con la base de datos usando PDO seguro.
- **Controladores**: reciben las peticiones, validan datos, aplican reglas de negocio y devuelven respuestas JSON.
- **Vistas / API**: no hay plantillas complejas; el backend expone recursos JSON para el frontend, y las vistas se resuelven desde la capa de frontend.

### Principios de diseño

- Uso de **PDO** en todas las consultas para evitar inyección SQL.
- Validación de entrada en el backend y control de CORS cuando sea necesario.
- Almacenamiento de contraseñas con `password_hash()` en PHP.
- Rutas relativas para archivos multimedia y fotografías de objetos, evitando blobs en la base de datos.
- Repositorio liviano, compatible con entornos XAMPP/Laragon en PCs antiguas.

### Frontend escalable

El frontend está organizado para ser fácil de mantener y ejecutar:

- `js/controllers/`: controladores de UI y lógica de página.
- `js/services/`: servicios de comunicación y helpers externos.
- `css/`: estilos globales y de componentes.
- `public/`: activos estáticos y multimedia.

El diseño busca ser rápido en navegadores básicos y minimizar dependencias.

---

## 📁 Estructura de Carpetas del Proyecto

```bash
Museo OttoKrause/
├── museo_api/
│   ├── auth/
│   │   └── login.php
│   ├── config/
│   │   ├── database.php
│   │   └── config.php        # Excluido de Git, contiene credenciales locales
│   ├── controllers/
│   │   ├── ObjetosController.php
│   │   ├── UsuariosController.php
│   │   ├── VisitasController.php
│   │   └── VitrinasController.php
│   ├── models/
│   │   ├── Objeto.php
│   │   ├── Usuario.php
│   │   ├── Visita.php
│   │   └── Vitrina.php
│   └── routes/
│       └── api.php
├── museo_web/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── controllers/
│   │   │   └── login.js
│   │   └── services/
│   │       └── api.js
│   ├── public/
│   │   └── unnamed.png
│   ├── index.html
│   └── README.md
└── README.md
```

> Nota: el frontend y el backend están físicamente separados para permitir despliegues claros en servidores escolares. El backend sirve API JSON y el frontend consume esas respuestas.

---

## 🛠️ Guía de Instalación y Configuración Local

### 1. Clonar el repositorio

```bash
cd C:\xampp\htdocs\
git clone https://github.com/tu-organizacion/tu-repo.git "Museo OttoKrause"
```

O en Laragon:

```bash
cd C:\laragon\www\
git clone https://github.com/tu-organizacion/tu-repo.git "Museo OttoKrause"
```

### 2. Colocar el proyecto en el directorio raíz del servidor local

- XAMPP: `C:\xampp\htdocs\Museo OttoKrause`
- Laragon: `C:\laragon\www\Museo OttoKrause`

### 3. Configurar el archivo de credenciales (no versionado)

El backend debe usar un archivo `museo_api/config/config.php` que no se suba a Git. En el repositorio debe existir un `.gitignore` que excluya este archivo.

Ejemplo de `museo_api/config/config.php`:

```php
<?php
return [
    'host' => 'localhost',
    'dbname' => 'museok',
    'user' => 'root',
    'password' => '',
    'charset' => 'utf8mb4',
];
```

### 4. Inicializar la base de datos MySQL

Crear la base de datos y las tablas principales. Este proyecto usa una estructura normalizada que respeta la separación física de ubicaciones y reservas.

Ejemplo de script SQL de inicialización:

```sql
CREATE DATABASE IF NOT EXISTS museok CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE museok;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'operador', 'invitado') NOT NULL DEFAULT 'operador',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  orden INT NOT NULL DEFAULT 0
);

CREATE TABLE salas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  piso_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  orden INT NOT NULL DEFAULT 0,
  FOREIGN KEY (piso_id) REFERENCES pisos(id) ON DELETE CASCADE
);

CREATE TABLE vitrinas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sala_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  orden INT NOT NULL DEFAULT 0,
  FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE
);

CREATE TABLE cajones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vitrina_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  orden INT NOT NULL DEFAULT 0,
  FOREIGN KEY (vitrina_id) REFERENCES vitrinas(id) ON DELETE CASCADE
);

CREATE TABLE objetos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cajon_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  codigo_inventario VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  imagen_path VARCHAR(255),
  fecha_ingreso DATE,
  estado ENUM('activo', 'prestado', 'resguardado') NOT NULL DEFAULT 'activo',
  FOREIGN KEY (cajon_id) REFERENCES cajones(id) ON DELETE SET NULL
);

CREATE TABLE reservas_publicas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  apellido VARCHAR(80) NOT NULL,
  email VARCHAR(150) NOT NULL,
  telefono VARCHAR(50),
  fecha_visita DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  cantidad_personas INT NOT NULL,
  estado ENUM('pendiente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservas_institucionales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  institucion_nombre VARCHAR(150) NOT NULL,
  contacto_nombre VARCHAR(80) NOT NULL,
  contacto_apellido VARCHAR(80) NOT NULL,
  email VARCHAR(150) NOT NULL,
  telefono VARCHAR(50),
  fecha_visita DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  cantidad_alumnos INT NOT NULL,
  nivel_educativo VARCHAR(100),
  estado ENUM('pendiente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> Importante: las tablas de reservas están separadas para evitar campos nulos innecesarios y mantener una primera forma normal clara en nombres y apellidos.

### 5. Verificar la conexión PHP - MySQL

El archivo `museo_api/config/database.php` debe cargar `config.php` y crear la conexión PDO.

Ejemplo de uso seguro:

```php
<?php
$config = require __DIR__ . '/config.php';
try {
    $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['user'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    exit('Error de conexión: ' . $e->getMessage());
}
```

### 6. Ejecutar el frontend

El frontend no depende de Node ni Vite en producción. Basta abrir `museo_web/index.html` desde el servidor local.

Sin embargo, para desarrollo ligero se puede usar cualquier servidor estático local que sirva la carpeta `museo_web`.

---

## 🧭 Flujo de Trabajo y Control de Versiones (Git Workflow)

El proyecto debe desarrollarse con ramas atómicas y revisiones estructuradas.

### Reglas obligatorias

- Usar una rama por tarea o corrección.
- No trabajar directamente en `main`.
- Abrir un Pull Request en GitHub para cualquier cambio significativo.

### Nombres de ramas sugeridos

- `feature/<descripcion-corta>`
- `bugfix/<descripcion-corta>`
- `hotfix/<descripcion-corta>`

### Ciclo de preparación básico

```bash
git status
git add .
git commit -m "feat: agregar login nativo con validacion backend"
```

### Subir rama y solicitar revisión

```bash
git push origin nombre-de-tu-rama
```

Luego abrir un **Pull Request** en GitHub para revisión por el líder técnico.

### Actualizar la rama principal

```bash
git checkout main
git pull origin main
```

> Nota: antes de fusionar, siempre verificar que la rama principal esté actualizada y que el PR tenga revisión de al menos un revisor.

---

## 📡 Contrato de la API (Endpoints & JSON Specs)

### Autenticación

#### Endpoint

`POST /museo_api/auth/login.php`

#### Request

- `Content-Type: application/json`
- Payload JSON:

```json
{
  "email": "usuario@colegio.edu.ar",
  "password": "contraseñaSegura"
}
```

> El frontend envía credenciales limpias en texto plano. En producción esta comunicación debe protegerse con HTTPS.

#### Response exitosa

```json
{
  "success": true,
  "message": "Autenticación correcta.",
  "id_usuario": 1,
  "nombre": "Juan Pérez",
  "email": "usuario@colegio.edu.ar",
  "rol": "admin"
}
```

#### Response de error

```json
{
  "success": false,
  "message": "Credenciales incorrectas.",
  "id_usuario": null,
  "nombre": null,
  "email": null,
  "rol": null
}
```

### Reglas del contrato JSON

- La respuesta siempre debe contener las claves:
  - `success` (bool)
  - `message` (string)
  - `id_usuario`
  - `nombre`
  - `email`
  - `rol`
- El backend debe devolver siempre `Content-Type: application/json`.
- Los mensajes deben ser claros y útiles para el frontend.

### Pautas generales para otros endpoints

- Los controladores deben devolver objetos JSON uniformes.
- Evitar respuestas mixtas HTML/JSON.
- Validar todos los datos recibidos en el backend.
- Registrar errores críticos en servidor, pero no exponer detalles internos al frontend.

---

## 🔐 Seguridad y Buenas Prácticas

- Usar `password_hash()` para guardar contraseñas y `password_verify()` para compararlas.
- No almacenar contraseñas en texto plano.
- No guardar archivos binarios en MySQL; usar rutas relativas a la carpeta `public/`.
- Mantener el repositorio ligero y evitar incluir archivos multimedia pesados en Git.
- En producción, desplegar detrás de HTTPS.
- Validar permisos de usuario en cada controlador.

---

## ✅ Buenas prácticas del proyecto

- Priorizar consultas PDO parametrizadas.
- Mantener la regla de una responsabilidad por clase/archivo.
- Documentar cualquier cambio en la API en este README.
- Evitar dependencias innecesarias en el frontend.
- Confirmar que la interfaz funcione en navegadores del entorno escolar.

---

## 📌 Referencias rápidas

- Backend principal: `museo_api/`
- Frontend principal: `museo_web/`
- Configuración sensible: `museo_api/config/config.php`
- Login frontend: `museo_web/js/controllers/login.js`
- Servicio API frontend: `museo_web/js/services/api.js`
- Conexión PDO: `museo_api/config/database.php`

Con esta documentación, cualquier miembro del equipo puede integrarse rápidamente y seguir una metodología consistente para el desarrollo y despliegue del sistema MuseOK.
