const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// GET /api/usuario - Buscar dados do usuário
router.get('/', usuarioController.buscar);

// PUT /api/usuario - Atualizar dados do usuário
router.put('/', usuarioController.atualizar);

// PUT /api/usuario/foto - Atualizar foto do usuário
router.put('/foto', usuarioController.atualizarFoto);

// PUT /api/usuario/configuracoes - Atualizar configurações
router.put('/configuracoes', usuarioController.atualizarConfiguracoes);

module.exports = router;
