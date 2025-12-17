const anthropic = require('../config/anthropic');

const claudeService = {
  /**
   * Chamada simples - retorna apenas o texto
   * @param {Array} messages - Array de mensagens no formato OpenAI
   * @param {Object} options - Opções de configuração
   * @returns {string} - Resposta do assistente
   */
  async chat(messages, options = {}) {
    try {
      const response = await this.chatDetailed(messages, options);
      return response.content;
    } catch (error) {
      console.error('Erro ao chamar Claude:', error.message);
      throw error;
    }
  },

  /**
   * Chamada detalhada - retorna conteúdo + usage + model
   * @param {Array} messages - Array de mensagens no formato OpenAI
   * @param {Object} options - Opções de configuração
   * @returns {Object} - { content, usage, model }
   */
  async chatDetailed(messages, options = {}) {
    try {
      // Separar system message do resto
      const systemMessages = messages.filter(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');
      
      // Concatenar todos os system messages em um só
      const systemPrompt = systemMessages
        .map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
        .join('\n\n');

      // Converter formato OpenAI para Claude
      const claudeMessages = this._convertMessages(userMessages);

      // Preparar tools (web_search - já acessa links automaticamente quando necessário)
      const tools = options.enableWebSearch !== false ? [
        {
          type: 'web_search_20250305',
          name: 'web_search'
        }
      ] : undefined;

      // Configurar system prompt com cache para economia de tokens
      const systemConfig = systemPrompt ? [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' } // Cache por 5 minutos
        }
      ] : undefined;

      // Chamar Claude
      const response = await anthropic.messages.create({
        model: options.model || process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
        max_tokens: options.max_tokens || parseInt(process.env.CLAUDE_MAX_TOKENS) || 4096,
        temperature: options.temperature || parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
        system: systemConfig,
        messages: claudeMessages,
        tools: tools
      });

      // Extrair texto da resposta
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      return {
        content: content,
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
          cache_creation_input_tokens: response.usage.cache_creation_input_tokens || 0,
          cache_read_input_tokens: response.usage.cache_read_input_tokens || 0
        },
        model: response.model
      };
    } catch (error) {
      console.error('Erro ao chamar Claude:', error.message);
      throw error;
    }
  },

  /**
   * Converte mensagens do formato OpenAI para formato Claude
   * Suporta mensagens com imagens (vision) e PDFs (document)
   */
  _convertMessages(messages) {
    return messages.map(msg => {
      const role = msg.role === 'assistant' ? 'assistant' : 'user';
      
      // Se content é string simples
      if (typeof msg.content === 'string') {
        return { role, content: msg.content };
      }
      
      // Se content é array (multimodal - texto + imagens + PDFs)
      if (Array.isArray(msg.content)) {
        const contentBlocks = msg.content.map(part => {
          // Texto
          if (part.type === 'text') {
            return { type: 'text', text: part.text };
          }
          
          // Imagem (formato OpenAI image_url)
          if (part.type === 'image_url' && part.image_url?.url) {
            const url = part.image_url.url;
            
            // Se é base64
            if (url.startsWith('data:')) {
              const matches = url.match(/^data:([^;]+);base64,(.+)$/);
              if (matches) {
                return {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: matches[1],
                    data: matches[2]
                  }
                };
              }
            }
            
            // Se é URL externa
            return {
              type: 'image',
              source: {
                type: 'url',
                url: url
              }
            };
          }
          
          // PDF/Documento (formato Claude document)
          if (part.type === 'document') {
            return {
              type: 'document',
              source: {
                type: 'base64',
                media_type: part.media_type || 'application/pdf',
                data: part.data
              }
            };
          }
          
          // Fallback para outros tipos
          return { type: 'text', text: JSON.stringify(part) };
        });
        
        return { role, content: contentBlocks };
      }
      
      // Fallback
      return { role, content: String(msg.content) };
    });
  }
};

module.exports = claudeService;
