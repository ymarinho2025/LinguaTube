-- =============================================
-- LINGUATUBE - SCHEMA DO BANCO DE DADOS
-- Execute este script no Supabase SQL Editor
-- (em: seu-projeto.supabase.co > SQL Editor)
-- =============================================

-- Habilita a extensão UUID para gerar IDs únicos automaticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABELA: users
-- Armazena os usuários da plataforma
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar usuário pelo email mais rápido
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─────────────────────────────────────────────
-- TABELA: videos
-- Armazena os vídeos processados e suas transcrições
-- Funciona como cache para não transcrever o mesmo vídeo duas vezes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  youtube_id                TEXT NOT NULL UNIQUE,   -- Ex: "dQw4w9WgXcQ"
  youtube_url               TEXT NOT NULL,           -- URL completa do YouTube
  title                     TEXT,                    -- Título do vídeo
  original_language         TEXT DEFAULT 'en',       -- Idioma original do vídeo
  translation_language      TEXT DEFAULT 'pt',       -- Idioma para tradução
  transcript_text           TEXT,                    -- Transcrição completa em texto
  transcript_segments_json  JSONB,                   -- Segmentos com timestamps [{start, end, text}]
  translated_segments_json  JSONB,                   -- Segmentos já traduzidos
  created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar vídeo pelo ID do YouTube
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id);

-- ─────────────────────────────────────────────
-- TABELA: vocabulary
-- Palavras que o usuário salvou para estudar
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocabulary (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id            UUID REFERENCES videos(id) ON DELETE SET NULL,
  word                TEXT NOT NULL,               -- A palavra clicada
  translation         TEXT,                        -- Tradução da palavra
  meaning             TEXT,                        -- Significado/definição
  grammatical_class   TEXT,                        -- Classe gramatical (noun, verb, etc.)
  pronunciation       TEXT,                        -- Pronúncia aproximada (ex: /wɜːrd/)
  example             TEXT,                        -- Frase de exemplo no idioma original
  example_translation TEXT,                        -- Tradução do exemplo
  context_sentence    TEXT,                        -- Frase onde a palavra apareceu no vídeo
  source_language     TEXT DEFAULT 'en',           -- Idioma da palavra
  target_language     TEXT DEFAULT 'pt',           -- Idioma da tradução
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para buscas mais rápidas
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_word ON vocabulary(word);

-- ─────────────────────────────────────────────
-- TABELA: study_history
-- Histórico de quais vídeos o usuário assistiu
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_history (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id         UUID REFERENCES videos(id) ON DELETE CASCADE,
  watched_seconds  INTEGER DEFAULT 0,  -- Quantos segundos o usuário assistiu
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar histórico de um usuário
CREATE INDEX IF NOT EXISTS idx_study_history_user_id ON study_history(user_id);
CREATE INDEX IF NOT EXISTS idx_study_history_created_at ON study_history(created_at DESC);

-- ─────────────────────────────────────────────
-- DADOS INICIAIS (SEED)
-- Cria um usuário de demonstração para testes
-- ─────────────────────────────────────────────
INSERT INTO users (name, email)
VALUES ('Usuário Demo', 'demo@linguatube.com')
ON CONFLICT (email) DO NOTHING;

-- ─────────────────────────────────────────────
-- COMENTÁRIOS SOBRE SEGURANÇA (RLS)
-- Se quiser usar autenticação do Supabase,
-- habilite Row Level Security nas tabelas:
--
-- ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE study_history ENABLE ROW LEVEL SECURITY;
--
-- E crie políticas para que cada usuário
-- só veja seus próprios dados.
-- ─────────────────────────────────────────────
