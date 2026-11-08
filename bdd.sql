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
    cupo_actual INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_visita_fecha_tipo (fecha_hora, tipo_visita),
    CONSTRAINT chk_visita_cupo_maximo CHECK (cupo_maximo > 0),
    CONSTRAINT chk_visita_cupo_actual CHECK (cupo_actual >= 0 AND cupo_actual <= cupo_maximo)
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

CREATE TABLE public_reservations (
    id_public_reservation INT AUTO_INCREMENT PRIMARY KEY,
    id_visita INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    cantidad_personas INT NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_public_reservation_visita (id_visita),
    CONSTRAINT chk_public_reservation_people CHECK (cantidad_personas > 0),
    CONSTRAINT fk_public_reservation_visita FOREIGN KEY (id_visita)
        REFERENCES visitas_programadas(id_visita) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE institutional_reservations (
    id_institutional_reservation INT AUTO_INCREMENT PRIMARY KEY,
    id_visita INT NOT NULL,
    nombre_institucion VARCHAR(150) NOT NULL,
    tipo_institucion ENUM('Escuela', 'Institucion') NOT NULL,
    cue VARCHAR(9) DEFAULT NULL,
    cantidad_personas INT NOT NULL,
    nombre_responsable VARCHAR(100) NOT NULL,
    apellido_responsable VARCHAR(100) NOT NULL,
    dni_responsable VARCHAR(20) DEFAULT NULL,
    email_contacto VARCHAR(150) NOT NULL,
    telefono_contacto VARCHAR(50) NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_institutional_reservation_visita (id_visita),
    CONSTRAINT chk_institutional_reservation_people CHECK (cantidad_personas > 0),
    CONSTRAINT fk_institutional_reservation_visita FOREIGN KEY (id_visita)
        REFERENCES visitas_programadas(id_visita) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Seed data includes open slots and a fully booked public slot for availability testing.
INSERT INTO visitas_programadas (fecha_hora, tipo_visita, cupo_maximo, cupo_actual) VALUES
('2026-11-14 09:00:00', 'Publica', 40, 0),
('2026-11-21 09:00:00', 'Publica', 10, 0),
('2026-11-19 10:00:00', 'Institucional', 40, 0),
('2026-11-26 10:00:00', 'Institucional', 30, 0);

INSERT INTO public_reservations
    (id_visita, nombre, apellido, email, dni, telefono, cantidad_personas, estado)
SELECT id_visita, 'Lucia', 'Fernandez', 'lucia.fernandez@example.test',
       '30111222', '+54 11 4000-1000', 6, 'aprobada'
FROM visitas_programadas
WHERE fecha_hora = '2026-11-14 09:00:00' AND tipo_visita = 'Publica';

INSERT INTO public_reservations
    (id_visita, nombre, apellido, email, dni, telefono, cantidad_personas, estado)
SELECT id_visita, 'Mateo', 'Gomez', 'mateo.gomez@example.test',
       '32123456', '+54 11 4000-1001', 10, 'pendiente'
FROM visitas_programadas
WHERE fecha_hora = '2026-11-21 09:00:00' AND tipo_visita = 'Publica';

INSERT INTO institutional_reservations
    (id_visita, nombre_institucion, tipo_institucion, cue, cantidad_personas,
     nombre_responsable, apellido_responsable, email_contacto, telefono_contacto, estado)
SELECT id_visita, 'Escuela Tecnica N. 1', 'Escuela', '200000001', 24,
       'Ana', 'Perez', 'ana.perez@example.test', '+54 11 4000-1002', 'pendiente'
FROM visitas_programadas
WHERE fecha_hora = '2026-11-19 10:00:00' AND tipo_visita = 'Institucional';

UPDATE visitas_programadas v
SET cupo_actual = (
    SELECT COALESCE(SUM(r.cantidad_personas), 0)
    FROM public_reservations r
    WHERE r.id_visita = v.id_visita
      AND r.estado = 'aprobada'
)
WHERE v.tipo_visita = 'Publica';

UPDATE visitas_programadas v
SET cupo_actual = (
    SELECT COALESCE(SUM(r.cantidad_personas), 0)
    FROM institutional_reservations r
    WHERE r.id_visita = v.id_visita
      AND r.estado = 'aprobada'
)
WHERE v.tipo_visita = 'Institucional';
