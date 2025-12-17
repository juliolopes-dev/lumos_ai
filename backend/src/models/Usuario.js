const { pool } = require('../config/database');

const Usuario = {
  async buscarPorId(id) {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async buscarPrimeiro() {
    const result = await pool.query(
      'SELECT * FROM usuarios ORDER BY id LIMIT 1'
    );
    return result.rows[0] || null;
  },

  async atualizar(id, dados) {
    const { nome, email, foto_url, foto_base64, configuracoes } = dados;
    
    const result = await pool.query(
      `UPDATE usuarios 
       SET nome = COALESCE($1, nome),
           email = COALESCE($2, email),
           foto_url = COALESCE($3, foto_url),
           foto_base64 = COALESCE($4, foto_base64),
           configuracoes = COALESCE($5, configuracoes),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [nome, email, foto_url, foto_base64, configuracoes ? JSON.stringify(configuracoes) : null, id]
    );
    return result.rows[0];
  },

  async atualizarFoto(id, fotoBase64) {
    const result = await pool.query(
      `UPDATE usuarios 
       SET foto_base64 = $1, atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [fotoBase64, id]
    );
    return result.rows[0];
  },

  async atualizarConfiguracoes(id, configuracoes) {
    const result = await pool.query(
      `UPDATE usuarios 
       SET configuracoes = $1, atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(configuracoes), id]
    );
    return result.rows[0];
  }
};

module.exports = Usuario;
