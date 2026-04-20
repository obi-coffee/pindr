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
}
