const Usuario = require('../models/Usuario');

const usuarioController = {
  // GET /api/usuario
  async buscar(req, res) {
    try {
      const usuario = await Usuario.buscarPrimeiro();
      
      if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      res.json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        foto_url: usuario.foto_url,
        foto_base64: usuario.foto_base64,
        configuracoes: usuario.configuracoes,
        criado_em: usuario.criado_em,
        atualizado_em: usuario.atualizado_em
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ erro: 'Erro ao buscar usuário' });
    }
  },

  // PUT /api/usuario
  async atualizar(req, res) {
    try {
      const { nome, email, foto_url, foto_base64, configuracoes } = req.body;
      
      const usuario = await Usuario.buscarPrimeiro();
      if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      const atualizado = await Usuario.atualizar(usuario.id, {
        nome,
        email,
        foto_url,
        foto_base64,
        configuracoes
      });

      res.json({
        mensagem: 'Usuário atualizado com sucesso',
        usuario: {
          id: atualizado.id,
          nome: atualizado.nome,
          email: atualizado.email,
          foto_url: atualizado.foto_url,
          foto_base64: atualizado.foto_base64,
          configuracoes: atualizado.configuracoes
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
  },

  // PUT /api/usuario/foto
  async atualizarFoto(req, res) {
    try {
      const { foto_base64 } = req.body;
      
      if (!foto_base64) {
        return res.status(400).json({ erro: 'Foto é obrigatória' });
      }

      const usuario = await Usuario.buscarPrimeiro();
      if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      const atualizado = await Usuario.atualizarFoto(usuario.id, foto_base64);

      res.json({
        mensagem: 'Foto atualizada com sucesso',
        foto_base64: atualizado.foto_base64
      });
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      res.status(500).json({ erro: 'Erro ao atualizar foto' });
    }
  },

  // PUT /api/usuario/configuracoes
  async atualizarConfiguracoes(req, res) {
    try {
      const { configuracoes } = req.body;
      
      if (!configuracoes) {
        return res.status(400).json({ erro: 'Configurações são obrigatórias' });
      }

      const usuario = await Usuario.buscarPrimeiro();
      if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      const atualizado = await Usuario.atualizarConfiguracoes(usuario.id, configuracoes);

      res.json({
        mensagem: 'Configurações atualizadas com sucesso',
        configuracoes: atualizado.configuracoes
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).json({ erro: 'Erro ao atualizar configurações' });
    }
  }
};

module.exports = usuarioController;
