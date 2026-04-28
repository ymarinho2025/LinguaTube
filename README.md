# LinguaTube Completo

Este pacote contém:

- `backend/`: API Node.js + Express para processar vídeo, transcrever com Groq e traduzir.
- `frontend/`: interface React + Vite para colar link, ver vídeo, legendas e palavras clicáveis.

## 1. Rodar o backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

No Windows, se `cp` não funcionar, copie manualmente o arquivo `.env.example` e renomeie para `.env`.

Depois, edite o `.env` e coloque:

```env
GROQ_API_KEY=sua_chave_groq_aqui
```

Teste no navegador:

```text
http://localhost:3000/api/health
```

## 2. Rodar o frontend

Abra outro terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Abra no navegador:

```text
http://localhost:5173
```

## 3. Observações importantes

- O backend precisa estar rodando antes de processar vídeos reais.
- Para transcrição real, o `.env` do backend precisa ter `GROQ_API_KEY`.
- O Supabase é opcional. Sem Supabase, o cache fica temporário em memória.
- Para baixar áudio do YouTube, o ambiente precisa conseguir executar `yt-dlp`.
- Vídeos privados, bloqueados, sem áudio ou muito grandes podem falhar.
