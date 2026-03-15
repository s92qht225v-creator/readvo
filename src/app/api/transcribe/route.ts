import Groq from 'groq-sdk';

export async function POST(request: Request) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const formData = await request.formData();
    const audio = formData.get('audio');

    if (!audio || !(audio instanceof Blob)) {
      return Response.json({ error: 'No audio file' }, { status: 400 });
    }

    const transcription = await groq.audio.transcriptions.create({
      file: audio as File,
      model: 'whisper-large-v3-turbo',
      language: 'zh',
      response_format: 'text',
    });

    return Response.json({ text: (transcription as unknown as string).trim() });
  } catch (err) {
    console.error('Groq Whisper error:', err);
    return Response.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
