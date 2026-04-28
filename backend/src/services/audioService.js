const ytdl = require('@distube/ytdl-core');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const {
  caminhoArquivoTemp,
  tamanhoArquivoMB,
  apagarArquivoTemp
} = require('../utils/arquivo');

const config = require('../config/env');

function converterStreamParaMp3(stream, caminhoSaida) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      return reject(new Error('ffmpeg-static não encontrado.'));
    }

    const ffmpeg = spawn(ffmpegPath, [
      '-y',
      '-i', 'pipe:0',
      '-vn',
      '-acodec', 'libmp3lame',
      '-ar', '44100',
      '-ac', '2',
      '-b:a', '96k',
      caminhoSaida
    ]);

    stream.pipe(ffmpeg.stdin);

    let erro = '';

    ffmpeg.stderr.on('data', data => {
      erro += data.toString();
    });

    ffmpeg.on('error', reject);

    ffmpeg.on('close', code => {
      if (code === 0) return resolve();
      reject(new Error(erro || `FFmpeg finalizou com código ${code}`));
    });
  });
}

async function baixarAudio(videoId, url) {
  const caminhoAudio = caminhoArquivoTemp(videoId, 'mp3');
  apagarArquivoTemp(caminhoAudio);

  console.log(`⬇️ Iniciando download do áudio via Node stream: ${videoId}`);

  try {
    if (!ytdl.validateURL(url)) {
      throw new Error('URL do YouTube inválida.');
    }

    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly',
      highWaterMark: 1 << 25
    });

    await converterStreamParaMp3(stream, caminhoAudio);

    const tamanho = tamanhoArquivoMB(caminhoAudio);

    if (tamanho === 0) {
      throw new Error('O arquivo de áudio foi criado, mas está vazio.');
    }

    if (tamanho > config.maxAudioSizeMB) {
      apagarArquivoTemp(caminhoAudio);
      throw new Error(
        `Arquivo de áudio muito grande: ${tamanho.toFixed(1)}MB (limite: ${config.maxAudioSizeMB}MB)`
      );
    }

    console.log(`✅ Áudio baixado e convertido com sucesso: ${tamanho.toFixed(1)}MB`);
    return caminhoAudio;
  } catch (err) {
    apagarArquivoTemp(caminhoAudio);
    throw new Error(`Falha ao baixar áudio: ${err.message}`);
  }
}

async function buscarInfoVideo(url) {
  try {
    if (!ytdl.validateURL(url)) {
      throw new Error('URL do YouTube inválida.');
    }

    const info = await ytdl.getInfo(url);
    const detalhes = info.videoDetails || {};

    return {
      titulo: detalhes.title || 'Sem título',
      duracaoSegundos: Number(detalhes.lengthSeconds || 0),
      canal: detalhes.author?.name || detalhes.ownerChannelName || 'Desconhecido',
      thumbnail: detalhes.thumbnails?.at(-1)?.url || null
    };
  } catch (err) {
    console.warn('⚠️ Não foi possível buscar info do vídeo:', err.message);
    return {
      titulo: 'Sem título',
      duracaoSegundos: 0,
      canal: 'Desconhecido',
      thumbnail: null
    };
  }
}

module.exports = { baixarAudio, buscarInfoVideo };