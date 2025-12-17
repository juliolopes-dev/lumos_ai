const { pool } = require('../config/database');

const migrate = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Executando migration 002: Adicionar suporte a Claude...');

    // Adicionar coluna provider se não existir
    await client.query(`
      ALTER TABLE usage_events 
      ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'claude';
    `);
    console.log('   ✅ Coluna "provider" adicionada');

    // Adicionar colunas de cache tokens
    await client.query(`
      ALTER TABLE usage_events 
      ADD COLUMN IF NOT EXISTS cache_creation_tokens INTEGER DEFAULT 0;
    `);
    console.log('   ✅ Coluna "cache_creation_tokens" adicionada');

    await client.query(`
      ALTER TABLE usage_events 
      ADD COLUMN IF NOT EXISTS cache_read_tokens INTEGER DEFAULT 0;
    `);
    console.log('   ✅ Coluna "cache_read_tokens" adicionada');

    // Atualizar registros existentes para ter provider 'openai' (eram do OpenAI)
    await client.query(`
      UPDATE usage_events 
      SET provider = 'openai' 
      WHERE provider IS NULL OR provider = 'claude';
    `);
    console.log('   ✅ Registros existentes marcados como "openai"');

    console.log('✅ Migration 002 concluída!');
    
  } catch (error) {
    console.error('❌ Erro na migration 002:', error.message);
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
