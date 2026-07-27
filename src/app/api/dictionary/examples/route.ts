import { NextRequest, NextResponse } from 'next/server';
import { findExamples } from '@/services/dictionaryExamples';

/**
 * Example sentences for one dictionary word, taken from the app's own dialogues.
 * Public (same as the dictionary search) and fetched lazily when a result row is
 * expanded, so the search response stays small.
 */
export async function GET(req: NextRequest) {
  const zh = (req.nextUrl.searchParams.get('zh') || '').trim();
  if (!zh || zh.length > 12) return NextResponse.json({ examples: [] });
  try {
    return NextResponse.json(
      { zh, examples: findExamples(zh, 3) },
      { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } },
    );
  } catch (e) {
    console.error('[dictionary] examples failed', e);
    return NextResponse.json({ examples: [] });
  }
}
