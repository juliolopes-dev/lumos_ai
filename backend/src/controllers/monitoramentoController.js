const ApiCall = require('../models/ApiCall');

const monitoramentoController = {
  // GET /api/monitoramento/estatisticas
  async estatisticas(req, res) {
    try {
      const { periodo = '24h' } = req.query;
      
      const stats = await ApiCall.buscarEstatisticas(periodo);
      
      res.json({
        periodo,
        total_chamadas: parseInt(stats.total_chamadas) || 0,
        sucesso: parseInt(stats.sucesso) || 0,
        erros: parseInt(stats.erros) || 0,
        taxa_sucesso: stats.total_chamadas > 0 
          ? ((stats.sucesso / stats.total_chamadas) * 100).toFixed(1) + '%'
          : '0%',
        tokens: {
          input: parseInt(stats.total_input_tokens) || 0,
          output: parseInt(stats.total_output_tokens) || 0,
          total: parseInt(stats.total_input_tokens) + parseInt(stats.total_output_tokens) || 0,
          cache_read: parseInt(stats.total_cache_read) || 0,
          cache_creation: parseInt(stats.total_cache_creation) || 0
        },
        tempo_medio_ms: Math.round(stats.tempo_medio_ms) || 0,
        primeira_chamada: stats.primeira_chamada,
        ultima_chamada: stats.ultima_chamada
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ erro: 'Erro ao buscar estatísticas' });
    }
  },

  // GET /api/monitoramento/por-hora
  async porHora(req, res) {
    try {
      const { horas = 24 } = req.query;
      
      const dados = await ApiCall.buscarPorHora(parseInt(horas));
      
      res.json({
        periodo_horas: parseInt(horas),
        dados: dados.map(d => ({
          hora: d.hora,
          chamadas: parseInt(d.chamadas),
          tokens: parseInt(d.tokens)
        }))
      });
    } catch (error) {
      console.error('Erro ao buscar dados por hora:', error);
      res.status(500).json({ erro: 'Erro ao buscar dados por hora' });
    }
  },

  // GET /api/monitoramento/ultimas
  async ultimas(req, res) {
    try {
      const { limite = 50 } = req.query;
      
      const chamadas = await ApiCall.buscarUltimas(parseInt(limite));
      
      res.json({
        total: chamadas.length,
        chamadas: chamadas.map(c => ({
          id: c.id,
          endpoint: c.endpoint,
          method: c.method,
          status_code: c.status_code,
          response_time_ms: c.response_time_ms,
          tokens: {
            input: c.input_tokens,
            output: c.output_tokens,
            cache_read: c.cache_read_tokens,
            cache_creation: c.cache_creation_tokens
          },
          model: c.model,
          provider: c.provider,
          assistente: c.assistente_nome,
          erro: c.error_message,
          criado_em: c.criado_em
        }))
      });
    } catch (error) {
      console.error('Erro ao buscar últimas chamadas:', error);
      res.status(500).json({ erro: 'Erro ao buscar últimas chamadas' });
    }
  }
};

module.exports = monitoramentoController;
