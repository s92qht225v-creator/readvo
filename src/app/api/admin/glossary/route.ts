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
  let query = getSupabaseAdmin().from('glossary').select('*').order('zh');
  if (q) query = query.or(`zh.ilike.%${q}%,py.ilike.%${q}%,uz.ilike.%${q}%,ru.ilike.%${q}%,en.ilike.%${q}%`);
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
  // Store py in NFC; py_norm is a generated column (never set it here).
  const row = { zh: b.zh.trim(), py: b.py.normalize('NFC').trim(), uz: b.uz, ru: b.ru, en: b.en,
                hsk: b.hsk ? Number(b.hsk) : null, updated_at: new Date().toISOString() };
  const admin = getSupabaseAdmin();
  const { error } = b.id
    ? await admin.from('glossary').update(row).eq('id', b.id)
    : await admin.from('glossary').insert(row);
  if (error) {
    const msg = error.code === '23505' ? 'A word with this 汉字 + pinyin already exists' : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  revalidateTag('glossary', 'max');
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { error } = await getSupabaseAdmin().from('glossary').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidateTag('glossary', 'max');
  return NextResponse.json({ ok: true });
}
