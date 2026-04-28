// =============================================
// SERVIÇO: Transcrição de Áudio com Groq Whisper
// Envia o arquivo de áudio para o modelo
// Whisper da Groq e retorna o texto com timestamps
// =============================================
const fs = require('fs');
const groqClient = require('../config/groq');
const config = require('../config/env');

/**
 * Transcreve um arquivo de áudio usando Groq Whisper
 *
 * @param {string} caminhoAudio - caminho do arquivo MP3
 * @param {string} idioma - código do idioma do vídeo (ex: 'en', 'es', 'fr')
 * @returns {Promise<object>} - { texto, segmentos }
 */
async function transcreverAudio(caminhoAudio, idioma = 'en') {
  console.log(`🎙️  Iniciando transcrição com Whisper... (idioma: ${idioma})`);

  try {
    // Abre o arquivo de áudio como stream
    const arquivoAudio = fs.createReadStream(caminhoAudio);

    // Chama a API do Groq Whisper
    const transcricao = await groqClient.audio.transcriptions.create({
      file: arquivoAudio,
      model: config.groqModels.transcricao,  // whisper-large-v3-turbo
      language: idioma,                        // Idioma ajuda na precisão
      response_format: 'verbose_json',         // Retorna com timestamps por segmento
      timestamp_granularities: ['segment'],    // Granularidade dos timestamps
    });

    // Formata os segmentos no formato padrão da nossa API
    const segmentos = (transcricao.segments || []).map(seg => ({
      start: parseFloat(seg.start?.toFixed(2) || 0),
      end: parseFloat(seg.end?.toFixed(2) || 0),
      text: seg.text?.trim() || '',
    }));

    // Filtra segmentos vazios
    const segmentosFiltrados = segmentos.filter(s => s.text.length > 0);

    console.log(`✅ Transcrição concluída: ${segmentosFiltrados.length} segmentos`);

    return {
      texto: transcricao.text?.trim() || '',
      segmentos: segmentosFiltrados,
    };

  } catch (err) {
    const mensagem = err.message || '';

    if (mensagem.includes('413') || mensagem.includes('too large')) {
      throw new Error('Arquivo de áudio muito grande para o Groq (limite: 25MB). Tente um vídeo mais curto.');
    }
    if (mensagem.includes('401') || mensagem.includes('authentication')) {
      throw new Error('Chave da API Groq inválida. Verifique o GROQ_API_KEY no .env');
    }
    if (mensagem.includes('429') || mensagem.includes('rate limit')) {
      throw new Error('Limite de requisições da Groq atingido. Aguarde um momento e tente novamente.');
    }

    throw new Error(`Falha na transcrição: ${mensagem}`);
  }
}

module.exports = { transcreverAudio };
