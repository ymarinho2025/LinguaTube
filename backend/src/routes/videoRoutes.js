const express = require('express');
const { processarVideo, buscarTranscricao } = require('../services/videoService');
const { traduzirPalavra } = require('../services/traducaoService');
const { extrairVideoId, montarUrlYoutube } = require('../utils/youtube');
const { sucesso, erro, naoEncontrado, erroServidor } = require('../utils/resposta');
const config = require('../config/env');

const router = express.Router();

router.get('/health', (req, res) => sucesso(res, {
  status: 'online',
  groqConfigurado: config.hasGroq(),
  supabaseConfigurado: config.hasSupabase(),
  timestamp: new Date().toISOString(),
}, 'Backend ativo'));

router.post('/videos/processar', async (req, res) => {
  try {
    if (!config.hasGroq()) return erro(res, 'Configure GROQ_API_KEY no arquivo .env para processar vídeos reais.', 500);
    const { url, idiomaOriginal = 'en', idiomaTraducao = 'pt' } = req.body || {};
    const youtubeId = extrairVideoId(url);
    if (!youtubeId) return erro(res, 'URL/ID do YouTube inválido.', 400);
    const dados = await processarVideo(youtubeId, montarUrlYoutube(youtubeId), idiomaOriginal, idiomaTraducao);
    return sucesso(res, dados, 'Vídeo processado com sucesso');
  } catch (e) { return erroServidor(res, e.message, e.stack); }
});

router.get('/videos/:youtubeId', async (req, res) => {
  try {
    const dados = await buscarTranscricao(req.params.youtubeId);
    if (!dados) return naoEncontrado(res, 'Transcrição não encontrada. Processe o vídeo primeiro.');
    return sucesso(res, dados, 'Transcrição encontrada');
  } catch (e) { return erroServidor(res, e.message, e.stack); }
});

router.post('/palavras/traduzir', async (req, res) => {
  try {
    if (!config.hasGroq()) return erro(res, 'Configure GROQ_API_KEY no arquivo .env para traduzir palavras com IA.', 500);
    const { palavra, fraseContexto = '', idiomaOrigem = 'en', idiomaDestino = 'pt' } = req.body || {};
    if (!palavra) return erro(res, 'Informe a palavra para tradução.', 400);
    const dados = await traduzirPalavra(palavra, fraseContexto, idiomaOrigem, idiomaDestino);
    return sucesso(res, dados, 'Palavra traduzida com sucesso');
  } catch (e) { return erroServidor(res, e.message, e.stack); }
});

module.exports = router;
