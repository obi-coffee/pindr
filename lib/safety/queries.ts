import { supabase } from '../supabase';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'fake_profile'
  | 'safety'
  | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'other', label: 'Something else' },
];

export async function submitReport(
  reporterId: string,
  reportedId: string,
  reason: ReportReason,
  details: string | null,
): Promise<void> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    reason,
    details: details && details.trim() ? details.trim() : null,
  });
  if (error) throw error;
  // Reporting implies blocking: hide the reported user from discovery
  // both ways. Idempotent — safe if the reporter already blocked them.
  await supabase
    .from('blocks')
    .upsert(
      { blocker_id: reporterId, blocked_id: reportedId },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true },
    );
}

export type BlockedProfile = {
  blocked_id: string;
  created_at: string;
  display_name: string | null;
  photo_url: string | null;
};

export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const { error } = await supabase.from('blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  if (error) throw error;
}

export async function unblockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  if (error) throw error;
}

export async function fetchBlockedProfiles(
  blockerId: string,
): Promise<BlockedProfile[]> {
  const { data: blocks, error: blocksError } = await supabase
    .from('blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', blockerId)
    .order('created_at', { ascending: false });
  if (blocksError) throw blocksError;
  if (!blocks || blocks.length === 0) return [];

  const ids = blocks.map((b) => b.blocked_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name, photo_urls')
    .in('user_id', ids);
  if (profilesError) throw profilesError;

  const byId = new Map(
    (profiles ?? []).map((p) => [p.user_id as string, p]),
  );
  return blocks.map((b) => {
    const profile = byId.get(b.blocked_id);
    return {
      blocked_id: b.blocked_id,
      created_at: b.created_at,
      display_name: profile?.display_name ?? null,
      photo_url: profile?.photo_urls?.[0] ?? null,
    };
  });
}
