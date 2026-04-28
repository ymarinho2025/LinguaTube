const { supabaseAdmin } = require('../config/supabase');
const { baixarAudio, buscarInfoVideo } = require('./audioService');
const { transcreverAudio } = require('./transcricaoService');
const { traduzirLegendas } = require('./traducaoService');
const { apagarArquivoTemp } = require('../utils/arquivo');
const { montarUrlYoutube } = require('../utils/youtube');

const memoria = new Map();

async function buscarCacheTranscricao(youtubeId) {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('videos').select('*').eq('youtube_id', youtubeId).maybeSingle();
    if (!error && data) return data;
  }
  return memoria.get(youtubeId) || null;
}

async function salvarTranscricao(dadosVideo) {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('videos').upsert(dadosVideo, { onConflict: 'youtube_id' }).select().single();
    if (error) throw new Error(`Erro ao salvar no Supabase: ${error.message}`);
    return data;
  }
  const registro = { id: `mem-${dadosVideo.youtube_id}`, created_at: new Date().toISOString(), ...dadosVideo };
  memoria.set(dadosVideo.youtube_id, registro);
  return registro;
}

async function processarVideo(youtubeId, url, idiomaOriginal = 'en', idiomaTraducao = 'pt') {
  const cache = await buscarCacheTranscricao(youtubeId);
  if (cache && cache.original_language === idiomaOriginal && cache.translation_language === idiomaTraducao) {
    return formatarResposta(cache);
  }

  let caminhoAudio = null;
  try {
    const infoVideo = await buscarInfoVideo(url);
    caminhoAudio = await baixarAudio(youtubeId, url);
    const { texto, segmentos } = await transcreverAudio(caminhoAudio, idiomaOriginal);

    if (!texto || segmentos.length === 0) {
      throw new Error('A transcrição retornou vazia. Verifique se o vídeo tem áudio claro.');
    }

    let segmentosTraduzidos = segmentos;
    if (idiomaOriginal !== idiomaTraducao) {
      segmentosTraduzidos = await traduzirLegendas(segmentos, idiomaOriginal, idiomaTraducao);
    }

    const dadosParaSalvar = {
      youtube_id: youtubeId,
      youtube_url: url || montarUrlYoutube(youtubeId),
      title: infoVideo.titulo,
      original_language: idiomaOriginal,
      translation_language: idiomaTraducao,
      transcript_text: texto,
      transcript_segments_json: segmentos,
      translated_segments_json: segmentosTraduzidos,
    };

    const videoSalvo = await salvarTranscricao(dadosParaSalvar);
    return formatarResposta(videoSalvo);
  } finally {
    if (caminhoAudio) apagarArquivoTemp(caminhoAudio);
  }
}

function formatarResposta(video) {
  return {
    videoId: video.youtube_id,
    titulo: video.title,
    url: video.youtube_url,
    idiomaOriginal: video.original_language,
    idiomaTraducao: video.translation_language,
    text: video.transcript_text,
    segments: video.transcript_segments_json || [],
    translatedSegments: video.translated_segments_json || [],
    dbId: video.id,
    criadoEm: video.created_at,
  };
}

async function buscarTranscricao(youtubeId) {
  const video = await buscarCacheTranscricao(youtubeId);
  return video ? formatarResposta(video) : null;
}

module.exports = { processarVideo, buscarTranscricao };
