// =============================================
// SERVIÇO: Tradução e Explicação com Groq LLM
// Usa o modelo LLaMA para traduzir palavras,
// legendas e gerar explicações detalhadas
// =============================================
const groqClient = require('../config/groq');
const config = require('../config/env');

/**
 * Chama o modelo de linguagem da Groq e retorna a resposta em texto
 * Função auxiliar usada pelas outras funções deste serviço
 *
 * @param {string} prompt - pergunta ou instrução para o modelo
 * @param {string} systemPrompt - contexto/papel do assistente
 * @returns {Promise<string>} - resposta em texto
 */
async function chamarLLM(prompt, systemPrompt = 'Você é um assistente especializado em idiomas.') {
  const resposta = await groqClient.chat.completions.create({
    model: config.groqModels.traducao,  // llama-3.3-70b-versatile
    max_tokens: 1000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3, // Baixa temperatura = respostas mais consistentes
  });

  return resposta.choices[0]?.message?.content?.trim() || '';
}

/**
 * Traduz e explica uma palavra clicada pelo usuário
 * Retorna todas as informações para exibir no painel de vocabulário
 *
 * @param {string} palavra - a palavra clicada
 * @param {string} fraseContexto - frase onde a palavra apareceu (do vídeo)
 * @param {string} idiomaOrigem - idioma da palavra (ex: 'en')
 * @param {string} idiomaDestino - idioma para traduzir (ex: 'pt')
 * @returns {Promise<object>} - informações completas da palavra
 */
async function traduzirPalavra(palavra, fraseContexto, idiomaOrigem = 'en', idiomaDestino = 'pt') {
  console.log(`🔍 Traduzindo palavra: "${palavra}"`);

  // Mapa de códigos de idioma para nomes
  const nomesIdiomas = {
    'pt': 'português', 'en': 'inglês', 'es': 'espanhol',
    'fr': 'francês', 'de': 'alemão', 'it': 'italiano',
    'ja': 'japonês', 'ko': 'coreano', 'zh': 'chinês',
  };

  const nomeOrigem = nomesIdiomas[idiomaOrigem] || idiomaOrigem;
  const nomeDestino = nomesIdiomas[idiomaDestino] || idiomaDestino;

  const prompt = `
Analise a palavra "${palavra}" em ${nomeOrigem}.
Contexto onde apareceu: "${fraseContexto}"

Retorne APENAS um JSON válido com esta estrutura (sem comentários, sem texto extra):
{
  "word": "${palavra}",
  "translation": "tradução para ${nomeDestino}",
  "meaning": "definição clara em ${nomeDestino}",
  "grammaticalClass": "classe gramatical em ${nomeDestino} (substantivo, verbo, adjetivo, etc)",
  "pronunciation": "transcrição fonética aproximada (ex: /wɜːrd/)",
  "example": "frase de exemplo em ${nomeOrigem}",
  "exampleTranslation": "tradução do exemplo em ${nomeDestino}",
  "contextExplanation": "explicação de como a palavra é usada neste contexto específico, em ${nomeDestino}"
}`;

  try {
    const respostaTexto = await chamarLLM(prompt);

    // Extrai o JSON da resposta (o modelo pode adicionar texto ao redor)
    const jsonMatch = respostaTexto.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Formato de resposta inválido do modelo');
    }

    const dados = JSON.parse(jsonMatch[0]);
    return dados;

  } catch (err) {
    // Se falhar, retorna dados mínimos para não quebrar o frontend
    console.error('Erro ao traduzir palavra:', err.message);
    return {
      word: palavra,
      translation: '(erro ao traduzir)',
      meaning: '(não foi possível obter a definição)',
      grammaticalClass: '(desconhecido)',
      pronunciation: '',
      example: '',
      exampleTranslation: '',
      contextExplanation: '(erro ao analisar contexto)',
    };
  }
}

/**
 * Traduz os segmentos de legenda para outro idioma
 *
 * @param {Array} segmentos - array de { start, end, text }
 * @param {string} idiomaOrigem - idioma original
 * @param {string} idiomaDestino - idioma de destino
 * @returns {Promise<Array>} - segmentos com texto traduzido
 */
async function traduzirLegendas(segmentos, idiomaOrigem = 'en', idiomaDestino = 'pt') {
  console.log(`🌐 Traduzindo ${segmentos.length} segmentos de ${idiomaOrigem} para ${idiomaDestino}`);

  // Agrupa todos os textos em um único prompt para economizar chamadas de API
  const textos = segmentos.map((seg, i) => `[${i}] ${seg.text}`).join('\n');

  const nomesIdiomas = {
    'pt': 'português', 'en': 'inglês', 'es': 'espanhol',
    'fr': 'francês', 'de': 'alemão', 'it': 'italiano',
  };

  const nomeOrigem = nomesIdiomas[idiomaOrigem] || idiomaOrigem;
  const nomeDestino = nomesIdiomas[idiomaDestino] || idiomaDestino;

  const prompt = `
Traduza cada linha abaixo do ${nomeOrigem} para ${nomeDestino}.
Mantenha o formato exato: [número] texto traduzido
Não adicione explicações, apenas as traduções.
Preserve o número entre colchetes.

${textos}`;

  try {
    const respostaTexto = await chamarLLM(prompt);
    const linhas = respostaTexto.split('\n').filter(l => l.trim());

    // Mapeia as traduções de volta para os segmentos
    const traducoes = {};
    linhas.forEach(linha => {
      const match = linha.match(/^\[(\d+)\]\s*(.*)/);
      if (match) {
        traducoes[parseInt(match[1])] = match[2].trim();
      }
    });

    // Cria os segmentos traduzidos
    return segmentos.map((seg, i) => ({
      ...seg,
      textOriginal: seg.text,
      text: traducoes[i] || seg.text, // Usa original se tradução falhar
    }));

  } catch (err) {
    console.error('Erro ao traduzir legendas:', err.message);
    // Retorna os segmentos originais sem tradução
    return segmentos.map(seg => ({ ...seg, textOriginal: seg.text }));
  }
}

module.exports = { traduzirPalavra, traduzirLegendas };
