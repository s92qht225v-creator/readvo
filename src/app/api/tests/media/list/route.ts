import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';

const BUCKET = 'test-media';
const MAX_FOLDERS = 60;   // question subfolders scanned per request
const MAX_ITEMS = 80;     // items returned

type MediaItem = {
  url: string;
  name: string;
  kind: 'image' | 'audio' | 'video';
  createdAt: string | null;
};

function kindFromName(name: string, mimetype?: string): MediaItem['kind'] | null {
  const m = (mimetype || '').toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('audio/')) return 'audio';
  if (m.startsWith('video/')) return 'video';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm'].includes(ext)) return 'audio';
  if (['mp4', 'mov', 'ogv'].includes(ext)) return 'video';
  return null;
}

/**
 * GET /api/tests/media/list?kind=image
 *
 * Lists the current user's previously uploaded media (the "My gallery"
 * tab). Files live in `test-media` under `${userId}/${questionId}/…`,
 * so we list the user folder to find question subfolders, then list
 * each subfolder's files. Returns newest-first, capped, optionally
 * filtered by kind.
 */
export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const kindFilter = req.nextUrl.searchParams.get('kind');
  const admin = getSupabaseAdmin();

  const { data: top, error } = await admin.storage
    .from(BUCKET)
    .list(userId, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) {
    // Bucket missing / no uploads yet → empty gallery, not an error.
    return NextResponse.json({ items: [] });
  }

  const entries = top ?? [];
  const folders = entries.filter(e => e.id === null).slice(0, MAX_FOLDERS);
  const looseFiles = entries.filter(e => e.id !== null);

  /* Files directly under the user folder (rare), then one listing per
     question subfolder. */
  const collected: Array<{ path: string; name: string; created_at: string | null; mimetype?: string }> = [];
  for (const f of looseFiles) {
    collected.push({ path: `${userId}/${f.name}`, name: f.name, created_at: f.created_at ?? null, mimetype: (f.metadata as { mimetype?: string } | null)?.mimetype });
  }
  const folderListings = await Promise.all(folders.map(folder =>
    admin.storage.from(BUCKET).list(`${userId}/${folder.name}`, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
      .then(res => ({ folder: folder.name, files: res.data ?? [] })),
  ));
  for (const { folder, files } of folderListings) {
    for (const f of files) {
      if (!f.id) continue; // skip nested folders
      collected.push({ path: `${userId}/${folder}/${f.name}`, name: f.name, created_at: f.created_at ?? null, mimetype: (f.metadata as { mimetype?: string } | null)?.mimetype });
    }
  }

  collected.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));

  const items: MediaItem[] = [];
  for (const c of collected) {
    const kind = kindFromName(c.name, c.mimetype);
    if (!kind) continue;
    if (kindFilter && kind !== kindFilter) continue;
    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(c.path);
    items.push({ url: urlData.publicUrl, name: c.name, kind, createdAt: c.created_at });
    if (items.length >= MAX_ITEMS) break;
  }

  return NextResponse.json({ items });
}
