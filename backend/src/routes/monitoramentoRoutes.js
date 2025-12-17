const express = require('express');
const router = express.Router();
const monitoramentoController = require('../controllers/monitoramentoController');

// GET /api/monitoramento/estatisticas - Estatísticas gerais
router.get('/estatisticas', monitoramentoController.estatisticas);

// GET /api/monitoramento/por-hora - Chamadas por hora
router.get('/por-hora', monitoramentoController.porHora);

// GET /api/monitoramento/ultimas - Últimas chamadas
router.get('/ultimas', monitoramentoController.ultimas);

module.exports = router;
