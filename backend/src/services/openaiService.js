const openai = require('../config/openai');

const openaiService = {
  /**
   * Envia mensagens para o GPT e retorna a resposta
   * @param {Array} messages - Array de mensagens no formato OpenAI
   * @returns {string} - Resposta do assistente
   */
  async chat(messages, options = {}) {
    try {
      const response = await openai.chat.completions.create({
        model: options.model || process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erro ao chamar OpenAI:', error.message);
      throw error;
    }
  },

  async chatDetailed(messages, options = {}) {
    try {
      const response = await openai.chat.completions.create({
        model: options.model || process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
      });

      return {
        content: response.choices?.[0]?.message?.content || '',
        usage: response.usage || null,
        model: response.model || (options.model || process.env.OPENAI_MODEL || 'gpt-4.1-mini')
      };
    } catch (error) {
      console.error('Erro ao chamar OpenAI:', error.message);
      throw error;
    }
  }
};

module.exports = openaiService;
