// =============================================
// UTILITÁRIO: Funções para URLs do YouTube
// =============================================

/**
 * Extrai o ID do vídeo de uma URL do YouTube
 * Suporta os formatos mais comuns:
 * - https://www.youtube.com/watch?v=ID
 * - https://youtu.be/ID
 * - https://www.youtube.com/embed/ID
 * - https://youtube.com/shorts/ID
 *
 * @param {string} url - URL do YouTube
 * @returns {string|null} - ID do vídeo ou null se inválido
 */
function extrairVideoId(url) {
  if (!url || typeof url !== 'string') return null;

  // Remove espaços extras
  url = url.trim();

  // Padrões de URL do YouTube
  const padroes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Só o ID direto
  ];

  for (const padrao of padroes) {
    const match = url.match(padrao);
    if (match) return match[1];
  }

  return null;
}

/**
 * Verifica se uma URL do YouTube é válida
 * @param {string} url - URL para validar
 * @returns {boolean}
 */
function validarUrlYoutube(url) {
  return extrairVideoId(url) !== null;
}

/**
 * Monta a URL padrão do YouTube a partir do ID
 * @param {string} videoId - ID do vídeo
 * @returns {string}
 */
function montarUrlYoutube(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

module.exports = { extrairVideoId, validarUrlYoutube, montarUrlYoutube };
