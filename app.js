require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'escuela',
  port: process.env.DB_PORT || 3306
};

// Crear pool de conexiones
let pool;

try {
  pool = mysql.createPool(dbConfig);
  console.log('Conexión a la base de datos establecida');
} catch (error) {
  console.error('Error al conectar a la base de datos:', error);
  process.exit(1);
}

// Rutas
// Crear un nuevo estudiante
app.post('/estudiantes', async (req, res) => {
  try {
    const { nombre, cu, grupo, celular, gmail } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO estudiantes (nombre, cu, grupo, celular, gmail) VALUES (?, ?, ?, ?, ?)',
      [nombre, cu, grupo, celular, gmail]
    );
    res.status(201).json({ id: result.insertId, nombre, cu, grupo, celular, gmail });
  } catch (error) {
    console.error('Error al crear estudiante:', error);
    res.status(500).json({ error: 'Error al crear el estudiante' });
  }
});

// Obtener todos los estudiantes
app.get('/estudiantes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM estudiantes');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({ error: 'Error al obtener los estudiantes' });
  }
});

// Actualizar un estudiante
app.put('/estudiantes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cu, grupo, celular, gmail } = req.body;

    const [result] = await pool.execute(
      'UPDATE estudiantes SET nombre = ?, cu = ?, grupo = ?, celular = ?, gmail = ? WHERE id = ?',
      [nombre, cu, grupo, celular, gmail, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json({ id, nombre, cu, grupo, celular, gmail });
  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
    res.status(500).json({ error: 'Error al actualizar el estudiante' });
  }
});

// Eliminar un estudiante
app.delete('/estudiantes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM estudiantes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    res.status(500).json({ error: 'Error al eliminar el estudiante' });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err);
  process.exit(1);
});

module.exports = app;
