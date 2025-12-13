require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { connectRedis } = require('../config/redis');
const memoryService = require('../services/memoryService');

async function testar() {
  console.log('🔄 Conectando ao Redis...');
  await connectRedis();

  const assistenteId = 1; // Assistente de teste criado anteriormente

  console.log('\n📝 Testando salvar mensagens...');
  
  // Salvar mensagem do usuário
  const msg1 = await memoryService.salvarMensagem(assistenteId, 'usuario', 'Olá, teste de memória!');
  console.log('   ✅ Mensagem usuário salva:', msg1.id);

  // Salvar mensagem do assistente
  const msg2 = await memoryService.salvarMensagem(assistenteId, 'assistente', 'Olá! Teste recebido com sucesso.');
  console.log('   ✅ Mensagem assistente salva:', msg2.id);

  console.log('\n📖 Testando buscar histórico...');
  const historico = await memoryService.buscarHistorico(assistenteId);
  console.log(`   ✅ Histórico recuperado: ${historico.length} mensagens`);
  
  historico.forEach((msg, i) => {
    console.log(`   ${i + 1}. [${msg.papel}]: ${msg.conteudo.substring(0, 50)}...`);
  });

  console.log('\n✅ Teste de memória concluído!');
  process.exit(0);
}

testar().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
