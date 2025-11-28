# ¡Hola! Soy el desarrollador de esta API de países

Te cuento lo que hice para crear esta API REST completa para autenticación de usuarios y gestión de países favoritos. Quise hacer algo funcional y fácil de usar desde el primer momento.

## 🚀 Cómo Levantar el Proyecto (Paso a Paso)

### Lo que Necesitas
- Node.js (versión 14 o superior)
- MySQL instalado en tu máquina

### Paso 1: Prepara el Proyecto
```bash
# Clona el repositorio y entra a la carpeta
git clone <tu-repo-aqui>
cd backend

# Instala todas las dependencias que usé
npm install
```

### Paso 2: Configura la Base de Datos
Aquí viene lo más fácil - ejecuta este comando y ¡listo!:
```bash
# Esto crea la base de datos, las tablas Y un usuario de ejemplo
mysql -u root -p < database.sql
```

**Importante**: Incluí un usuario de ejemplo para que puedas probar inmediatamente:
- **Email**: `usuario@example.com`
- **Contraseña**: `password`

### Paso 3: Variables de Entorno
```bash
# Copia el archivo de ejemplo que preparé
cp .env.example .env

# Si necesitas cambiar algo (como la contraseña de MySQL), edita el .env
# Pero por defecto debería funcionar
```

### Paso 4: ¡Listo para Usar!
```bash
# Inicia el servidor
npm start
```

El servidor estará corriendo en `http://localhost:3001` 🎉

## 🧪 Prueba que Todo Funciona

Preparé unos comandos curl para que veas que todo funciona desde el primer momento:

```bash
# 1. Haz login con el usuario de ejemplo que incluí
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"password"}'

# 2. Copia el "accessToken" de la respuesta y úsalo así:
curl -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI" \
  http://localhost:3001/api/favorites
```

¡Deberías obtener una respuesta exitosa! Si algo no funciona, revisa que MySQL esté corriendo y que las credenciales en `.env` estén correctas.

## 📋 Qué Endpoints Creé

### Autenticación (lo más importante)
- `POST /api/auth/register` - Para que nuevos usuarios se registren
- `POST /api/auth/login` - Para iniciar sesión y obtener tokens
- `POST /api/auth/refresh` - Para renovar tokens cuando expiren

### Gestión de Países
- `GET /api/countries/search?query={nombre}` - Busca países usando una API externa

### Favoritos de Usuarios
- `POST /api/favorites` - Agregar un país a favoritos
- `GET /api/favorites` - Ver todos los favoritos del usuario
- `DELETE /api/favorites/{id}` - Eliminar un favorito específico

**Nota**: Para agregar favoritos, envía el campo `country_name` (no `name`)

### Utilidades que Agregué
- `GET /api/test-db` - Para verificar que la conexión a MySQL funciona
- `GET /api-docs` - Documentación automática con Swagger

## 🔐 Seguridad JWT que Implementé

Quise hacer esto bien seguro desde el principio:

- **Tokens de acceso**: Duran 8 horas (antes eran 1 hora, lo cambié para mejor UX)
- **Tokens de refresh**: Duran 7 días para renovar los de acceso
- **Secrets criptográficos**: Generé secrets seguros de 128 caracteres
- **Validación estricta**: issuer, audience, y expiración
- **Contraseñas hasheadas**: Con bcrypt y salt rounds de 10

Los endpoints protegidos necesitan este header:
```
Authorization: Bearer <tu_access_token>
```

## 🗄️ Base de Datos que Diseñé

Creé dos tablas principales:

**users**:
- id, email, password (hasheada), name, created_at

**favorites**:
- id, user_id, country_name, flag, capital, population, region, created_at

La relación es que cada usuario puede tener múltiples países favoritos, pero no puede repetir el mismo país.

## 📝 Variables de Configuración

En el `.env` puedes configurar:

```env
# Puerto del servidor
PORT=3001

# Secrets para JWT (ya están configurados con valores seguros)
JWT_SECRET=tu_secret_seguro_aqui
JWT_REFRESH_SECRET=tu_refresh_secret_aqui

# Duración de tokens
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# Configuración de MySQL
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=countries_app
DB_PORT=3306

# Orígenes permitidos para CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🛠️ Tecnologías que Elegí

- **Express.js**: Para el servidor web, es simple y poderoso
- **MySQL2**: Base de datos relacional, perfecta para este tipo de datos
- **JWT**: Para autenticación stateless
- **bcryptjs**: Para hashear contraseñas de forma segura
- **Swagger**: Documentación automática de la API
- **CORS**: Para permitir peticiones desde el frontend

## 🔒 Medidas de Seguridad que Agregué

1. **Contraseñas hasheadas** con bcrypt (no se guardan en texto plano)
2. **JWT con secrets seguros** generados criptográficamente
3. **Validación de tokens** con issuer/audience para prevenir ataques
4. **Protección contra inyección SQL** usando prepared statements
5. **CORS configurado** para controlar qué dominios pueden acceder
6. **Validación de entrada** en todos los endpoints

## 📖 Documentación

Si quieres ver todos los detalles técnicos, ve a `http://localhost:3001/api-docs` una vez que el servidor esté corriendo. Ahí está toda la documentación interactiva que genera Swagger automáticamente.

## 🎯 Mi Objetivo

Quise crear una API que fuera:
- **Fácil de instalar** (con usuario de ejemplo incluido)
- **Segura** (buenas prácticas de JWT y contraseñas)
- **Completa** (autenticación + CRUD de favoritos)
- **Documentada** (Swagger + este README)
- **Escalable** (estructura limpia y modular)

Si tienes alguna duda o encuentras algún problema, ¡házmelo saber! Traté de hacer todo lo más simple posible para que cualquiera pueda usar esta API sin complicaciones.

¡Espero que te sea útil! 🚀