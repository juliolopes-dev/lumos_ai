const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const connectPostgres = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL conectado com sucesso!');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar PostgreSQL:', error.message);
    return false;
  }
};

module.exports = { pool, connectPostgres };
