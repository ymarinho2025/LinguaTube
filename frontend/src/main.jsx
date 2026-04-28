import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, Languages, Loader2, Play, Search, Server, Sparkles } from 'lucide-react';
import './style.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const LANGS = {
  en: 'Inglês',
  pt: 'Português',
  es: 'Espanhol',
  de: 'Alemão',
  ko: 'Coreano',
  ru: 'Russo'
};

function getVideoId(url) {
  try {
    const texto = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(texto)) return texto;
    const u = new URL(texto);
    if (u.hostname.includes('youtu.be')) return u.pathname.split('/').filter(Boolean)[0] || '';
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex(p => ['embed', 'shorts', 'live'].includes(p));
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch {}
  return '';
}

function limparPalavra(palavra) {
  return String(palavra || '').toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

function formatTime(segundos = 0) {
  const s = Math.max(0, Math.floor(Number(segundos) || 0));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function App() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('pt');
  const [videoData, setVideoData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState('Cole um link do YouTube e clique em processar.');
  const [loading, setLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);

  const segments = useMemo(() => {
    if (!videoData) return [];
    const original = videoData.segments || [];
    const translated = videoData.translatedSegments || [];
    return original.map((seg, index) => ({
      ...seg,
      translatedText: translated[index]?.text || translated[index]?.translatedText || seg.text,
      textOriginal: seg.text
    }));
  }, [videoData]);

  async function processVideo() {
    const id = getVideoId(url);
    if (!id) {
      setStatus('Link inválido. Cole uma URL válida do YouTube.');
      return;
    }

    setVideoId(id);
    setLoading(true);
    setSelected(null);
    setStatus('Processando vídeo: baixando áudio, transcrevendo e traduzindo...');

    try {
      const resp = await fetch(`${API_URL}/videos/processar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, idiomaOriginal: sourceLang, idiomaTraducao: targetLang })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.mensagem || 'Erro ao processar vídeo.');
      setVideoData(json.dados);
      setStatus('Vídeo processado com sucesso. Clique nas palavras da legenda para estudar.');
    } catch (err) {
      setStatus(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function checkBackend() {
    setStatus('Verificando backend...');
    try {
      const resp = await fetch(`${API_URL}/health`);
      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.mensagem || 'Backend não respondeu.');
      setStatus(`Backend online. Groq: ${json.dados.groqConfigurado ? 'configurado' : 'não configurado'}. Supabase: ${json.dados.supabaseConfigurado ? 'configurado' : 'não configurado'}.`);
    } catch (err) {
      setStatus(`Backend fora do ar ou URL errada: ${err.message}`);
    }
  }

  async function pickWord(word, sentence) {
    const palavra = limparPalavra(word);
    if (!palavra) return;
    setWordLoading(true);
    setSelected({ word: palavra, translation: 'carregando...', meaning: 'Consultando IA...' });

    try {
      const resp = await fetch(`${API_URL}/palavras/traduzir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ palavra, fraseContexto: sentence, idiomaOrigem: sourceLang, idiomaDestino: targetLang })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.mensagem || 'Erro ao traduzir palavra.');
      setSelected(json.dados);
    } catch (err) {
      setSelected({
        word: palavra,
        translation: 'não traduzido',
        meaning: err.message,
        grammaticalClass: '-',
        pronunciation: '',
        example: sentence,
        exampleTranslation: ''
      });
    } finally {
      setWordLoading(false);
    }
  }

  function saveWord() {
    if (!selected?.word) return;
    setNotes(prev => [selected, ...prev.filter(item => item.word !== selected.word)].slice(0, 20));
  }

  return (
    <main>
      <section className="hero">
        <div className="brand"><Languages size={22} /> LinguaTube</div>
        <h1>Aprenda idiomas com vídeos do YouTube</h1>
        <p>Cole um link, processe o áudio com o backend e estude com legenda original, tradução e palavras clicáveis.</p>

        <div className="searchbar">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Cole o link do YouTube aqui" />
          <button onClick={processVideo} disabled={loading}>{loading ? <Loader2 className="spin" size={18} /> : <Play size={18} />} Processar</button>
          <button className="secondary" onClick={checkBackend}><Server size={18} /> Testar API</button>
        </div>
        <div className="status">{status}</div>
      </section>

      <section className="grid">
        <div className="panel videoPanel">
          <h2><Play size={20} /> Vídeo</h2>
          {videoId ? (
            <iframe src={`https://www.youtube.com/embed/${videoId}`} title="YouTube video" allowFullScreen />
          ) : (
            <div className="empty">O player aparecerá aqui depois que você colar um link válido.</div>
          )}
          <div className="controls">
            <label>Idioma original
              <select value={sourceLang} onChange={e => setSourceLang(e.target.value)}>
                {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>Tradução
              <select value={targetLang} onChange={e => setTargetLang(e.target.value)}>
                {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          </div>
          {videoData?.titulo && <p className="title"><b>Título:</b> {videoData.titulo}</p>}
        </div>

        <div className="panel">
          <h2><BookOpen size={20} /> Legendas</h2>
          <div className="subtitles">
            {!segments.length && <div className="empty">Depois do processamento, as legendas aparecem aqui.</div>}
            {segments.map((line, index) => (
              <div className="line" key={`${line.start}-${index}`}>
                <b>{formatTime(line.start)}</b>
                <p>{line.textOriginal.split(/(\s+)/).map((part, i) => /\s+/.test(part) ? part : <button className="word" key={i} onClick={() => pickWord(part, line.textOriginal)}>{part}</button>)}</p>
                <small>{line.translatedText}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="panel card">
          <h2><Search size={20} /> Palavra</h2>
          {selected ? (
            <>
              <h3>{selected.word}</h3>
              <p><b>Tradução:</b> {selected.translation}</p>
              <p><b>Significado:</b> {selected.meaning}</p>
              <p><b>Classe:</b> {selected.grammaticalClass || '-'}</p>
              {selected.pronunciation && <p><b>Pronúncia:</b> {selected.pronunciation}</p>}
              {selected.example && <p><b>Exemplo:</b> {selected.example}</p>}
              {selected.exampleTranslation && <p><b>Tradução do exemplo:</b> {selected.exampleTranslation}</p>}
              <button onClick={saveWord} disabled={wordLoading}><Sparkles size={18} /> Salvar palavra</button>
            </>
          ) : <p>Clique em uma palavra da legenda para ver a explicação.</p>}

          <h2 className="mt"><Sparkles size={20} /> Vocabulário salvo</h2>
          {!notes.length && <p>Nenhuma palavra salva ainda.</p>}
          {notes.map((n, i) => <div className="saved" key={`${n.word}-${i}`}><b>{n.word}</b><span>{n.translation}</span></div>)}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
