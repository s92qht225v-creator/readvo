import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from '../src/lib/supabase-server';
import { normPy, type VocabRef } from '../src/services/glossary';

const DIR = path.join(process.cwd(), 'content', 'dialogues');

async function main() {
  const { data: rows } = await getSupabaseAdmin().from('glossary').select('zh, py');
  const byZh = new Map<string, Set<string>>();
  for (const r of rows ?? []) {
    const s = byZh.get(r.zh) ?? new Set();
    s.add(normPy(r.py));
    byZh.set(r.zh, s);
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  for (const book of fs.readdirSync(DIR)) {
    const bookDir = path.join(DIR, book);
    if (!fs.statSync(bookDir).isDirectory()) continue;
    for (const file of fs.readdirSync(bookDir).filter((f) => f.endsWith('.json'))) {
      const full = path.join(bookDir, file);
      const d = JSON.parse(fs.readFileSync(full, 'utf-8'));
      const refs: VocabRef[] = d.vocab ?? [];
      const allText = JSON.stringify(d.sections ?? []);
      for (const ref of refs) {
        const zh = typeof ref === 'string' ? ref : ref.zh;
        const wantPy = typeof ref === 'string' ? undefined : ref.py;
        const readings = byZh.get(zh);
        if (!readings) { errors.push(`${book}/${file}: '${zh}' not in glossary`); continue; }
        if (readings.size > 1 && !wantPy) errors.push(`${book}/${file}: '${zh}' ambiguous — needs py`);
        if (wantPy && !readings.has(normPy(wantPy))) errors.push(`${book}/${file}: '${zh}' py '${wantPy}' not found`);
        if (!allText.includes(zh)) warnings.push(`${book}/${file}: '${zh}' not found in dialogue sentences`);
      }
    }
  }
  warnings.forEach((w) => console.warn('WARN ', w));
  if (errors.length) { errors.forEach((e) => console.error('ERROR', e)); process.exit(1); }
  console.log('glossary validation passed');
}
main();
