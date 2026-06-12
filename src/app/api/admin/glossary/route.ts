import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function ok(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  return !!process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  // Strip PostgREST filter metacharacters so user input can't break out of the ilike.
  const safe = q.replace(/[,()*:."'\\%_]/g, ' ').trim();
  let query = getSupabaseAdmin().from('glossary').select('*').order('zh');
  if (safe) query = query.or(`zh.ilike.%${safe}%,py.ilike.%${safe}%,uz.ilike.%${safe}%,ru.ilike.%${safe}%,en.ilike.%${safe}%`);
  const { data, error } = await query.limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ words: data });
}

export async function POST(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  for (const k of ['zh', 'py', 'uz', 'ru', 'en'] as const) {
    if (!b[k] || !String(b[k]).trim()) return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });
  }
  let hsk: number | null = null;
  if (b.hsk !== undefined && b.hsk !== null && String(b.hsk).trim() !== '') {
    const n = Number(b.hsk);
    if (!Number.isInteger(n) || n < 1 || n > 6) return NextResponse.json({ error: 'hsk must be an integer 1–6' }, { status: 400 });
    hsk = n;
  }
  // Store py in NFC; py_norm is a generated column (never set it here).
  const row = { zh: b.zh.trim(), py: b.py.normalize('NFC').trim(), uz: b.uz.trim(), ru: b.ru.trim(), en: b.en.trim(),
                hsk, updated_at: new Date().toISOString() };
  const admin = getSupabaseAdmin();
  const { error } = b.id
    ? await admin.from('glossary').update(row).eq('id', b.id)
    : await admin.from('glossary').insert(row);
  if (error) {
    const msg = error.code === '23505' ? 'A word with this 汉字 + pinyin already exists' : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  try { revalidateTag('glossary', 'max'); } catch (e) { console.error('[glossary] revalidate failed', e); }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { error } = await getSupabaseAdmin().from('glossary').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  try { revalidateTag('glossary', 'max'); } catch (e) { console.error('[glossary] revalidate failed', e); }
  return NextResponse.json({ ok: true });
}
