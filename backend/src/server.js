const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const videoRoutes = require('./routes/videoRoutes');
const { erro, naoEncontrado } = require('./utils/resposta');
const { limparArquivosAntigos } = require('./utils/arquivo');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => res.json({ ok: true, mensagem: 'LinguaTube Backend online', docs: '/api/health' }));
app.use('/api', videoRoutes);

app.use((req, res) => naoEncontrado(res, 'Rota não encontrada'));
app.use((err, req, res, next) => erro(res, err.message || 'Erro interno', 500));

limparArquivosAntigos();
setInterval(limparArquivosAntigos, 60 * 60 * 1000).unref();

app.listen(config.port, () => {
  console.log(`✅ LinguaTube Backend rodando em http://localhost:${config.port}`);
  console.log(`🔎 Health check: http://localhost:${config.port}/api/health`);
});
