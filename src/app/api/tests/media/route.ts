import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';

const MAX_IMAGE_FILE_SIZE = 4 * 1024 * 1024;
const MAX_AUDIO_FILE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024;
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
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
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
    return NextResponse.json({ error: 'Upload JPG, PNG, GIF, WebP, MP3, WAV, OGG, M4A, WebM, or MP4/MOV video.' }, { status: 400 });
  }
  const maxSize = file.type.startsWith('audio/')
    ? MAX_AUDIO_FILE_SIZE
    : file.type.startsWith('video/')
      ? MAX_VIDEO_FILE_SIZE
      : MAX_IMAGE_FILE_SIZE;
  if (file.size > maxSize) {
    const limit = file.type.startsWith('audio/')
      ? 'Audio file must be 20MB or less.'
      : file.type.startsWith('video/')
        ? 'Video file must be 50MB or less.'
        : 'Image file must be 4MB or less.';
    return NextResponse.json({ error: limit }, { status: 400 });
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

/** DELETE /api/tests/media — remove an uploaded file from the gallery.
 *  Body: { path }. The path MUST be under the caller's own
 *  `${userId}/` prefix, so a user can only delete their own media. */
export async function DELETE(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { path?: string } | null;
  const path = body?.path;
  if (!path || typeof path !== 'string') {
    return NextResponse.json({ error: 'path_required' }, { status: 400 });
  }
  /* Ownership gate: only files inside the user's own folder, and no
     path traversal. */
  if (!path.startsWith(`${userId}/`) || path.includes('..')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();

  /* In-use guard: refuse to delete media still referenced by any of the
     user's questions or welcome/end screens — otherwise those would
     show a broken 404 image. The public URL is embedded as a substring
     in the questions' `options` JSON and the tests' screen configs, so
     we stringify-scan the user's rows for it. */
  const { data: urlData } = admin.storage.from('test-media').getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  const { data: ownTests } = await admin
    .from('tests')
    .select('id, welcome_screen, end_screen')
    .eq('owner_id', userId);
  const testIds = (ownTests ?? []).map(t => t.id);

  let usageCount = 0;
  for (const t of ownTests ?? []) {
    if (JSON.stringify(t.welcome_screen ?? '').includes(publicUrl)) usageCount++;
    if (JSON.stringify(t.end_screen ?? '').includes(publicUrl)) usageCount++;
  }
  if (testIds.length > 0) {
    const { data: questions } = await admin
      .from('test_questions')
      .select('options')
      .in('test_id', testIds);
    for (const q of questions ?? []) {
      if (JSON.stringify(q.options ?? '').includes(publicUrl)) usageCount++;
    }
  }
  if (usageCount > 0) {
    return NextResponse.json({ error: 'in_use', count: usageCount }, { status: 409 });
  }

  const { error } = await admin.storage.from('test-media').remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
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
  if (file.type === 'video/mp4') return 'mp4';
  if (file.type === 'video/webm') return 'webm';
  if (file.type === 'video/quicktime') return 'mov';
  if (file.type === 'video/ogg') return 'ogv';
  return 'bin';
}
