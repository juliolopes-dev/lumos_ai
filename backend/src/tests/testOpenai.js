require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const openaiService = require('../services/openaiService');
const promptService = require('../services/promptService');

async function testar() {
  console.log('🔄 Testando integração com OpenAI...\n');

  const contexto = 'Você é um assistente especializado em vendas de produtos digitais.';
  const historico = [];
  const mensagem = 'Olá, como você pode me ajudar?';

  const messages = promptService.montarPrompt(contexto, historico, mensagem);
  
  console.log('📤 Prompt montado:');
  console.log(JSON.stringify(messages, null, 2));
  console.log('\n🔄 Enviando para OpenAI...\n');

  try {
    const resposta = await openaiService.chat(messages);
    console.log('✅ Resposta do GPT:');
    console.log(resposta);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testar();
