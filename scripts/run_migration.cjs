const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');

const url = 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzOTM4NywiZXhwIjoyMDgwMDE1Mzg3fQ.WZwib9oB_xAG8NUEK5DbQMopGcVcKwLsXHnblmXUgvc';
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const filePath = process.argv[2];
if (!filePath) { console.error('Pass SQL file path'); process.exit(1); }

const sql = readFileSync(filePath, 'utf8');
console.log(`Running: ${filePath} (${sql.length} chars)`);

async function run() {
  let { error } = await supabase.rpc('exec_sql', { sql });
  if (error && error.message && error.message.includes('does not exist')) {
    console.log('Creating exec_sql function...');
    const { error: ce } = await supabase.rpc('exec_sql', {
      sql: `CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$ BEGIN EXECUTE sql; END; $$ LANGUAGE plpgsql SECURITY DEFINER;`
    });
    if (ce) {
      console.error('Cannot create exec_sql, trying direct...');
      const resp = await fetch(url + '/rest/v1/rpc/exec_sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key, 'apikey': key },
        body: JSON.stringify({ sql })
      });
      const t = await resp.text();
      console.log(resp.ok ? 'OK' : 'FAIL', t.substring(0, 500));
      process.exit(resp.ok ? 0 : 1);
    }
    const { error: re } = await supabase.rpc('exec_sql', { sql });
    if (re) { console.error('Failed:', re); process.exit(1); }
    else { console.log('OK'); }
  } else if (error) {
    console.error('Error:', error);
    process.exit(1);
  } else {
    console.log('OK');
  }
}
run().catch(e => { console.error(e); process.exit(1); });
