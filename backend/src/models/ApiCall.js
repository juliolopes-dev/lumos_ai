const { pool } = require('../config/database');

const ApiCall = {
  async registrar(dados) {
    const {
      usuario_id,
      assistente_id,
      endpoint,
      method,
      status_code,
      response_time_ms,
      input_tokens,
      output_tokens,
      cache_read_tokens,
      cache_creation_tokens,
      model,
      provider,
      error_message
    } = dados;

    const result = await pool.query(
      `INSERT INTO api_calls 
       (usuario_id, assistente_id, endpoint, method, status_code, response_time_ms,
        input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens,
        model, provider, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        usuario_id || null,
        assistente_id || null,
        endpoint,
        method,
        status_code || null,
        response_time_ms || null,
        input_tokens || 0,
        output_tokens || 0,
        cache_read_tokens || 0,
        cache_creation_tokens || 0,
        model || null,
        provider || 'claude',
        error_message || null
      ]
    );
    return result.rows[0];
  },

  async buscarEstatisticas(periodo = '24h') {
    let intervalo;
    switch (periodo) {
      case '1h': intervalo = '1 hour'; break;
      case '24h': intervalo = '24 hours'; break;
      case '7d': intervalo = '7 days'; break;
      case '30d': intervalo = '30 days'; break;
      default: intervalo = '24 hours';
    }

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_chamadas,
        COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as sucesso,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as erros,
        COALESCE(SUM(input_tokens), 0) as total_input_tokens,
        COALESCE(SUM(output_tokens), 0) as total_output_tokens,
        COALESCE(SUM(cache_read_tokens), 0) as total_cache_read,
        COALESCE(SUM(cache_creation_tokens), 0) as total_cache_creation,
        COALESCE(AVG(response_time_ms), 0) as tempo_medio_ms,
        MIN(criado_em) as primeira_chamada,
        MAX(criado_em) as ultima_chamada
      FROM api_calls
      WHERE criado_em >= NOW() - INTERVAL '${intervalo}'
    `);
    return result.rows[0];
  },

  async buscarPorHora(horas = 24) {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', criado_em) as hora,
        COUNT(*) as chamadas,
        COALESCE(SUM(input_tokens + output_tokens), 0) as tokens
      FROM api_calls
      WHERE criado_em >= NOW() - INTERVAL '${horas} hours'
      GROUP BY DATE_TRUNC('hour', criado_em)
      ORDER BY hora DESC
    `);
    return result.rows;
  },

  async buscarUltimas(limite = 50) {
    const result = await pool.query(`
      SELECT 
        ac.*,
        a.titulo as assistente_nome
      FROM api_calls ac
      LEFT JOIN assistentes a ON ac.assistente_id = a.id
      ORDER BY ac.criado_em DESC
      LIMIT $1
    `, [limite]);
    return result.rows;
  },

  async buscarPorAssistente(assistenteId, limite = 20) {
    const result = await pool.query(`
      SELECT * FROM api_calls
      WHERE assistente_id = $1
      ORDER BY criado_em DESC
      LIMIT $2
    `, [assistenteId, limite]);
    return result.rows;
  }
};

module.exports = ApiCall;
