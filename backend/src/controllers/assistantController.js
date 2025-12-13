const Assistant = require('../models/Assistant');

const assistantController = {
  // POST /api/assistentes
  async criar(req, res) {
    try {
      const { titulo, contexto } = req.body;

      if (!titulo || !contexto) {
        return res.status(400).json({ 
          erro: 'Título e contexto são obrigatórios' 
        });
      }

      const assistente = await Assistant.criar(titulo, contexto);
      res.status(201).json(assistente);
    } catch (error) {
      console.error('Erro ao criar assistente:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  },

  // GET /api/assistentes
  async listarTodos(req, res) {
    try {
      const assistentes = await Assistant.listarTodos();
      res.json(assistentes);
    } catch (error) {
      console.error('Erro ao listar assistentes:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  },

  // GET /api/assistentes/:id
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const assistente = await Assistant.buscarPorId(id);

      if (!assistente) {
        return res.status(404).json({ erro: 'Assistente não encontrado' });
      }

      res.json(assistente);
    } catch (error) {
      console.error('Erro ao buscar assistente:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  },

  // PUT /api/assistentes/:id
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { titulo, contexto } = req.body;

      if (!titulo || !contexto) {
        return res.status(400).json({ 
          erro: 'Título e contexto são obrigatórios' 
        });
      }

      const assistente = await Assistant.atualizar(id, titulo, contexto);

      if (!assistente) {
        return res.status(404).json({ erro: 'Assistente não encontrado' });
      }

      res.json(assistente);
    } catch (error) {
      console.error('Erro ao atualizar assistente:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  },

  // DELETE /api/assistentes/:id
  async excluir(req, res) {
    try {
      const { id } = req.params;
      const assistente = await Assistant.excluir(id);

      if (!assistente) {
        return res.status(404).json({ erro: 'Assistente não encontrado' });
      }

      res.json({ mensagem: 'Assistente excluído com sucesso', assistente });
    } catch (error) {
      console.error('Erro ao excluir assistente:', error);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  }
};

module.exports = assistantController;
