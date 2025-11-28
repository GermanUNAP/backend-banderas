require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const cors = require('cors');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const JWT = require('./jwt');

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
const jwtInstance = new JWT();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Países',
      version: '1.0.0',
      description: 'API para autenticación de usuarios y gestión de países favoritos',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./server.js'],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header required.' });
  }

  const token = JWT.extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({ message: 'Access token required. Format: Bearer <token>' });
  }

  try {
    const user = jwtInstance.verifyAccessToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * @swagger
 * /api/test-db:
 *   get:
 *     summary: Probar conexión a la base de datos
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Conexión exitosa
 *       500:
 *         description: Error de conexión
 */
app.get('/api/test-db', (req, res) => {
  db.query('SELECT 1', (err, results) => {
    if (err) {
      console.error('Database connection error:', err);
      return res.status(500).json({ message: 'Database connection failed', error: err.message });
    }
    res.json({ message: 'Database connection successful', result: results });
  });
});


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Solicitud incorrecta
 *       409:
 *         description: El email ya existe
 *       500:
 *         description: Error del servidor
 */
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.query(`INSERT INTO users (email, password, name) VALUES (?, ?, ?)`, [email, hashedPassword, name || null], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Email already exists.' });
      }
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(201).json({ message: 'User registered successfully.' });
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token (válido 8 horas)
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token (válido 7 días)
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Solicitud incorrecta
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error del servidor
 */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  db.query(`SELECT * FROM users WHERE email = ?`, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const row = results[0];
    const isPasswordValid = bcrypt.compareSync(password, row.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const { accessToken, refreshToken } = jwtInstance.generateTokens({ id: row.id, email: row.email });
    res.json({
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: { id: row.id, email: row.email, name: row.name }
    });
  });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: Refresh token required
 *       403:
 *         description: Invalid refresh token
 */
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token required.' });
  }

  try {
    const { accessToken } = jwtInstance.refreshAccessToken(refreshToken);
    res.json({ accessToken });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/countries/search:
 *   get:
 *     summary: Buscar países
 *     tags: [Países]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del país a buscar
 *     responses:
 *       200:
 *         description: Lista de países
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   flag:
 *                     type: string
 *                   capital:
 *                     type: string
 *                   population:
 *                     type: integer
 *                   region:
 *                     type: string
 *       400:
 *         description: Solicitud incorrecta
 *       500:
 *         description: Error del servidor
 */
app.get('/api/countries/search', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required.' });
  }

  try {
    const response = await axios.get(`https://restcountries.com/v3.1/name/${query}`);
    const countries = response.data.map(country => ({
      name: country.name.common,
      flag: country.flags.png,
      capital: country.capital ? country.capital[0] : 'N/A',
      population: country.population,
      region: country.region
    }));
    res.set('Cache-Control', 'no-cache');
    res.json({ success: true, countries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching countries.', error: error.message });
  }
});

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: Agregar país a favoritos
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - country_name
 *             properties:
 *               country_name:
 *                 type: string
 *               flag:
 *                 type: string
 *               capital:
 *                 type: string
 *               population:
 *                 type: integer
 *               region:
 *                 type: string
 *     responses:
 *       201:
 *         description: Favorito agregado
 *       400:
 *         description: Solicitud incorrecta
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
app.post('/api/favorites', authenticateToken, (req, res) => {
  const { country_name, flag, capital, population, region } = req.body;
  const userId = req.user.id;

  if (!country_name) {
    return res.status(400).json({ message: 'Country name is required.' });
  }

  db.query(`INSERT INTO favorites (user_id, country_name, flag, capital, population, region) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, country_name, flag, capital, population, region], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'País ya está en favoritos.' });
      }
      return res.status(500).json({ message: 'Database error.' });
    }
    res.status(201).json({ message: 'Favorite added.' });
  });
});

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Obtener favoritos del usuario
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de favoritos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   user_id:
 *                     type: integer
 *                   country_name:
 *                     type: string
 *                   flag:
 *                     type: string
 *                   capital:
 *                     type: string
 *                   population:
 *                     type: integer
 *                   region:
 *                     type: string
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
app.get('/api/favorites', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query(`SELECT * FROM favorites WHERE user_id = ?`, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.' });
    }
    res.json(results);
  });
});

/**
 * @swagger
 * /api/favorites/{id}:
 *   delete:
 *     summary: Eliminar favorito
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del favorito
 *     responses:
 *       200:
 *         description: Favorito eliminado
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Favorito no encontrado
 *       500:
 *         description: Error del servidor
 */
app.delete('/api/favorites/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Validate that id is a number
  const favoriteId = parseInt(id);
  if (isNaN(favoriteId)) {
    return res.status(400).json({ message: 'Invalid favorite ID.' });
  }

  db.query(`DELETE FROM favorites WHERE id = ? AND user_id = ?`, [favoriteId, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Favorite not found.' });
    }
    res.json({ message: 'Favorite deleted.' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});