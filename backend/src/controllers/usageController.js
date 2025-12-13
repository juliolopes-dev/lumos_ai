const UsageEvent = require('../models/UsageEvent');

const usageController = {
  async resumo(req, res) {
    try {
      const summary = await UsageEvent.resumoMesAtual();

      const usdToBrl = Number(process.env.OPENAI_USD_TO_BRL || 0);
      const inputUsdPer1M = Number(process.env.OPENAI_INPUT_USD_PER_1M_TOKENS || 0);
      const outputUsdPer1M = Number(process.env.OPENAI_OUTPUT_USD_PER_1M_TOKENS || 0);
      const imageUsdPerImage = Number(process.env.OPENAI_IMAGE_USD_PER_IMAGE || 0);

      const missingPricing = !(usdToBrl > 0 && (inputUsdPer1M > 0 || outputUsdPer1M > 0 || imageUsdPerImage > 0));

      const usdTokens = (summary.prompt_tokens / 1_000_000) * inputUsdPer1M
        + (summary.completion_tokens / 1_000_000) * outputUsdPer1M;
      const usdImages = summary.n_images * imageUsdPerImage;
      const usdTotal = usdTokens + usdImages;
      const brlTotal = missingPricing ? null : usdTotal * usdToBrl;

      res.json({
        periodo: 'mes_atual',
        missing_pricing: missingPricing,
        tokens: {
          prompt: summary.prompt_tokens,
          completion: summary.completion_tokens,
          total: summary.total_tokens
        },
        imagens: {
          total: summary.n_images
        },
        precos: {
          usd_to_brl: usdToBrl,
          input_usd_per_1m_tokens: inputUsdPer1M,
          output_usd_per_1m_tokens: outputUsdPer1M,
          image_usd_per_image: imageUsdPerImage
        },
        custo: {
          usd_total: usdTotal,
          brl_total: brlTotal
        }
      });
    } catch (error) {
      console.error('Erro ao gerar resumo de uso:', error);
      res.status(500).json({ erro: 'Erro ao gerar resumo de uso' });
    }
  }
};

module.exports = usageController;
