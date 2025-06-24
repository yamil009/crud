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

// Configuración de la base de datos Maestro (Escritura)
const masterDbConfig = {
  host: process.env.DB_MASTER_HOST || 'localhost',
  user: process.env.DB_MASTER_USER || 'root',
  password: process.env.DB_MASTER_PASSWORD || '',
  database: process.env.DB_MASTER_DATABASE || 'escuela',
  port: process.env.DB_MASTER_PORT || 3306,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
};

// Configuración de la base de datos Esclavo (Lectura)
const slaveDbConfig = {
  host: process.env.DB_SLAVE_HOST || 'localhost',
  user: process.env.DB_SLAVE_USER || 'root',
  password: process.env.DB_SLAVE_PASSWORD || '',
  database: process.env.DB_SLAVE_DATABASE || 'escuela',
  port: process.env.DB_SLAVE_PORT || 3306,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
};

// Crear pools de conexiones
let masterPool;
let slavePool;

// Middleware para enrutar consultas de lectura al esclavo
app.use((req, res, next) => {
  // Si es una petición GET, asumimos que es de lectura
  if (req.method === 'GET') {
    req.db = slavePool;
  } else {
    // Para POST, PUT, DELETE, etc., usamos el maestro
    req.db = masterPool;
  }
  next();
});

try {
  // Crear pool de conexiones para el maestro
  masterPool = mysql.createPool(masterDbConfig);
  console.log('Conexión a la base de datos MAESTRA establecida correctamente');
  
  // Crear pool de conexiones para el esclavo
  slavePool = mysql.createPool(slaveDbConfig);
  console.log('Conexión a la base de datos ESCLAVA establecida correctamente');
} catch (error) {
  console.error('Error al conectar a la base de datos:', error);
  process.exit(1);
}

// Rutas
// Crear un nuevo estudiante
app.post('/estudiantes', async (req, res) => {
  try {
    const { nombre, cu, grupo, celular, gmail } = req.body;
    // Usar siempre el maestro para operaciones de escritura
    const [result] = await masterPool.execute(
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
    // Usar req.db que ya está configurado por el middleware
    const [rows] = await req.db.execute('SELECT * FROM estudiantes');
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

    // Usar siempre el maestro para operaciones de escritura
    const [result] = await masterPool.execute(
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
    // Usar siempre el maestro para operaciones de escritura
    const [result] = await masterPool.execute('DELETE FROM estudiantes WHERE id = ?', [id]);

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
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err);
  process.exit(1);
});

module.exports = app;
