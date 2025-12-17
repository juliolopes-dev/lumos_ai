const UsageEvent = require('../models/UsageEvent');

const usageController = {
  async resumo(req, res) {
    try {
      const summary = await UsageEvent.resumoMesAtual();

      const usdToBrl = Number(process.env.USD_TO_BRL || 5.42);
      
      // Claude pricing
      const claudeInputPer1M = Number(process.env.CLAUDE_INPUT_USD_PER_1M_TOKENS || 3.00);
      const claudeOutputPer1M = Number(process.env.CLAUDE_OUTPUT_USD_PER_1M_TOKENS || 15.00);

      const missingPricing = !(usdToBrl > 0 && (claudeInputPer1M > 0 || claudeOutputPer1M > 0));

      // Calcular custo de tokens (Claude)
      const usdTokens = (summary.prompt_tokens / 1_000_000) * claudeInputPer1M
        + (summary.completion_tokens / 1_000_000) * claudeOutputPer1M;
      
      const usdTotal = usdTokens;
      const brlTotal = missingPricing ? null : usdTotal * usdToBrl;

      // Calcular economia do cache
      const cacheReadTokens = summary.cache_read_tokens || 0;
      const cacheSavingsUsd = (cacheReadTokens / 1_000_000) * claudeInputPer1M * 0.9; // 90% economia

      res.json({
        periodo: 'mes_atual',
        missing_pricing: missingPricing,
        provider: 'claude',
        tokens: {
          prompt: summary.prompt_tokens,
          completion: summary.completion_tokens,
          total: summary.total_tokens,
          cache_creation: summary.cache_creation_tokens || 0,
          cache_read: cacheReadTokens
        },
        precos: {
          usd_to_brl: usdToBrl,
          claude_input_usd_per_1m_tokens: claudeInputPer1M,
          claude_output_usd_per_1m_tokens: claudeOutputPer1M
        },
        custo: {
          usd_total: usdTotal,
          brl_total: brlTotal,
          cache_savings_usd: cacheSavingsUsd,
          cache_savings_brl: cacheSavingsUsd * usdToBrl
        }
      });
    } catch (error) {
      console.error('Erro ao gerar resumo de uso:', error);
      res.status(500).json({ erro: 'Erro ao gerar resumo de uso' });
    }
  }
};

module.exports = usageController;
