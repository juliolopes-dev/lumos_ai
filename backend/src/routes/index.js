const express = require('express');
const router = express.Router();

// Importar rotas específicas
const assistantRoutes = require('./assistantRoutes');
const chatRoutes = require('./chatRoutes');
const usageRoutes = require('./usageRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const monitoramentoRoutes = require('./monitoramentoRoutes');

// Usar rotas
router.use('/assistentes', assistantRoutes);
router.use('/chat', chatRoutes);
router.use('/usage', usageRoutes);
router.use('/usuario', usuarioRoutes);
router.use('/monitoramento', monitoramentoRoutes);

// Rota de informação da API
router.get('/', (req, res) => {
  res.json({ message: 'API Lumos IA funcionando!' });
});

module.exports = router;
