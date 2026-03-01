const { createClient } = require('@supabase/supabase-js');

let _client;

function getSupabase() {
  if (!_client) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    }
    _client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return _client;
}

module.exports = { getSupabase };
