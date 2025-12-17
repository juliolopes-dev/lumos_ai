const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

const migrate = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Executando migration 005: Atualizar usuário padrão...');

    // Adicionar coluna senha_hash se não existir
    await client.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
    `);
    console.log('   ✅ Coluna "senha_hash" adicionada');

    // Hash da senha
    const senhaHash = await bcrypt.hash('Juliofran1996@', 10);

    // Atualizar usuário existente ou inserir novo
    const result = await client.query('SELECT id FROM usuarios WHERE email = $1', ['juliofranlopes18@gmail.com']);
    
    if (result.rows.length > 0) {
      // Atualizar usuário existente
      await client.query(`
        UPDATE usuarios 
        SET nome = 'Julio Lopes', 
            senha_hash = $1,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE email = 'juliofranlopes18@gmail.com'
      `, [senhaHash]);
      console.log('   ✅ Usuário existente atualizado');
    } else {
      // Verificar se existe algum usuário e atualizar ou criar novo
      const anyUser = await client.query('SELECT id FROM usuarios LIMIT 1');
      
      if (anyUser.rows.length > 0) {
        // Atualizar o primeiro usuário
        await client.query(`
          UPDATE usuarios 
          SET nome = 'Julio Lopes',
              email = 'juliofranlopes18@gmail.com',
              senha_hash = $1,
              atualizado_em = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [senhaHash, anyUser.rows[0].id]);
        console.log('   ✅ Usuário padrão atualizado com dados do Julio');
      } else {
        // Criar novo usuário
        await client.query(`
          INSERT INTO usuarios (nome, email, senha_hash, configuracoes)
          VALUES ('Julio Lopes', 'juliofranlopes18@gmail.com', $1, '{"theme": "dark"}')
        `, [senhaHash]);
        console.log('   ✅ Usuário Julio criado');
      }
    }

    console.log('✅ Migration 005 concluída!');
    
  } catch (error) {
    console.error('❌ Erro na migration 005:', error.message);
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
