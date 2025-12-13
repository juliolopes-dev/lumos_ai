const Assistant = require('../models/Assistant');
const memoryService = require('../services/memoryService');
const openaiService = require('../services/openaiService');
const promptService = require('../services/promptService');
const imageService = require('../services/imageService');
const Attachment = require('../models/Attachment');
const UsageEvent = require('../models/UsageEvent');

const chatController = {
  // POST /api/chat/:assistenteId/enviar
  async enviarMensagem(req, res) {
    try {
      const { assistenteId } = req.params;
      const { mensagem, anexos } = req.body;

      const mensagemTexto = typeof mensagem === 'string' ? mensagem.trim() : '';
      const anexosArray = Array.isArray(anexos) ? anexos : [];
      const imagens = anexosArray.filter(a => a && a.type === 'image' && a.data && a.mimeType);

      if (!mensagemTexto && imagens.length === 0) {
        return res.status(400).json({ erro: 'Mensagem ou imagem é obrigatória' });
      }

      // 1. Buscar assistente e seu contexto
      const assistente = await Assistant.buscarPorId(assistenteId);
      if (!assistente) {
        return res.status(404).json({ erro: 'Assistente não encontrado' });
      }

      // 2. Buscar histórico recente
      const historico = await memoryService.buscarHistorico(assistenteId);

      const textoLower = (mensagemTexto || '').toLowerCase();
      const temVerboGeracao = /\b(criar|crie|cria|gerar|gere|gera|fazer|faça|faz|desenhar|desenhe|ilustrar|ilustre)\b/.test(textoLower);
      const temPalavraImagemNoTexto = /\b(imagem|foto|figura|ilustra[cç][aã]o|desenho|arte|poster|cartaz|logo)\b/.test(textoLower);

      const historicoLower = (historico || [])
        .slice(-6)
        .map((m) => String(m.conteudo || '').toLowerCase())
        .join('\n');
      const historicoSugereImagem = /\b(imagem|foto|ilustra[cç][aã]o|desenho|arte|poster|cartaz|logo)\b/.test(historicoLower);

      const solicitarImagem = temVerboGeracao && (temPalavraImagemNoTexto || historicoSugereImagem || imagens.length > 0);

      if (solicitarImagem) {
        const historicoTexto = (historico || []).map((m) => {
          const role = m.papel === 'usuario' ? 'Usuário' : 'Assistente';
          return `${role}: ${m.conteudo}`;
        }).join('\n');

        let referenciaVisual = '';
        if (imagens.length > 0) {
          const visionParts = [];
          visionParts.push({
            type: 'text',
            text: `Descreva detalhadamente esta imagem (estilo, cores, composição, assunto) para que eu possa gerar uma nova imagem baseada nela.\n\nPedido do usuário: ${mensagemTexto || '(sem texto)'}\n\nResponda apenas com a descrição.`
          });
          for (const img of imagens) {
            const url = `data:${img.mimeType};base64,${img.data}`;
            visionParts.push({ type: 'image_url', image_url: { url } });
          }
          const visionResp = await openaiService.chatDetailed([
            { role: 'system', content: 'Você descreve imagens de forma objetiva e detalhada.' },
            { role: 'user', content: visionParts }
          ], { temperature: 0.2, max_tokens: 600 });
          referenciaVisual = visionResp.content;
          try {
            await UsageEvent.salvarChat(assistenteId, visionResp.model, visionResp.usage);
          } catch (e) {
            console.error('Erro ao salvar usage (vision):', e);
          }
        }

        const promptResp = await openaiService.chatDetailed([
          {
            role: 'system',
            content: 'Você é um especialista em transformar conversas em prompts para gerar imagens. Gere um único prompt detalhado e objetivo para um gerador de imagens. Use o contexto do assistente e o histórico para manter consistência. Retorne APENAS o prompt, sem aspas, sem markdown.'
          },
          {
            role: 'user',
            content: `CONTEXTO DO ASSISTENTE:\n${assistente.contexto}\n\nHISTÓRICO RECENTE:\n${historicoTexto || '(sem histórico)'}\n\nPEDIDO ATUAL DO USUÁRIO:\n${mensagemTexto || '(sem texto)'}\n\n${referenciaVisual ? `REFERÊNCIA VISUAL (descrição da imagem enviada):\n${referenciaVisual}\n\n` : ''}PROMPT DE IMAGEM:`
          }
        ], { temperature: 0.2, max_tokens: 500 });

        const promptDeImagem = promptResp.content;
        try {
          await UsageEvent.salvarChat(assistenteId, promptResp.model, promptResp.usage);
        } catch (e) {
          console.error('Erro ao salvar usage (image-prompt):', e);
        }

        const imagemGerada = await imageService.gerarImagem(promptDeImagem);
        try {
          await UsageEvent.salvarImagem(
            assistenteId,
            process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
            process.env.OPENAI_IMAGE_SIZE || '1024x1024',
            1
          );
        } catch (e) {
          console.error('Erro ao salvar usage (image):', e);
        }

        const userSave = imagens.length > 0
          ? `${mensagemTexto || ''}${mensagemTexto ? '\n\n' : ''}[Imagem anexada]`
          : mensagemTexto;
        await memoryService.salvarMensagem(assistenteId, 'usuario', userSave);
        const msgAssistente = await memoryService.salvarMensagem(assistenteId, 'assistente', 'Aqui está a imagem que você pediu.');

        await Attachment.salvar(
          msgAssistente.id,
          imagemGerada.type,
          imagemGerada.mimeType,
          imagemGerada.data,
          imagemGerada.fileName || null
        );

        return res.json({
          resposta: 'Aqui está a imagem que você pediu.',
          anexos: [imagemGerada],
          assistente: {
            id: assistente.id,
            titulo: assistente.titulo
          }
        });
      }

      // 3. Montar prompt completo
      const messages = promptService.montarPrompt(
        assistente.contexto,
        historico,
        mensagemTexto
      );

      // Se houver imagem, transforma a última mensagem do usuário em multi-part (texto + image_url)
      if (imagens.length > 0) {
        messages.pop();

        const contentParts = [];
        contentParts.push({
          type: 'text',
          text: mensagemTexto || 'Analise a imagem e descreva o que você vê. Em seguida, ajude o usuário com base nisso.'
        });

        for (const img of imagens) {
          const url = `data:${img.mimeType};base64,${img.data}`;
          contentParts.push({
            type: 'image_url',
            image_url: { url }
          });
        }

        messages.push({
          role: 'user',
          content: contentParts
        });
      }

      // 4. Enviar para o GPT
      const chatResp = await openaiService.chatDetailed(messages, {
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini'
      });
      const resposta = chatResp.content;
      try {
        await UsageEvent.salvarChat(assistenteId, chatResp.model, chatResp.usage);
      } catch (e) {
        console.error('Erro ao salvar usage (chat):', e);
      }

      // 5. Salvar mensagem do usuário
      const mensagemParaSalvar = imagens.length > 0
        ? `${mensagemTexto || ''}${mensagemTexto ? '\n\n' : ''}[Imagem anexada]`
        : mensagemTexto;
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
