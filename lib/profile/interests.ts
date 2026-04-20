import { supabase } from '../supabase';

export type Interest = {
  id: string;
  name: string;
};

export async function fetchAllInterests(): Promise<Interest[]> {
  const { data, error } = await supabase
    .from('interests')
    .select('id, name')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchUserInterestIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('profile_interests')
    .select('interest_id')
    .eq('profile_user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.interest_id);
}

export async function saveUserInterests(
  userId: string,
  selectedIds: string[],
  previousIds: string[],
): Promise<void> {
  const prev = new Set(previousIds);
  const next = new Set(selectedIds);
  const toAdd = selectedIds.filter((id) => !prev.has(id));
  const toRemove = previousIds.filter((id) => !next.has(id));

  if (toAdd.length > 0) {
    const { error } = await supabase.from('profile_interests').insert(
      toAdd.map((interest_id) => ({
        profile_user_id: userId,
        interest_id,
      })),
    );
    if (error) throw error;
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('profile_interests')
      .delete()
      .eq('profile_user_id', userId)
      .in('interest_id', toRemove);
    if (error) throw error;
  }
}
