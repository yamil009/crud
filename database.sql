-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS escuela;

-- Usar la base de datos
USE escuela;

-- Crear la tabla estudiantes
CREATE TABLE IF NOT EXISTS estudiantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cu VARCHAR(20) NOT NULL,
    grupo VARCHAR(20) NOT NULL,
    celular VARCHAR(20) NOT NULL,
    gmail VARCHAR(100) UNIQUE NOT NULL
);

-- Insertar datos de ejemplo (opcional)
INSERT INTO estudiantes (nombre, cu, grupo, celular, gmail) VALUES
('Juan Pérez', '2023001', 'A1', '12345678', 'juan.perez@example.com'),
('María López', '2023002', 'A2', '87654321', 'maria.lopez@example.com'),
('Carlos Ramírez', '2023003', 'B1', '45678901', 'carlos.ramirez@example.com');
