const openai = require('../config/openai');

const imageService = {
  async gerarImagem(prompt) {
    const response = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      prompt,
      size: process.env.OPENAI_IMAGE_SIZE || '1024x1024',
    });

    const item = response?.data?.[0];
    const b64 = item?.b64_json;
    if (b64) {
      return {
        type: 'image',
        mimeType: 'image/png',
        data: b64
      };
    }

    const url = item?.url;
    if (url) {
      const imgRes = await fetch(url);
      if (!imgRes.ok) {
        throw new Error(`Falha ao baixar imagem gerada (HTTP ${imgRes.status})`);
      }
      const mimeType = imgRes.headers.get('content-type') || 'image/png';
      const arrayBuffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return {
        type: 'image',
        mimeType,
        data: base64
      };
    }

    throw new Error('Falha ao gerar imagem (resposta sem b64_json/url)');
  }
};

module.exports = imageService;
