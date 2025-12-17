const createTables = async (pool) => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Executando migrações...');

    // Tabela: assistentes
    await client.query(`
      CREATE TABLE IF NOT EXISTS assistentes (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        contexto TEXT NOT NULL,
        temperature DECIMAL(3,2) DEFAULT 0.7,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Tabela "assistentes" verificada/criada');

    // Tabela: mensagens
    await client.query(`
      CREATE TABLE IF NOT EXISTS mensagens (
        id SERIAL PRIMARY KEY,
        assistente_id INTEGER NOT NULL REFERENCES assistentes(id) ON DELETE CASCADE,
        papel VARCHAR(20) NOT NULL CHECK (papel IN ('usuario', 'assistente')),
        conteudo TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Tabela "mensagens" verificada/criada');

    // Tabela: anexos de mensagens (imagens, etc.)
    await client.query(`
      CREATE TABLE IF NOT EXISTS mensagem_anexos (
        id SERIAL PRIMARY KEY,
        mensagem_id INTEGER NOT NULL REFERENCES mensagens(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        data_base64 TEXT NOT NULL,
        file_name VARCHAR(255),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Tabela "mensagem_anexos" verificada/criada');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mensagem_anexos_mensagem_id
      ON mensagem_anexos(mensagem_id);
    `);
    console.log('   ✅ Índice "idx_mensagem_anexos_mensagem_id" verificado/criado');

    // Tabela: eventos de uso (tokens e imagens)
    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id SERIAL PRIMARY KEY,
        assistente_id INTEGER REFERENCES assistentes(id) ON DELETE SET NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('chat', 'image')),
        model VARCHAR(100),
        prompt_tokens INTEGER DEFAULT 0,
        completion_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        image_size VARCHAR(20),
        n_images INTEGER DEFAULT 0,
        provider VARCHAR(20) DEFAULT 'claude',
        cache_creation_tokens INTEGER DEFAULT 0,
        cache_read_tokens INTEGER DEFAULT 0,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Tabela "usage_events" verificada/criada');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_events_criado_em
      ON usage_events(criado_em);
    `);
    console.log('   ✅ Índice "idx_usage_events_criado_em" verificado/criado');

    // Índice para buscar mensagens por assistente
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mensagens_assistente_id 
      ON mensagens(assistente_id);
    `);
    console.log('   ✅ Índice "idx_mensagens_assistente_id" verificado/criado');

    console.log('✅ Migrações concluídas!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { createTables };
