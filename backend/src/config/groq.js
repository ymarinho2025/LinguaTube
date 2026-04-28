const Groq = require('groq-sdk');
const config = require('./env');

if (!config.groqApiKey) {
  console.warn('⚠️ GROQ_API_KEY não configurada. As rotas que usam IA retornarão erro amigável.');
}

const groqClient = new Groq({ apiKey: config.groqApiKey || 'missing-key' });
module.exports = groqClient;
