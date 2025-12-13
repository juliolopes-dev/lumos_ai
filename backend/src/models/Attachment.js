const { pool } = require('../config/database');

const Attachment = {
  async salvar(mensagemId, type, mimeType, data, fileName = null) {
    const query = `
      INSERT INTO mensagem_anexos (mensagem_id, tipo, mime_type, data_base64, file_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [mensagemId, type, mimeType, data, fileName]);
    return result.rows[0];
  },

  async buscarPorMensagemIds(mensagemIds) {
    if (!mensagemIds || mensagemIds.length === 0) return [];

    const query = `
      SELECT id, mensagem_id, tipo, mime_type, data_base64, file_name, criado_em
      FROM mensagem_anexos
      WHERE mensagem_id = ANY($1::int[])
      ORDER BY id ASC;
    `;

    const result = await pool.query(query, [mensagemIds.map((id) => Number(id))]);
    return result.rows;
  }
};

module.exports = Attachment;
