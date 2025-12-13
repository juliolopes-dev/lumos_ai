const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// POST /api/chat/:assistenteId/enviar - Enviar mensagem
router.post('/:assistenteId/enviar', chatController.enviarMensagem);

// GET /api/chat/:assistenteId/historico - Buscar histórico
router.get('/:assistenteId/historico', chatController.buscarHistorico);

// DELETE /api/chat/:assistenteId/limpar - Limpar histórico
router.delete('/:assistenteId/limpar', chatController.limparHistorico);

module.exports = router;
