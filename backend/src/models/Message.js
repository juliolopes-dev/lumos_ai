const { pool } = require('../config/database');
const Attachment = require('./Attachment');

const Message = {
  async _anexarAnexos(mensagens) {
    if (!mensagens || mensagens.length === 0) return mensagens;
    const ids = mensagens.map((m) => m.id);
    const anexosRows = await Attachment.buscarPorMensagemIds(ids);

    const byMsg = new Map();
    for (const row of anexosRows) {
      const arr = byMsg.get(row.mensagem_id) || [];
      arr.push({
        type: row.tipo,
        mimeType: row.mime_type,
        data: row.data_base64,
        fileName: row.file_name || undefined
      });
      byMsg.set(row.mensagem_id, arr);
    }

    return mensagens.map((m) => ({
      ...m,
      anexos: byMsg.get(m.id) || []
    }));
  },

  // Salvar mensagem no PostgreSQL
  async salvar(assistenteId, papel, conteudo) {
    const query = `
      INSERT INTO mensagens (assistente_id, papel, conteudo)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query(query, [assistenteId, papel, conteudo]);
    return result.rows[0];
  },

  // Buscar últimas N mensagens de um assistente
  async buscarUltimas(assistenteId, limite = 20) {
    const query = `
      SELECT id, papel, conteudo, criado_em
      FROM mensagens
      WHERE assistente_id = $1
      ORDER BY criado_em DESC
      LIMIT $2;
    `;
    const result = await pool.query(query, [assistenteId, limite]);
    // Retorna em ordem cronológica (mais antiga primeiro)
    const mensagens = result.rows.reverse();
    return await this._anexarAnexos(mensagens);
  },

  // Buscar histórico completo de um assistente
  async buscarHistoricoCompleto(assistenteId) {
    const query = `
      SELECT id, papel, conteudo, criado_em
      FROM mensagens
      WHERE assistente_id = $1
      ORDER BY criado_em ASC;
    `;
    const result = await pool.query(query, [assistenteId]);
    return await this._anexarAnexos(result.rows);
  },

  // Limpar histórico de um assistente
  async limparHistorico(assistenteId) {
    const query = `
      DELETE FROM mensagens
      WHERE assistente_id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [assistenteId]);
    return result.rows.length;
  }
};

module.exports = Message;
