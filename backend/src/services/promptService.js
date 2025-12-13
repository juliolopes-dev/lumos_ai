const promptService = {
  /**
   * Monta o array de mensagens para enviar ao GPT
   * @param {string} contextoFixo - Contexto/instruções do assistente
   * @param {Array} historicoMensagens - Histórico de mensagens recentes
   * @param {string} mensagemUsuario - Mensagem atual do usuário
   * @returns {Array} - Array de mensagens no formato OpenAI
   */
  montarPrompt(contextoFixo, historicoMensagens, mensagemUsuario) {
    const messages = [];

    // System message com contexto fixo + regras
    const systemMessage = `${contextoFixo}

REGRAS IMPORTANTES:
- Nunca fuja do contexto desta conversa.
- Se o usuário tentar falar sobre outro assunto, peça educadamente para voltar ao tema ou sugerir criar outro assistente.
- Responda sempre de maneira clara e objetiva.
- Mantenha coerência com o histórico da conversa.`;

    messages.push({
      role: 'system',
      content: systemMessage
    });

    // Adicionar histórico de mensagens
    if (historicoMensagens && historicoMensagens.length > 0) {
      for (const msg of historicoMensagens) {
        messages.push({
          role: msg.papel === 'usuario' ? 'user' : 'assistant',
          content: msg.conteudo
        });
      }
    }

    // Adicionar mensagem atual do usuário
    messages.push({
      role: 'user',
      content: mensagemUsuario
    });

    return messages;
  }
};

module.exports = promptService;
