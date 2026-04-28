// =============================================
// UTILITÁRIO: Respostas JSON Padronizadas
// Todas as respostas da API seguem o mesmo
// formato, facilitando o uso no frontend
// =============================================

/**
 * Resposta de SUCESSO
 * @param {object} res - objeto response do Express
 * @param {any} dados - dados a retornar
 * @param {string} mensagem - mensagem descritiva
 * @param {number} statusCode - código HTTP (padrão: 200)
 */
function sucesso(res, dados, mensagem = 'Operação realizada com sucesso', statusCode = 200) {
  return res.status(statusCode).json({
    ok: true,
    mensagem,
    dados,
  });
}

/**
 * Resposta de ERRO
 * @param {object} res - objeto response do Express
 * @param {string} mensagem - mensagem de erro amigável
 * @param {number} statusCode - código HTTP (padrão: 400)
 * @param {any} detalhes - detalhes extras do erro (só em desenvolvimento)
 */
function erro(res, mensagem = 'Ocorreu um erro', statusCode = 400, detalhes = null) {
  const resposta = {
    ok: false,
    mensagem,
  };

  // Só inclui detalhes técnicos no ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'development' && detalhes) {
    resposta.detalhes = detalhes;
  }

  return res.status(statusCode).json(resposta);
}

/**
 * Resposta de NÃO ENCONTRADO
 */
function naoEncontrado(res, mensagem = 'Recurso não encontrado') {
  return erro(res, mensagem, 404);
}

/**
 * Resposta de ERRO INTERNO DO SERVIDOR
 */
function erroServidor(res, mensagem = 'Erro interno do servidor', detalhes = null) {
  return erro(res, mensagem, 500, detalhes);
}

module.exports = { sucesso, erro, naoEncontrado, erroServidor };
