require('dotenv').config();

const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModels: {
    transcricao: process.env.GROQ_TRANSCRIBE_MODEL || 'whisper-large-v3-turbo',
    traducao: process.env.GROQ_TRANSLATE_MODEL || 'llama-3.3-70b-versatile',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  tempDir: process.env.TEMP_DIR || './temp',
  maxAudioSizeMB: Number(process.env.MAX_AUDIO_SIZE_MB || 25),
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000'],
};

function hasGroq() { return Boolean(config.groqApiKey); }
function hasSupabase() { return Boolean(config.supabase.url && config.supabase.anonKey); }

module.exports = { ...config, hasGroq, hasSupabase };
