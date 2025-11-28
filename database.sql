-- Crear base de datos
CREATE DATABASE IF NOT EXISTS countries_app;

-- Usar la base de datos
USE countries_app;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  flag VARCHAR(255),
  capital VARCHAR(255),
  population BIGINT,
  region VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_country (user_id, country_name)
);

-- Usuario de ejemplo
INSERT INTO users (email, password, name) VALUES
('usuario@example.com', '$2b$10$dCd5ET..V0BULGJ6CylG5eu3iQA7UACu8giHhg0weFspOf.jOtEpW', 'Usuario Ejemplo');