// QR payload helpers. Token scheme for v1 is `pindr://match/<uuid>`.
// V2 may move to rotating tokens (HMAC + timestamp) but the prefix
// stays so older codes still parse.

import { supabase } from '../supabase';

const PREFIX = 'pindr://match/';
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeMyQr(userId: string): string {
  return `${PREFIX}${userId}`;
}

// Returns the embedded UUID for a Pindr code, or null for any other
// payload (a wifi QR, a URL, a non-UUID string, etc.). The scan
// screen uses the null result to show the friendly "not a Pindr
// code" message rather than treating it as an error.
export function parseQrPayload(raw: string): string | null {
  if (!raw || !raw.startsWith(PREFIX)) return null;
  const id = raw.slice(PREFIX.length).trim();
  if (!UUID_RE.test(id)) return null;
  return id.toLowerCase();
}

export type QrMatchError = 'self_scan' | 'blocked' | 'unavailable' | 'unknown';

// Wraps the create_match_from_qr RPC. Returns the match id on success
// or a typed error string the confirm screen maps to copy.
export async function createMatchFromQr(input: {
  scannerId: string;
  scannedUserId: string;
}): Promise<{ matchId: string } | { error: QrMatchError }> {
  const { data, error } = await supabase.rpc('create_match_from_qr', {
    scanner_id: input.scannerId,
    scanned_user_id: input.scannedUserId,
  });
  if (error) {
    const message = error.message ?? '';
    if (message.includes('self_scan')) return { error: 'self_scan' };
    if (message.includes('blocked')) return { error: 'blocked' };
    if (message.includes('unavailable')) return { error: 'unavailable' };
    return { error: 'unknown' };
  }
  if (typeof data !== 'string') return { error: 'unknown' };
  return { matchId: data };
}
