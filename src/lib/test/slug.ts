import { randomBytes } from 'crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate a random 6-character lowercase alphanumeric slug.
 * Matches the DB check constraint: ^[a-z0-9]{6}$
 */
export function generateSlug(length = 6): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Generate a slug, retrying on collision via the provided check fn.
 */
export async function generateUniqueSlug(
  exists: (slug: string) => Promise<boolean>,
  maxAttempts = 8,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateSlug();
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error('Failed to generate unique slug after multiple attempts');
}
