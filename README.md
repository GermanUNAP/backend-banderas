# Countries App - Backend API

API REST para autenticación de usuarios y gestión de países favoritos.

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 14 o superior)
- MySQL

### 1. Clonar Repositorios
```bash
# Backend
git clone https://github.com/GermanUNAP/backend-banderas.git
cd backend-banderas

# Frontend (opcional, en otra terminal)
git clone https://github.com/GermanUNAP/frontend-banderas.git
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Base de Datos
```bash
# Crear base de datos, tablas y usuario de ejemplo
mysql -u root -p < database.sql
```

**Usuario de prueba incluido:**
- Email: `usuario@example.com`
- Password: `password`

### 4. Variables de Entorno
```bash
# Copiar archivo de configuración
cp .env.example .env

# El archivo .env ya contiene valores seguros por defecto
# Solo modifica si necesitas cambiar credenciales de MySQL
```

### 5. Iniciar Servidor
```bash
npm start
```

El servidor estará disponible en: `http://localhost:3001`

## 🧪 Verificación

Probar que la API funciona correctamente:

```bash
# 1. Login con usuario de prueba
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"password"}'

# 2. Obtener favoritos (reemplaza TOKEN con el accessToken obtenido)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/favorites
```

## 📋 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión y obtener tokens JWT
- `POST /api/auth/refresh` - Renovar token de acceso

### Países
- `GET /api/countries/search?query={name}` - Buscar países

### Favoritos
- `POST /api/favorites` - Agregar país a favoritos
- `GET /api/favorites` - Obtener favoritos del usuario
- `DELETE /api/favorites/{id}` - Eliminar favorito por ID

**Nota**: El endpoint POST `/api/favorites` requiere el campo `country_name`

### Utilidades
- `GET /api/test-db` - Verificar conexión a base de datos
- `GET /api-docs` - Documentación Swagger UI

## 🔐 Autenticación JWT

La API utiliza tokens JWT para autenticación segura:

- **Access Token**: Expira en 8 horas
- **Refresh Token**: Expira en 7 días
- **Secrets**: Generados criptográficamente (128 caracteres)

### Headers requeridos para endpoints protegidos:
```
Authorization: Bearer <access_token>
```

## 🗄️ Base de Datos

**Estructura de tablas:**

**users**:
- id (PRIMARY KEY)
- email (UNIQUE)
- password (bcrypt hash)
- name
- created_at

**favorites**:
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- country_name
- flag, capital, population, region
- created_at

## ⚙️ Configuración

Variables de entorno en `.env`:

```env
# Servidor
PORT=3001

# JWT
JWT_SECRET=<secret_seguro>
JWT_REFRESH_SECRET=<refresh_secret_seguro>
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# Base de datos
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=countries_app
DB_PORT=3306

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🛠️ Tecnologías

- **Express.js** - Framework web
- **MySQL2** - Base de datos
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **swagger-jsdoc/ui** - API documentation
- **cors** - Cross-origin requests

## 🔒 Seguridad

- Passwords hasheadas con bcrypt (salt rounds: 10)
- JWT con validación de issuer/audience
- Protección contra SQL injection
- CORS configurado
- Validación de entrada en todos los endpoints

## 📖 Documentación API

Documentación completa disponible en: `http://localhost:3001/api-docs`