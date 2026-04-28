// =============================================
// SERVIÇO: Download de Áudio do YouTube
// Usa yt-dlp (via yt-dlp-wrap) para baixar
// o áudio do vídeo do YouTube
// =============================================

const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;

const YTDlpWrap = require("yt-dlp-wrap").default;
const {
  caminhoArquivoTemp,
  tamanhoArquivoMB,
  apagarArquivoTemp,
} = require("../utils/arquivo");
const config = require("../config/env");

// Cria o cliente do yt-dlp
const ytDlp = new YTDlpWrap();

/**
 * Baixa o áudio de um vídeo do YouTube
 *
 * @param {string} videoId - ID do vídeo do YouTube
 * @param {string} url - URL completa do vídeo
 * @returns {Promise<string>} - caminho do arquivo de áudio baixado
 * @throws {Error} - se o vídeo for privado, sem áudio, ou muito grande
 */
async function baixarAudio(videoId, url) {
  // Caminho onde vamos salvar o áudio temporariamente
  const caminhoAudio = caminhoArquivoTemp(videoId, "mp3");

  // Se já temos o arquivo (de uma tentativa anterior), apaga e refaz
  apagarArquivoTemp(caminhoAudio);

  console.log(`⬇️  Iniciando download do áudio: ${videoId}`);

  try {
    // Opções do yt-dlp para baixar apenas o áudio
    await ytDlp.execPromise([
      url,
      "-f",
      "ba",
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "9",
      "--ffmpeg-location",
      require("path").dirname(ffmpegPath),
      "--output",
      caminhoAudio,
      "--no-playlist",
      "--no-warnings",
    ]);

    // Verifica se o arquivo foi criado
    const tamanho = tamanhoArquivoMB(caminhoAudio);
    if (tamanho === 0) {
      throw new Error("O arquivo de áudio foi criado mas está vazio");
    }

    // Verifica se não excedeu o limite
    if (tamanho > config.maxAudioSizeMB) {
      apagarArquivoTemp(caminhoAudio);
      throw new Error(
        `Arquivo de áudio muito grande: ${tamanho.toFixed(1)}MB (limite: ${config.maxAudioSizeMB}MB)`,
      );
    }

    console.log(`✅ Áudio baixado com sucesso: ${tamanho.toFixed(1)}MB`);
    return caminhoAudio;
  } catch (err) {
    // Apaga arquivo incompleto se houver
    apagarArquivoTemp(caminhoAudio);

    // Traduz erros comuns para mensagens amigáveis
    const mensagemOriginal = err.message || "";

    if (mensagemOriginal.includes("Private video")) {
      throw new Error("Este vídeo é privado e não pode ser acessado");
    }
    if (mensagemOriginal.includes("Video unavailable")) {
      throw new Error(
        "Este vídeo não está disponível (pode ter sido removido)",
      );
    }
    if (mensagemOriginal.includes("no video formats")) {
      throw new Error(
        "Não foi possível encontrar formatos de áudio para este vídeo",
      );
    }
    if (mensagemOriginal.includes("max-filesize")) {
      throw new Error(
        `Vídeo muito longo. O áudio excede o limite de ${config.maxAudioSizeMB}MB`,
      );
    }

    throw new Error(`Falha ao baixar áudio: ${mensagemOriginal}`);
  }
}

/**
 * Busca informações básicas do vídeo sem baixar o áudio
 * @param {string} url - URL do vídeo
 * @returns {Promise<object>} - título, duração e outras info
 */
async function buscarInfoVideo(url) {
  try {
    const infoJson = await ytDlp.execPromise([
      url,
      "-f",
      "ba",
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "9",
      "--output",
      caminhoAudio,
      "--no-playlist",
      "--no-warnings",
    ]);

    const info = JSON.parse(infoJson);
    return {
      titulo: info.title || "Sem título",
      duracaoSegundos: info.duration || 0,
      canal: info.uploader || info.channel || "Desconhecido",
      thumbnail: info.thumbnail || null,
    };
  } catch (err) {
    // Retorna info mínima se falhar (não é crítico)
    console.warn("⚠️  Não foi possível buscar info do vídeo:", err.message);
    return {
      titulo: "Sem título",
      duracaoSegundos: 0,
      canal: "Desconhecido",
      thumbnail: null,
    };
  }
}

module.exports = { baixarAudio, buscarInfoVideo };
