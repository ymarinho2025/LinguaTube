const ytdlp = require('youtube-dl-exec');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

const {
  caminhoArquivoTemp,
  tamanhoArquivoMB,
  apagarArquivoTemp
} = require('../utils/arquivo');

const config = require('../config/env');

async function baixarAudio(videoId, url) {
  const caminhoAudio = caminhoArquivoTemp(videoId, 'mp3');
  apagarArquivoTemp(caminhoAudio);

  console.log(`⬇️ Iniciando download do áudio: ${videoId}`);

  try {
    await ytdlp(url, {
      format: 'ba',
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 9,
      output: caminhoAudio,
      noPlaylist: true,
      noWarnings: true,
      ffmpegLocation: ffmpegPath ? path.dirname(ffmpegPath) : undefined
    });

    const tamanho = tamanhoArquivoMB(caminhoAudio);

    if (tamanho === 0) {
      throw new Error('O arquivo de áudio foi criado, mas está vazio.');
    }

    if (tamanho > config.maxAudioSizeMB) {
      apagarArquivoTemp(caminhoAudio);
      throw new Error(`Arquivo de áudio muito grande: ${tamanho.toFixed(1)}MB`);
    }

    console.log(`✅ Áudio baixado: ${tamanho.toFixed(1)}MB`);
    return caminhoAudio;

  } catch (err) {
    apagarArquivoTemp(caminhoAudio);
    throw new Error(`Falha ao baixar áudio: ${err.stderr || err.message}`);
  }
}

async function buscarInfoVideo(url) {
  try {
    const info = await ytdlp(url, {
      dumpJson: true,
      noDownload: true,
      noWarnings: true
    });

    return {
      titulo: info.title || 'Sem título',
      duracaoSegundos: info.duration || 0,
      canal: info.uploader || info.channel || 'Desconhecido',
      thumbnail: info.thumbnail || null
    };
  } catch (err) {
    console.warn('⚠️ Não foi possível buscar info:', err.stderr || err.message);
    return {
      titulo: 'Sem título',
      duracaoSegundos: 0,
      canal: 'Desconhecido',
      thumbnail: null
    };
  }
}

module.exports = { baixarAudio, buscarInfoVideo };