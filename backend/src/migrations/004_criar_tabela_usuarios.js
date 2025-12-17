const { pool } = require('../config/database');

const migrate = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Executando migration 004: Criar tabela de usuários...');

    // Tabela: usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        foto_url TEXT,
        foto_base64 TEXT,
        configuracoes JSONB DEFAULT '{}',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Tabela "usuarios" criada');

    // Tabela: api_calls (monitoramento detalhado de chamadas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_calls (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        assistente_id INTEGER REFERENCES assistentes(id) ON DELETE SET NULL,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INTEGER,
        response_time_ms INTEGER,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        cache_read_tokens INTEGER DEFAULT 0,
        cache_creation_tokens INTEGER DEFAULT 0,
        model VARCHAR(100),
        provider VARCHAR(20) DEFAULT 'claude',
        error_message TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Tabela "api_calls" criada');

    // Índices para performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_api_calls_criado_em ON api_calls(criado_em);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_api_calls_usuario_id ON api_calls(usuario_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_api_calls_assistente_id ON api_calls(assistente_id);
    `);
    console.log('   ✅ Índices criados');

    // Inserir usuário padrão se não existir
    const result = await client.query('SELECT id FROM usuarios LIMIT 1');
    if (result.rows.length === 0) {
      await client.query(`
        INSERT INTO usuarios (nome, email, configuracoes)
        VALUES ('Usuário', 'usuario@lumos.ia', '{"theme": "dark"}')
      `);
      console.log('   ✅ Usuário padrão criado');
    }

    console.log('✅ Migration 004 concluída!');
    
  } catch (error) {
    console.error('❌ Erro na migration 004:', error.message);
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
