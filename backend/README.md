# LinguaTube Backend Ajustado

Backend em Node.js + Express para receber link do YouTube, baixar áudio, transcrever com Groq Whisper, traduzir legendas e explicar palavras clicadas.

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

Abra: `http://localhost:3000/api/health`

## Variáveis obrigatórias

No `.env`, preencha pelo menos:

```env
GROQ_API_KEY=sua_chave_groq_aqui
```

Supabase é opcional. Se você não preencher `SUPABASE_URL` e `SUPABASE_ANON_KEY`, o backend usa cache temporário em memória. Para cache permanente, execute `schema.sql` no Supabase e preencha as chaves.

## Rotas principais

### Processar vídeo

```http
POST /api/videos/processar
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "idiomaOriginal": "en",
  "idiomaTraducao": "pt"
}
```

### Buscar vídeo já processado

```http
GET /api/videos/VIDEO_ID
```

### Traduzir palavra clicada

```http
POST /api/palavras/traduzir
Content-Type: application/json

{
  "palavra": "welcome",
  "fraseContexto": "Welcome to this video",
  "idiomaOrigem": "en",
  "idiomaDestino": "pt"
}
```

## Observações

- É necessário ter `yt-dlp` funcional no ambiente. O pacote `yt-dlp-wrap` chama o binário do `yt-dlp`.
- No Windows, instale o `yt-dlp.exe` e deixe no PATH, ou configure conforme a documentação do yt-dlp-wrap.
- Vídeos privados, bloqueados, muito longos ou sem áudio podem falhar.
- O limite padrão de áudio é 25MB por causa do limite usual de upload/transcrição.
