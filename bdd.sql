-- Creamos la base de datos (opcional, pero buena práctica)
CREATE DATABASE IF NOT EXISTS museo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE museo_db;

-- ====================================================
-- 1. TABLAS INDEPENDIENTES (Sin Claves Foráneas)
-- ====================================================

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE colecciones (
    id_coleccion INT AUTO_INCREMENT PRIMARY KEY,
    nombre_coleccion VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE materiales (
    id_material INT AUTO_INCREMENT PRIMARY KEY,
    nombre_material VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE autores (
    id_autor INT AUTO_INCREMENT PRIMARY KEY,
    nombre_autor VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE propietarios (
    id_propietario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_propietario VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE donadores (
    id_donador INT AUTO_INCREMENT PRIMARY KEY,
    nombre_donador VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE epocas (
    id_epoca INT AUTO_INCREMENT PRIMARY KEY,
    nombre_epoca VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE pisos (
    id_piso INT AUTO_INCREMENT PRIMARY KEY,
    nombre_piso VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'colaborador'
) ENGINE=InnoDB;

-- INSERT DEL USUARIO ADMINISTRADOR (Contraseña: museo2026 hasheada con Bcrypt)
INSERT INTO usuarios (id_usuario, nombre_usuario, email, contrasena, rol)
VALUES (NULL, 'admin', 'admin@museo.com', '$2y$10$CALQRyodCSNutH8KGxEZiOAdgXlcptC42euA/9UP1EdrMx7iaLzey', 'admin');

CREATE TABLE visitas_programadas (
    id_visita INT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora DATETIME NOT NULL,
    tipo_visita ENUM('Publica', 'Institucional') NOT NULL,
    cupo_maximo INT NOT NULL,
    cupo_actual INT DEFAULT 0
) ENGINE=InnoDB;

-- ====================================================
-- 2. TABLAS CON DEPENDENCIA NIVEL 1 (Ubicaciones Físicas)
-- ====================================================

CREATE TABLE salas (
    id_sala INT AUTO_INCREMENT PRIMARY KEY,
    nombre_sala VARCHAR(100) NOT NULL,
    id_piso INT NOT NULL,
    FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE vitrinas (
    id_vitrina INT AUTO_INCREMENT PRIMARY KEY,
    nombre_vitrina VARCHAR(100) NOT NULL,
    id_sala INT NOT NULL,
    FOREIGN KEY (id_sala) REFERENCES salas(id_sala) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cajones (
    id_cajon INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cajon VARCHAR(100) NOT NULL,
    id_vitrina INT NOT NULL,
    FOREIGN KEY (id_vitrina) REFERENCES vitrinas(id_vitrina) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================
-- 3. TABLA PRINCIPAL: OBJETOS
-- ====================================================

CREATE TABLE objetos (
    id_objeto INT AUTO_INCREMENT PRIMARY KEY,
    num_inventario VARCHAR(50) NOT NULL UNIQUE,
    nombre_objeto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado_conservacion VARCHAR(100),
    fecha_ingreso DATE,
    activo BOOLEAN DEFAULT TRUE,
   
    -- Claves foráneas de ubicación
    id_piso INT,
    id_sala INT,
    id_vitrina INT,
    id_cajon INT,
   
    -- Claves foráneas de metadatos
    id_categoria INT,
    id_coleccion INT,
    id_autor INT,
    id_propietario INT,
    id_donador INT,
    id_epoca INT,

    FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE SET NULL,
    FOREIGN KEY (id_sala) REFERENCES salas(id_sala) ON DELETE SET NULL,
    FOREIGN KEY (id_vitrina) REFERENCES vitrinas(id_vitrina) ON DELETE SET NULL,
    FOREIGN KEY (id_cajon) REFERENCES cajones(id_cajon) ON DELETE SET NULL,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL,
    FOREIGN KEY (id_coleccion) REFERENCES colecciones(id_coleccion) ON DELETE SET NULL,
    FOREIGN KEY (id_autor) REFERENCES autores(id_autor) ON DELETE SET NULL,
    FOREIGN KEY (id_propietario) REFERENCES propietarios(id_propietario) ON DELETE SET NULL,
    FOREIGN KEY (id_donador) REFERENCES donadores(id_donador) ON DELETE SET NULL,
    FOREIGN KEY (id_epoca) REFERENCES epocas(id_epoca) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ====================================================
-- 4. TABLAS CON DEPENDENCIA NIVEL 2 (Asociadas a Objetos y Visitas)
-- ====================================================

CREATE TABLE fotos (
    id_foto INT AUTO_INCREMENT PRIMARY KEY,
    ruta_foto VARCHAR(255) NOT NULL,
    id_objeto INT NOT NULL,
    FOREIGN KEY (id_objeto) REFERENCES objetos(id_objeto) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE objeto_materiales (
    id_objeto INT NOT NULL,
    id_material INT NOT NULL,
    PRIMARY KEY (id_objeto, id_material),
    FOREIGN KEY (id_objeto) REFERENCES objetos(id_objeto) ON DELETE CASCADE,
    FOREIGN KEY (id_material) REFERENCES materiales(id_material) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE historial_ubicaciones (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_objeto INT NOT NULL,
    ubicacion_anterior VARCHAR(255),
    ubicacion_nueva VARCHAR(255) NOT NULL,
    fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT,
    FOREIGN KEY (id_objeto) REFERENCES objetos(id_objeto) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE reservas_publicas (
    id_reserva_pub INT AUTO_INCREMENT PRIMARY KEY,
    id_visita INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    telefono VARCHAR(50),
    cantidad_personas INT NOT NULL,
    FOREIGN KEY (id_visita) REFERENCES visitas_programadas(id_visita) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reservas_institucionales (
    id_reserva_inst INT AUTO_INCREMENT PRIMARY KEY,
    id_visita INT NOT NULL,
    nombre_institucion VARCHAR(150) NOT NULL,
    tipo_institucion ENUM('Escuela', 'Institucion') NOT NULL DEFAULT 'Escuela', -- Campo agregado
    cue VARCHAR(9) DEFAULT NULL, -- Campo agregado (nullable)
    cantidad_alumnos INT NOT NULL,
    nombre_responsable VARCHAR(100) NOT NULL, -- Campo atomizado
    apellido_responsable VARCHAR(100) NOT NULL, -- Campo atomizado
    email_contacto VARCHAR(150) NOT NULL,
    telefono_contacto VARCHAR(50) NOT NULL,
    dni_responsable VARCHAR(20) NOT NULL,
    FOREIGN KEY (id_visita) REFERENCES visitas_programadas(id_visita) ON DELETE CASCADE
) ENGINE=InnoDB; 

