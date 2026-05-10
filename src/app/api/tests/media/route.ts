import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';

const MAX_IMAGE_FILE_SIZE = 4 * 1024 * 1024;
const MAX_AUDIO_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
]);

export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const questionId = form?.get('questionId');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file_required' }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Upload JPG, PNG, GIF, WebP, MP3, WAV, OGG, M4A, or WebM.' }, { status: 400 });
  }
  const maxSize = file.type.startsWith('audio/') ? MAX_AUDIO_FILE_SIZE : MAX_IMAGE_FILE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json({ error: file.type.startsWith('audio/') ? 'Audio file must be 20MB or less.' : 'Image file must be 4MB or less.' }, { status: 400 });
  }

  const ext = extensionFor(file);
  const safeQuestionId = typeof questionId === 'string'
    ? questionId.replace(/[^a-z0-9-]/gi, '-')
    : 'question';
  const path = `${userId}/${safeQuestionId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from('test-media')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    return NextResponse.json(
      { error: error.message.includes('Bucket not found') ? 'Supabase bucket test-media does not exist.' : error.message },
      { status: 500 },
    );
  }

  const { data: urlData } = admin.storage.from('test-media').getPublicUrl(data.path);
  return NextResponse.json({ url: urlData.publicUrl });
}

function extensionFor(file: File) {
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/gif') return 'gif';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'audio/mpeg' || file.type === 'audio/mp3') return 'mp3';
  if (file.type === 'audio/wav' || file.type === 'audio/wave' || file.type === 'audio/x-wav') return 'wav';
  if (file.type === 'audio/mp4') return 'm4a';
  if (file.type === 'audio/aac') return 'aac';
  if (file.type === 'audio/ogg') return 'ogg';
  if (file.type === 'audio/webm') return 'webm';
  return 'bin';
}
