import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get the public URL for an image in Supabase Storage
 * @param bucket - The storage bucket name (e.g., 'images')
 * @param path - The file path within the bucket (e.g., 'lesson2/page1-dialogue.png')
 */
export function getImageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload an image to Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The destination path
 * @param file - The file to upload
 */
export async function uploadImage(
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    return { url: null, error: error.message };
  }

  return { url: getImageUrl(bucket, data.path), error: null };
}
