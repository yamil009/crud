require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');
const chalk = require('chalk');
const app = express();

// Configuración de colores
const colors = {
  success: chalk.green.bold,
  error: chalk.red.bold,
  warning: chalk.yellow.bold,
  info: chalk.blue.bold,
  highlight: chalk.cyan.bold,
  timestamp: chalk.gray,
  method: (method) => {
    const colors = {
      'GET': chalk.green.bold,
      'POST': chalk.blue.bold,
      'PUT': chalk.yellow.bold,
      'DELETE': chalk.red.bold
    };
    return (colors[method] || chalk.white.bold)(method);
  }
};

// Middleware
app.use(express.json());

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para manejar conexiones
app.use((req, res, next) => {
  try {
    if (req.method === 'GET') {
      req.db = db.getReadConnection();
    } else {
      req.db = db.getWriteConnection();
    }
    next();
  } catch (error) {
    console.error(colors.error('Error al obtener conexión:'), error);
    res.status(500).json({ error: 'Error de conexión con la base de datos' });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de salud
app.get('/health', async (req, res) => {
  const health = await db.healthCheck();
  res.json({
    status: health.status,
    usingSlave: health.slave,
    master: process.env.DB_MASTER_HOST,
    slave: process.env.DB_SLAVE_HOST
  });
});

// Ruta para obtener todos los estudiantes
app.get('/estudiantes', async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT * FROM estudiantes');
    res.json(rows);
  } catch (error) {
    console.error(colors.error('Error al obtener estudiantes:'), error);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

// Ruta para agregar un estudiante
app.post('/estudiantes', async (req, res) => {
  try {
    const { nombre, cu, grupo, celular, gmail } = req.body;
    
    // Validar datos
    if (!nombre || !cu || !grupo || !celular || !gmail) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Usar siempre el maestro para operaciones de escritura
    const [result] = await req.db.execute(
      'INSERT INTO estudiantes (nombre, cu, grupo, celular, gmail) VALUES (?, ?, ?, ?, ?)',
      [nombre, cu, grupo, celular, gmail]
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      cu,
      grupo,
      celular,
      gmail
    });
  } catch (error) {
    console.error(colors.error('Error al agregar estudiante:'), error);
    res.status(500).json({ error: 'Error al agregar estudiante' });
  }
});

// Ruta para actualizar un estudiante
app.put('/estudiantes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cu, grupo, celular, gmail } = req.body;

    // Validar datos
    if (!nombre || !cu || !grupo || !celular || !gmail) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Usar siempre el maestro para operaciones de escritura
    const [result] = await req.db.execute(
      'UPDATE estudiantes SET nombre = ?, cu = ?, grupo = ?, celular = ?, gmail = ? WHERE id = ?',
      [nombre, cu, grupo, celular, gmail, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json({ id, nombre, cu, grupo, celular, gmail });
  } catch (error) {
    console.error(colors.error('Error al actualizar estudiante:'), error);
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  }
});

// Ruta para eliminar un estudiante
app.delete('/estudiantes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Usar siempre el maestro para operaciones de escritura
    const [result] = await req.db.execute('DELETE FROM estudiantes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error(colors.error('Error al eliminar estudiante:'), error);
    res.status(500).json({ error: 'Error al eliminar estudiante' });
  }
});

// Iniciar servidor
async function startServer() {
  try {
    await db.initialize();
    
    // Escuchar cambios en el estado del esclavo
    db.on('slaveStatus', (isActive) => {
      console.log(`Estado del esclavo: ${isActive ? 'ACTIVO' : 'INACTIVO'}`);
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(colors.success('✓') + ' ' + colors.info(`Servidor corriendo en http://localhost:${PORT}`));
      console.log(colors.info('↳') + ' ' + colors.highlight(`Endpoint de salud: http://localhost:${PORT}/health`));
      
      // Mostrar información de las bases de datos
      console.log('\n' + colors.info('🔌 Configuración de bases de datos:'));
      console.log(colors.info('├─ ') + colors.highlight('MAESTRO:') + ` ${process.env.DB_MASTER_HOST}`);
      console.log(colors.info('└─ ') + colors.highlight('ESCLAVO: ') + ` ${process.env.DB_SLAVE_HOST}`);
      
      // Mostrar rutas disponibles
      console.log('\n' + colors.info('🛣️  Rutas disponibles:'));
      console.log(colors.info('├─ ') + colors.method('GET') + '    /estudiantes');
      console.log(colors.info('├─ ') + colors.method('POST') + '   /estudiantes');
      console.log(colors.info('├─ ') + colors.method('PUT') + '    /estudiantes/:id');
      console.log(colors.info('└─ ') + colors.method('DELETE') + ' /estudiantes/:id');
    });
  } catch (error) {
    console.error(colors.error('✗ No se pudo iniciar el servidor:'), error);
    process.exit(1);
  }
}

startServer();

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  const timestamp = new Date().toISOString();
  console.error('\n' + '='.repeat(80));
  console.error(colors.timestamp(`[${timestamp}]`) + ' ' + colors.error('✗ ERROR NO MANEJADO'));
  console.error('='.repeat(80));
  console.error(err);
  console.error('='.repeat(80) + '\n');
  process.exit(1);
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (err) => {
  const timestamp = new Date().toISOString();
  console.error('\n' + '='.repeat(80));
  console.error(colors.timestamp(`[${timestamp}]`) + ' ' + colors.error('✗ EXCEPCIÓN NO CAPTURADA'));
  console.error('='.repeat(80));
  console.error(err);
  console.error('='.repeat(80) + '\n');
  process.exit(1);
});

// Mostrar información de inicio
console.clear();
console.log(colors.highlight('='.repeat(60)));
console.log(colors.info('🚀 Iniciando Sistema de Gestión de Estudiantes'));
console.log(colors.highlight('='.repeat(60)));

module.exports = app;
