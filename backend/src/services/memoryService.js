const { redisClient } = require('../config/redis');
const Message = require('../models/Message');

const CACHE_TTL = 60 * 60 * 24; // 24 horas em segundos
const MAX_MENSAGENS_CACHE = 20;

const memoryService = {
  /**
   * Gera a chave do Redis para um assistente
   */
  _getCacheKey(assistenteId) {
    return `chat:${assistenteId}`;
  },

  /**
   * Busca histórico recente de mensagens
   * Primeiro tenta Redis, se vazio busca do PostgreSQL
   */
  async buscarHistorico(assistenteId) {
    const cacheKey = this._getCacheKey(assistenteId);

    try {
      // Tenta buscar do Redis
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Se não tem cache, busca do PostgreSQL
      const mensagens = await Message.buscarUltimas(assistenteId, MAX_MENSAGENS_CACHE);
      
      // Popula o cache se houver mensagens
      if (mensagens.length > 0) {
        await this._atualizarCache(assistenteId, mensagens);
      }

      return mensagens;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error.message);
      // Em caso de erro no Redis, busca direto do PostgreSQL
      return await Message.buscarUltimas(assistenteId, MAX_MENSAGENS_CACHE);
    }
  },

  /**
   * Salva uma mensagem (PostgreSQL + Redis)
   */
  async salvarMensagem(assistenteId, papel, conteudo) {
    // Salva no PostgreSQL (permanente)
    const mensagem = await Message.salvar(assistenteId, papel, conteudo);

    // Atualiza o cache do Redis
    try {
      await this._adicionarAoCache(assistenteId, {
        id: mensagem.id,
        papel: mensagem.papel,
        conteudo: mensagem.conteudo,
        criado_em: mensagem.criado_em
      });
    } catch (error) {
      console.error('Erro ao atualizar cache Redis:', error.message);
      // Não falha se Redis der erro, PostgreSQL já salvou
    }

    return mensagem;
  },

  /**
   * Adiciona mensagem ao cache e mantém limite de 20
   */
  async _adicionarAoCache(assistenteId, mensagem) {
    const cacheKey = this._getCacheKey(assistenteId);
    
    // Busca cache atual
    const cached = await redisClient.get(cacheKey);
    let mensagens = cached ? JSON.parse(cached) : [];

    // Adiciona nova mensagem
    mensagens.push(mensagem);

    // Mantém apenas as últimas 20
    if (mensagens.length > MAX_MENSAGENS_CACHE) {
      mensagens = mensagens.slice(-MAX_MENSAGENS_CACHE);
    }

    // Salva no Redis com TTL
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(mensagens));
  },

  /**
   * Atualiza cache com array de mensagens
   */
  async _atualizarCache(assistenteId, mensagens) {
    const cacheKey = this._getCacheKey(assistenteId);
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(mensagens));
  },

  /**
   * Limpa o cache de um assistente
   */
  async limparCache(assistenteId) {
    const cacheKey = this._getCacheKey(assistenteId);
    await redisClient.del(cacheKey);
  },

  /**
   * Busca histórico completo (do PostgreSQL)
   */
  async buscarHistoricoCompleto(assistenteId) {
    return await Message.buscarHistoricoCompleto(assistenteId);
  },

  /**
   * Limpa todo o histórico de um assistente (PostgreSQL + Redis)
   */
  async limparHistorico(assistenteId) {
    await this.limparCache(assistenteId);
    return await Message.limparHistorico(assistenteId);
  }
};

module.exports = memoryService;
