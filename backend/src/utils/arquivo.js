// =============================================
// UTILITÁRIO: Gerenciamento de Arquivos Temporários
// Cuida de criar e apagar arquivos de áudio após uso
// =============================================
const fs = require('fs');
const path = require('path');
const config = require('../config/env');

/**
 * Garante que a pasta temporária existe
 * Se não existir, cria automaticamente
 */
function garantirPastaTemp() {
  if (!fs.existsSync(config.tempDir)) {
    fs.mkdirSync(config.tempDir, { recursive: true });
    console.log(`📁 Pasta temporária criada: ${config.tempDir}`);
  }
}

/**
 * Gera um caminho único para um arquivo temporário
 * @param {string} videoId - ID do vídeo (usado no nome do arquivo)
 * @param {string} extensao - extensão do arquivo (padrão: mp3)
 * @returns {string} - caminho completo do arquivo
 */
function caminhoArquivoTemp(videoId, extensao = 'mp3') {
  garantirPastaTemp();
  return path.join(config.tempDir, `${videoId}.${extensao}`);
}

/**
 * Apaga um arquivo temporário com segurança
 * Não lança erro se o arquivo não existir
 * @param {string} caminho - caminho do arquivo para apagar
 */
function apagarArquivoTemp(caminho) {
  try {
    if (fs.existsSync(caminho)) {
      fs.unlinkSync(caminho);
      console.log(`🗑️  Arquivo temporário apagado: ${path.basename(caminho)}`);
    }
  } catch (err) {
    // Só loga o aviso, não interrompe a execução
    console.warn(`⚠️  Não foi possível apagar: ${caminho}`, err.message);
  }
}

/**
 * Verifica o tamanho de um arquivo em MB
 * @param {string} caminho - caminho do arquivo
 * @returns {number} - tamanho em MB
 */
function tamanhoArquivoMB(caminho) {
  try {
    const stats = fs.statSync(caminho);
    return stats.size / (1024 * 1024);
  } catch {
    return 0;
  }
}

/**
 * Limpa todos os arquivos temporários antigos (mais de 1 hora)
 * Útil para manutenção automática
 */
function limparArquivosAntigos() {
  try {
    if (!fs.existsSync(config.tempDir)) return;

    const agora = Date.now();
    const umaHora = 60 * 60 * 1000;
    const arquivos = fs.readdirSync(config.tempDir);

    arquivos.forEach(arquivo => {
      const caminho = path.join(config.tempDir, arquivo);
      const stats = fs.statSync(caminho);
      if (agora - stats.mtimeMs > umaHora) {
        fs.unlinkSync(caminho);
        console.log(`🧹 Arquivo antigo removido: ${arquivo}`);
      }
    });
  } catch (err) {
    console.warn('⚠️  Erro ao limpar arquivos antigos:', err.message);
  }
}

module.exports = {
  garantirPastaTemp,
  caminhoArquivoTemp,
  apagarArquivoTemp,
  tamanhoArquivoMB,
  limparArquivosAntigos,
};
