const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const {
  caminhoArquivoTemp,
  tamanhoArquivoMB,
  apagarArquivoTemp
} = require('../utils/arquivo');

const config = require('../config/env');

const execFileAsync = promisify(execFile);

const PYTHONPATH = path.join(process.cwd(), 'vendor', 'python');

async function rodarYtDlp(args) {
  const { stdout, stderr } = await execFileAsync(
    'python',
    ['-m', 'yt_dlp', ...args],
    {
      env: {
        ...process.env,
        PYTHONPATH
      },
      maxBuffer: 1024 * 1024 * 20
    }
  );

  if (stderr) {
    console.warn(stderr);
  }

  return stdout;
}

async function baixarAudio(videoId, url) {
  const caminhoAudio = caminhoArquivoTemp(videoId, 'mp3');
  apagarArquivoTemp(caminhoAudio);

  console.log(`⬇️  Iniciando download do áudio: ${videoId}`);

  try {
    await rodarYtDlp([
      url,
      '-f', 'ba',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '9',
      '--output', caminhoAudio,
      '--no-playlist',
      '--no-warnings'
    ]);

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

    const mensagemOriginal = err.stderr || err.message || '';

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
    const infoJson = await rodarYtDlp([
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
    console.warn('⚠️  Não foi possível buscar info do vídeo:', err.stderr || err.message);
    return {
      titulo: 'Sem título',
      duracaoSegundos: 0,
      canal: 'Desconhecido',
      thumbnail: null
    };
  }
}

module.exports = { baixarAudio, buscarInfoVideo };