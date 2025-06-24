const mysql = require('mysql2/promise');
const { EventEmitter } = require('events');
const chalk = require('chalk');

// Configuración de colores
const colors = {
  success: chalk.green.bold,
  error: chalk.red.bold,
  warning: chalk.yellow.bold,
  info: chalk.blue.bold,
  highlight: chalk.cyan.bold,
  timestamp: chalk.gray
};

class DatabaseManager extends EventEmitter {
  constructor() {
    super();
    this.masterPool = null;
    this.slavePool = null;
    this.usingSlave = true;
    this.retryDelay = 5000; // 5 segundos
    this.retryTimer = null;
  }

  async initialize() {
    try {
      await this.initializeMaster();
      await this.initializeSlave();
    } catch (error) {
      console.error('Error inicializando la base de datos:', error.message);
      throw error;
    }
  }

  async initializeMaster() {
    try {
      this.masterPool = mysql.createPool({
        host: process.env.DB_MASTER_HOST,
        user: process.env.DB_MASTER_USER,
        password: process.env.DB_MASTER_PASSWORD,
        database: process.env.DB_MASTER_DATABASE,
        port: process.env.DB_MASTER_PORT || 3306,
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
        connectTimeout: 2000,
        acquireTimeout: 2000
      });

      // Verificar conexión
      const conn = await this.masterPool.getConnection();
      await conn.ping();
      conn.release();
      console.log(colors.success('✓') + ' ' + colors.info('Conexión MAESTRA establecida correctamente'));
      return true;
    } catch (error) {
      console.error(colors.error('✗') + ' ' + colors.error('Error al conectar con la base de datos MAESTRA:'), error.message);
      throw error;
    }
  }

  async initializeSlave() {
    try {
      this.slavePool = mysql.createPool({
        host: process.env.DB_SLAVE_HOST,
        user: process.env.DB_SLAVE_USER,
        password: process.env.DB_SLAVE_PASSWORD,
        database: process.env.DB_SLAVE_DATABASE,
        port: process.env.DB_SLAVE_PORT || 3306,
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
        connectTimeout: 2000,
        acquireTimeout: 2000
      });

      // Verificar conexión
      const conn = await this.slavePool.getConnection();
      await conn.ping();
      conn.release();
      console.log(colors.success('✓') + ' ' + colors.info('Conexión ESCLAVA establecida correctamente'));
      this.usingSlave = true;
      this.emit('slaveStatus', true);
      return true;
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.warn(colors.warning('⚠') + ' ' + colors.timestamp(`[${timestamp}]`) + ' ' + 
                 colors.warning('No se pudo conectar al esclavo, usando solo el maestro'));
      this.usingSlave = false;
      this.emit('slaveStatus', false);
      this.scheduleSlaveRetry();
      return false;
    }
  }

  scheduleSlaveRetry() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      const timestamp = new Date().toISOString();
    console.log(colors.highlight('⟳') + ' ' + colors.timestamp(`[${timestamp}]`) + ' ' + 
               colors.highlight('Intentando reconectar con el esclavo...'));
      this.initializeSlave();
    }, this.retryDelay);
  }

  getReadConnection() {
    return this.usingSlave && this.slavePool ? this.slavePool : this.masterPool;
  }

  getWriteConnection() {
    return this.masterPool;
  }

  async healthCheck() {
    try {
      const masterConn = await this.masterPool.getConnection();
      await masterConn.ping();
      masterConn.release();
      
      if (this.usingSlave && this.slavePool) {
        const slaveConn = await this.slavePool.getConnection();
        await slaveConn.ping();
        slaveConn.release();
      }
      
      return {
        status: 'healthy',
        master: true,
        slave: this.usingSlave
      };
    } catch (error) {
      console.error(colors.error('✗') + ' ' + colors.error('Error en health check:'), error.message);
      return {
        status: 'unhealthy',
        master: false,
        slave: false,
        error: error.message
      };
    }
  }
}

module.exports = new DatabaseManager();
