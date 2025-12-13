const { pool } = require('../config/database');

const Assistant = {
  // Criar novo assistente
  async criar(titulo, contexto) {
    const query = `
      INSERT INTO assistentes (titulo, contexto)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const result = await pool.query(query, [titulo, contexto]);
    return result.rows[0];
  },

  // Listar todos os assistentes
  async listarTodos() {
    const query = `
      SELECT * FROM assistentes
      ORDER BY criado_em DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Buscar assistente por ID
  async buscarPorId(id) {
    const query = `
      SELECT * FROM assistentes
      WHERE id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Atualizar assistente
  async atualizar(id, titulo, contexto) {
    const query = `
      UPDATE assistentes
      SET titulo = $1, contexto = $2, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;
    const result = await pool.query(query, [titulo, contexto, id]);
    return result.rows[0];
  },

  // Excluir assistente
  async excluir(id) {
    const query = `
      DELETE FROM assistentes
      WHERE id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = Assistant;
