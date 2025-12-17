const { pool } = require('../config/database');

const migrate = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Executando migration 003: Adicionar temperature aos assistentes...');

    // Adicionar coluna temperature se não existir
    await client.query(`
      ALTER TABLE assistentes 
      ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7;
    `);
    console.log('   ✅ Coluna "temperature" adicionada à tabela assistentes');

    console.log('✅ Migration 003 concluída!');
    
  } catch (error) {
    console.error('❌ Erro na migration 003:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { migrate };

// Executar se chamado diretamente
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
