const { pool } = require('../config/database');

const UsageEvent = {
  async salvarChat(assistenteId, model, usage) {
    const promptTokens = Number(usage?.prompt_tokens || 0);
    const completionTokens = Number(usage?.completion_tokens || 0);
    const totalTokens = Number(usage?.total_tokens || (promptTokens + completionTokens));

    const query = `
      INSERT INTO usage_events (assistente_id, tipo, model, prompt_tokens, completion_tokens, total_tokens)
      VALUES ($1, 'chat', $2, $3, $4, $5)
      RETURNING *;
    `;

    const result = await pool.query(query, [assistenteId ? Number(assistenteId) : null, model || null, promptTokens, completionTokens, totalTokens]);
    return result.rows[0];
  },

  async salvarImagem(assistenteId, model, size, nImages = 1) {
    const query = `
      INSERT INTO usage_events (assistente_id, tipo, model, image_size, n_images)
      VALUES ($1, 'image', $2, $3, $4)
      RETURNING *;
    `;

    const result = await pool.query(query, [assistenteId ? Number(assistenteId) : null, model || null, size || null, Number(nImages || 1)]);
    return result.rows[0];
  },

  async resumoMesAtual() {
    const query = `
      SELECT
        COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens,
        COALESCE(SUM(completion_tokens), 0) AS completion_tokens,
        COALESCE(SUM(total_tokens), 0) AS total_tokens,
        COALESCE(SUM(n_images), 0) AS n_images
      FROM usage_events
      WHERE criado_em >= date_trunc('month', now())
        AND criado_em < (date_trunc('month', now()) + interval '1 month');
    `;

    const result = await pool.query(query);
    const row = result.rows[0] || {};

    return {
      prompt_tokens: Number(row.prompt_tokens || 0),
      completion_tokens: Number(row.completion_tokens || 0),
      total_tokens: Number(row.total_tokens || 0),
      n_images: Number(row.n_images || 0)
    };
  }
};

module.exports = UsageEvent;
