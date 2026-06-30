import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});
const words = process.argv[2].split(',');
let rows=[], from=0;
for(;;){ const {data,error}=await sb.from('glossary').select('zh').order('id').range(from,from+999); if(error){console.error(error);process.exit(1);} rows.push(...data); if(data.length<1000)break; from+=1000; }
const set=new Set(rows.map(r=>r.zh));
console.log('MISSING: '+words.filter(w=>!set.has(w)).join(','));
console.log('EXISTING: '+words.filter(w=>set.has(w)).join(','));
