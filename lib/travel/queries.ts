import { supabase } from '../supabase';

export type TravelSession = {
  id: string;
  user_id: string;
  city: string;
  start_date: string; // ISO date YYYY-MM-DD
  end_date: string;
  created_at: string;
  updated_at: string;
};

export async function fetchActiveOrUpcomingSession(
  userId: string,
): Promise<TravelSession | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('travel_sessions')
    .select('id, user_id, city, start_date, end_date, created_at, updated_at')
    .eq('user_id', userId)
    .gte('end_date', today)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as TravelSession) ?? null;
}

type SaveInput = {
  existingId: string | null;
  userId: string;
  city: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
};

export async function saveTravelSession({
  existingId,
  userId,
  city,
  latitude,
  longitude,
  startDate,
  endDate,
}: SaveInput): Promise<void> {
  const point = `POINT(${longitude} ${latitude})`;
  if (existingId) {
    const { error } = await supabase
      .from('travel_sessions')
      .update({
        city,
        location: point,
        start_date: startDate,
        end_date: endDate,
      })
      .eq('id', existingId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('travel_sessions').insert({
    user_id: userId,
    city,
    location: point,
    start_date: startDate,
    end_date: endDate,
  });
  if (error) throw error;
}

export async function deleteTravelSession(id: string): Promise<void> {
  const { error } = await supabase.from('travel_sessions').delete().eq('id', id);
  if (error) throw error;
}
