const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => {
  console.error('❌ Erro no Redis:', err.message);
});

redisClient.on('connect', () => {
  console.log('✅ Redis conectado com sucesso!');
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar Redis:', error.message);
    return false;
  }
};

module.exports = { redisClient, connectRedis };
