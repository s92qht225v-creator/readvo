import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  const apiKey = process.env.MIMO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 });
  }

  try {
    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mimo-v2-tts',
        messages: [{ role: 'assistant', content: `<style>语速缓慢，吐字清晰，适合语言学习者</style>${text}` }],
        audio: {
          format: 'wav',
          voice: 'default_zh',
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('MiMo TTS error:', response.status, err);
      return NextResponse.json({ error: 'TTS request failed' }, { status: response.status });
    }

    const data = await response.json();
    const audio = data.choices?.[0]?.message?.audio?.data;
    if (!audio) {
      return NextResponse.json({ error: 'No audio in response' }, { status: 502 });
    }

    return NextResponse.json({ audio });
  } catch (error) {
    console.error('TTS fetch error:', error);
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 });
  }
}
