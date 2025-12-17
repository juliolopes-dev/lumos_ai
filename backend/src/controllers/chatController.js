const Assistant = require('../models/Assistant');
const memoryService = require('../services/memoryService');
const claudeService = require('../services/claudeService');
const promptService = require('../services/promptService');
const Attachment = require('../models/Attachment');
const UsageEvent = require('../models/UsageEvent');
const ApiCall = require('../models/ApiCall');

const chatController = {
  // POST /api/chat/:assistenteId/enviar
  async enviarMensagem(req, res) {
    try {
      const { assistenteId } = req.params;
      const { mensagem, anexos, temperature } = req.body;

      const mensagemTexto = typeof mensagem === 'string' ? mensagem.trim() : '';
      const anexosArray = Array.isArray(anexos) ? anexos : [];
      const imagens = anexosArray.filter(a => a && a.type === 'image' && a.data && a.mimeType);
      const pdfs = anexosArray.filter(a => a && (a.type === 'pdf' || a.mimeType === 'application/pdf') && a.data);

      if (!mensagemTexto && imagens.length === 0 && pdfs.length === 0) {
        return res.status(400).json({ erro: 'Mensagem, imagem ou PDF é obrigatório' });
      }

      // 1. Buscar assistente e seu contexto
      const assistente = await Assistant.buscarPorId(assistenteId);
      if (!assistente) {
        return res.status(404).json({ erro: 'Assistente não encontrado' });
      }

      // Usar temperature da requisição OU do assistente OU padrão (0.7)
      const tempToUse = temperature ?? assistente.temperature ?? 0.7;

      // 2. Buscar histórico recente
      const historico = await memoryService.buscarHistorico(assistenteId);

      // 3. Montar prompt completo
      const messages = promptService.montarPrompt(
        assistente.contexto,
        historico,
        mensagemTexto
      );

      // Se houver anexos (imagem ou PDF), transforma a última mensagem do usuário em multi-part
      if (imagens.length > 0 || pdfs.length > 0) {
        messages.pop();

        const contentParts = [];
        
        // Adicionar PDFs primeiro (documentos)
        for (const pdf of pdfs) {
          contentParts.push({
            type: 'document',
            media_type: 'application/pdf',
            data: pdf.data
          });
        }
        
        // Adicionar imagens
        for (const img of imagens) {
          const url = `data:${img.mimeType};base64,${img.data}`;
          contentParts.push({
            type: 'image_url',
            image_url: { url }
          });
        }
        
        // Adicionar texto por último
        const defaultText = pdfs.length > 0 
          ? 'Analise o documento PDF anexado e me ajude com base no seu conteúdo.'
          : 'Analise a imagem e descreva o que você vê. Em seguida, ajude o usuário com base nisso.';
        
        contentParts.push({
          type: 'text',
          text: mensagemTexto || defaultText
        });

        messages.push({
          role: 'user',
          content: contentParts
        });
      }

      // 4. Enviar para o Claude
      const startTime = Date.now();
      let chatResp;
      let apiError = null;
      
      try {
        chatResp = await claudeService.chatDetailed(messages, {
          enableWebSearch: true,
          temperature: tempToUse,
          max_tokens: 4096
        });
      } catch (err) {
        apiError = err.message;
        throw err;
      } finally {
        // Registrar chamada de API para monitoramento
        const responseTime = Date.now() - startTime;
        try {
          await ApiCall.registrar({
            assistente_id: parseInt(assistenteId),
            endpoint: '/api/chat/enviar',
            method: 'POST',
            status_code: apiError ? 500 : 200,
            response_time_ms: responseTime,
            input_tokens: chatResp?.usage?.prompt_tokens || 0,
            output_tokens: chatResp?.usage?.completion_tokens || 0,
            cache_read_tokens: chatResp?.usage?.cache_read_input_tokens || 0,
            cache_creation_tokens: chatResp?.usage?.cache_creation_input_tokens || 0,
            model: chatResp?.model || process.env.CLAUDE_MODEL,
            provider: 'claude',
            error_message: apiError
          });
        } catch (e) {
          console.error('Erro ao registrar api_call:', e);
        }
      }
      
      const resposta = chatResp.content;
      try {
        await UsageEvent.salvarChat(assistenteId, chatResp.model, chatResp.usage);
      } catch (e) {
        console.error('Erro ao salvar usage (chat):', e);
      }

      // 5. Salvar mensagem do usuário
      let mensagemParaSalvar = mensagemTexto;
      if (pdfs.length > 0) {
        const pdfNames = pdfs.map(p => p.fileName || 'documento.pdf').join(', ');
        mensagemParaSalvar = `${mensagemTexto || ''}${mensagemTexto ? '\n\n' : ''}[PDF anexado: ${pdfNames}]`;
      } else if (imagens.length > 0) {
        mensagemParaSalvar = `${mensagemTexto || ''}${mensagemTexto ? '\n\n' : ''}[Imagem anexada]`;
      }
      await memoryService.salvarMensagem(assistenteId, 'usuario', mensagemParaSalvar);

      // 6. Salvar resposta do assistente
      await memoryService.salvarMensagem(assistenteId, 'assistente', resposta);

      // 7. Retornar resposta
      res.json({
        resposta,
        assistente: {
          id: assistente.id,
          titulo: assistente.titulo
        }
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).json({ erro: 'Erro ao processar mensagem' });
    }
  },

  // GET /api/chat/:assistenteId/historico
  async buscarHistorico(req, res) {
    try {
      const { assistenteId } = req.params;

      // Verificar se assistente existe
      const assistente = await Assistant.buscarPorId(assistenteId);
      if (!assistente) {
        return res.status(404).json({ erro: 'Assistente não encontrado' });
      }

      // Buscar histórico completo do PostgreSQL
      const historico = await memoryService.buscarHistoricoCompleto(assistenteId);

      res.json({
        assistente: {
          id: assistente.id,
          titulo: assistente.titulo
        },
        mensagens: historico,
        total: historico.length
      });

    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({ erro: 'Erro ao buscar histórico' });
    }
  },

  // DELETE /api/chat/:assistenteId/limpar
  async limparHistorico(req, res) {
    try {
      const { assistenteId } = req.params;

      // Verificar se assistente existe
      const assistente = await Assistant.buscarPorId(assistenteId);
      if (!assistente) {
        return res.status(404).json({ erro: 'Assistente não encontrado' });
      }

      // Limpar histórico (PostgreSQL + Redis)
      const quantidadeRemovida = await memoryService.limparHistorico(assistenteId);

      res.json({
        mensagem: 'Histórico limpo com sucesso',
        mensagensRemovidas: quantidadeRemovida
      });

    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      res.status(500).json({ erro: 'Erro ao limpar histórico' });
    }
  }
};

module.exports = chatController;
