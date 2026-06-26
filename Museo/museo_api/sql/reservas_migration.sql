CREATE TABLE IF NOT EXISTS reservas_publicas (
    id_reserva_pub INT AUTO_INCREMENT PRIMARY KEY,
    id_visita INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    telefono VARCHAR(50) DEFAULT NULL,
    cantidad_personas INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservas_publicas_visita FOREIGN KEY (id_visita) REFERENCES visitas_programadas(id_visita) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservas_publicas_personas (
    id_persona INT AUTO_INCREMENT PRIMARY KEY,
    id_reserva_pub INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    CONSTRAINT fk_reservas_publicas_personas_reserva FOREIGN KEY (id_reserva_pub) REFERENCES reservas_publicas(id_reserva_pub) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservas_institucionales (
    id_reserva_inst INT AUTO_INCREMENT PRIMARY KEY,
    id_visita INT NOT NULL,
    nombre_institucion VARCHAR(150) NOT NULL,
    tipo_institucion ENUM('Escuela', 'Institucion') NOT NULL DEFAULT 'Escuela',
    cue VARCHAR(9) DEFAULT NULL,
    cantidad_alumnos INT NOT NULL,
    nombre_responsable VARCHAR(100) NOT NULL,
    apellido_responsable VARCHAR(100) NOT NULL,
    email_contacto VARCHAR(150) NOT NULL,
    telefono_contacto VARCHAR(50) NOT NULL,
    dni_responsable VARCHAR(20) NOT NULL,
    estado ENUM('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservas_institucionales_visita FOREIGN KEY (id_visita) REFERENCES visitas_programadas(id_visita) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE reservas_institucionales
ADD COLUMN IF NOT EXISTS estado ENUM('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente';

VISITAS PARA TESTEAR QUE TODO FUNCIONE CORRECTAMENTE

INSERT INTO visitas_programadas (fecha_hora, tipo_visita, cupo_maximo, cupo_actual) VALUES
('2026-07-02 09:00:00', 'Publica', 30, 0),
('2024-07-07 09:00:00', 'Institucional', 30, 0);

PARA HACER UN POST DE RESERVA PUBLICA http://localhost:8090/MUSEO/Museo-Otto-Krause/Museo/museo_api/routes/reservar.php

JSON BODY 
{
  "id_visita": 1,
  "tipo_visita": "Publica",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@mail.com",
  "dni": "40123456",
  "telefono": "+541123456789",
  "cantidad_personas": 3,
  "personas": [
    { "nombre": "Juan", "apellido": "Pérez", "dni": "40123456" },
    { "nombre": "Ana", "apellido": "Gómez", "dni": "35123456" },
    { "nombre": "Luis", "apellido": "Martínez", "dni": "29123456" }
  ]
}

PARA HACER UIN POST DE RESERVA INSTITUCIONAL http://localhost:8090/MUSEO/Museo-Otto-Krause/Museo/museo_api/routes/reservar.php

JSON BODY
{
  "id_visita": 2,
  "tipo_visita": "Institucional",
  "nombre_institucion": "Escuela Técnica N°10",
  "tipo_institucion": "Escuela",
  "cue": "020012300",
  "cantidad_alumnos": 35,
  "nombre_responsable": "Carlos",
  "apellido_responsable": "Gómez",
  "email_contacto": "carlos.gomez@institucion.edu.ar",
  "telefono_contacto": "1198765432",
  "dni_responsable": "18765432"
}

PARA APROBAR O RECHAZAR MANUALMENTE LAS RESERVAS INSTITUCIONALES QUE SUPERAN EL CUPO MAXIMO DE PERSONAS
JSON BODY
{
  "id_reserva_inst": 1,
  "action": "aprobar"
}

O

{
  "id_reserva_inst": 1,
  "action": "rechazar"
}