require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { pool, connectPostgres } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { createTables } = require('./migrations/001_criar_tabelas');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Rotas
app.use('/api', routes);

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lumos IA Backend rodando!' });
});

// Iniciar servidor e conexões
const startServer = async () => {
  console.log('🔄 Iniciando conexões...');
  
  await connectPostgres();
  await connectRedis();
  
  // Executar migrações
  await createTables(pool);
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
};

startServer();

module.exports = app;
