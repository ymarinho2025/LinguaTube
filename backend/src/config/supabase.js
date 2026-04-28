const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

let supabase = null;
let supabaseAdmin = null;

if (config.hasSupabase()) {
  supabase = createClient(config.supabase.url, config.supabase.anonKey);
  supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceKey || config.supabase.anonKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
} else {
  console.warn('⚠️ Supabase não configurado. O backend usará cache temporário em memória.');
}

module.exports = { supabase, supabaseAdmin };
