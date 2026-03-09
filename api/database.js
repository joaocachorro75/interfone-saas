// Conexao MySQL para Interfone SaaS
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'database',
  user: process.env.DB_USER || 'saas_user',
  password: process.env.DB_PASS || 'SaasPass2024',
  database: process.env.DB_NAME || 'interfone_saas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('[DB] MySQL conectado!');
    conn.release();
    return true;
  } catch (err) {
    console.error('[DB] Erro:', err.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
  query: (sql, params) => pool.query(sql, params)
};
