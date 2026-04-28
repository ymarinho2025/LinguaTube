const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

const {
  caminhoArquivoTemp,
  tamanhoArquivoMB,
  apagarArquivoTemp
} = require('../utils/arquivo');

const config = require('../config/env');

function encontrarYtDlp() {
  const caminhosBase = [
    process.cwd(),
    path.resolve(__dirname, '../../'),
    path.resolve(__dirname, '../../../')
  ];

  const caminhos = [
    process.env.YT_DLP_PATH,
    ...caminhosBase.map(base => path.join(base, 'bin', 'yt-dlp')),
    '/app/bin/yt-dlp',
    '/root/.local/bin/yt-dlp',
    '/home/railway/.local/bin/yt-dlp'
  ].filter(Boolean);

  console.log('📂 cwd:', process.cwd());
  console.log('🔎 caminhos testados yt-dlp:', caminhos);

  const encontrado = caminhos.find(caminho => fs.existsSync(caminho));

  if (!encontrado) {
    throw new Error(
      'yt-dlp não encontrado. Verifique se o nixpacks.toml está dentro da pasta backend e se o Railway fez rebuild sem cache.'
    );
  }

  console.log('✅ yt-dlp usado:', encontrado);
  return encontrado;
}

const ytDlpPath = encontrarYtDlp();
const ytDlp = new YTDlpWrap(ytDlpPath);

async function baixarAudio(videoId, url) {
  const caminhoAudio = caminhoArquivoTemp(videoId, 'mp3');
  apagarArquivoTemp(caminhoAudio);

  console.log(`⬇️  Iniciando download do áudio: ${videoId}`);

  try {
    const args = [
      url,
      '-f', 'ba',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '9',
      '--output', caminhoAudio,
      '--no-playlist',
      '--no-warnings'
    ];

    if (ffmpegPath) {
      args.push('--ffmpeg-location', path.dirname(ffmpegPath));
    }

    await ytDlp.execPromise(args);

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

    console.log(`✅ Áudio baixado com sucesso: ${tamanho.toFixed(1)}MB`);
    return caminhoAudio;

  } catch (err) {
    apagarArquivoTemp(caminhoAudio);

    const mensagemOriginal = err.message || '';

    if (mensagemOriginal.includes('Private video')) {
      throw new Error('Este vídeo é privado e não pode ser acessado.');
    }

    if (mensagemOriginal.includes('Video unavailable')) {
      throw new Error('Este vídeo não está disponível.');
    }

    if (mensagemOriginal.toLowerCase().includes('ffmpeg')) {
      throw new Error('FFmpeg não encontrado ou inválido no ambiente.');
    }

    throw new Error(`Falha ao baixar áudio: ${mensagemOriginal}`);
  }
}

async function buscarInfoVideo(url) {
  try {
    const infoJson = await ytDlp.execPromise([
      url,
      '--dump-json',
      '--no-download',
      '--no-warnings'
    ]);

    const info = JSON.parse(infoJson);

    return {
      titulo: info.title || 'Sem título',
      duracaoSegundos: info.duration || 0,
      canal: info.uploader || info.channel || 'Desconhecido',
      thumbnail: info.thumbnail || null
    };

  } catch (err) {
    console.warn('⚠️  Não foi possível buscar info do vídeo:', err.message);
    return {
      titulo: 'Sem título',
      duracaoSegundos: 0,
      canal: 'Desconhecido',
      thumbnail: null
    };
  }
}

module.exports = { baixarAudio, buscarInfoVideo };