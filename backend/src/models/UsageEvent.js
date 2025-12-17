const { pool } = require('../config/database');

const UsageEvent = {
  async salvarChat(assistenteId, model, usage, provider = 'claude') {
    const promptTokens = Number(usage?.prompt_tokens || 0);
    const completionTokens = Number(usage?.completion_tokens || 0);
    const totalTokens = Number(usage?.total_tokens || (promptTokens + completionTokens));
    const cacheCreationTokens = Number(usage?.cache_creation_input_tokens || 0);
    const cacheReadTokens = Number(usage?.cache_read_input_tokens || 0);

    const query = `
      INSERT INTO usage_events (assistente_id, tipo, model, prompt_tokens, completion_tokens, total_tokens, provider, cache_creation_tokens, cache_read_tokens)
      VALUES ($1, 'chat', $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      assistenteId ? Number(assistenteId) : null, 
      model || null, 
      promptTokens, 
      completionTokens, 
      totalTokens,
      provider,
      cacheCreationTokens,
      cacheReadTokens
    ]);
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
        COALESCE(SUM(n_images), 0) AS n_images,
        COALESCE(SUM(cache_creation_tokens), 0) AS cache_creation_tokens,
        COALESCE(SUM(cache_read_tokens), 0) AS cache_read_tokens
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
      n_images: Number(row.n_images || 0),
      cache_creation_tokens: Number(row.cache_creation_tokens || 0),
      cache_read_tokens: Number(row.cache_read_tokens || 0)
    };
  },

  calcularCustoClaude(usage) {
    if (!usage) return { usd: 0, brl: 0 };
    
    const inputCostPer1M = parseFloat(process.env.CLAUDE_INPUT_USD_PER_1M_TOKENS || 3.00);
    const outputCostPer1M = parseFloat(process.env.CLAUDE_OUTPUT_USD_PER_1M_TOKENS || 15.00);
    const usdToBrl = parseFloat(process.env.OPENAI_USD_TO_BRL || 5.42);
    
    const inputCost = (usage.prompt_tokens / 1_000_000) * inputCostPer1M;
    const outputCost = (usage.completion_tokens / 1_000_000) * outputCostPer1M;
    const usdTotal = inputCost + outputCost;
    
    return {
      usd: usdTotal,
      brl: usdTotal * usdToBrl
    };
  }
};

module.exports = UsageEvent;
