import { supabase } from '../supabase';

export type WalkingChoice = 'walk' | 'ride' | 'either';
export type MatchType = 'casual' | 'competitive' | 'either';

export type RoundFormat = {
  walking: WalkingChoice;
  match_type: MatchType;
};

export type RoundStatus = 'open' | 'full' | 'cancelled' | 'completed';

export type CourseSummary = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  lng: number;
  lat: number;
  distance_km: number | null;
};

export type Round = {
  id: string;
  host_user_id: string;
  course_id: string;
  tee_time: string;
  seats_total: number;
  seats_open: number;
  format: RoundFormat;
  notes: string | null;
  status: RoundStatus;
  source: 'user_posted' | 'golfnow';
  created_at: string;
};

export type RoundWithCourse = Round & {
  course: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
  };
};

export async function searchCourses(query: string): Promise<CourseSummary[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase.rpc('search_courses', {
    q,
    max_results: 20,
  });
  if (error) throw error;
  return (data ?? []) as CourseSummary[];
}

export type CreateRoundInput = {
  courseId: string;
  teeTime: Date;
  seatsTotal: number;
  format: RoundFormat;
  notes: string | null;
};

export async function createRound(
  hostUserId: string,
  input: CreateRoundInput,
): Promise<string> {
  const { data, error } = await supabase
    .from('rounds')
    .insert({
      host_user_id: hostUserId,
      course_id: input.courseId,
      tee_time: input.teeTime.toISOString(),
      seats_total: input.seatsTotal,
      seats_open: input.seatsTotal - 1,
      format: input.format,
      notes: input.notes,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export type UpdateRoundInput = {
  teeTime?: Date;
  seatsTotal?: number;
  format?: RoundFormat;
  notes?: string | null;
};

export async function updateRound(
  id: string,
  input: UpdateRoundInput,
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.teeTime) patch.tee_time = input.teeTime.toISOString();
  if (input.seatsTotal !== undefined) {
    patch.seats_total = input.seatsTotal;
    patch.seats_open = input.seatsTotal - 1;
  }
  if (input.format) patch.format = input.format;
  if (input.notes !== undefined) patch.notes = input.notes;
  const { error } = await supabase.from('rounds').update(patch).eq('id', id);
  if (error) throw error;
}

export async function cancelRound(id: string): Promise<void> {
  const { error } = await supabase
    .from('rounds')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteRound(id: string): Promise<void> {
  const { error } = await supabase.from('rounds').delete().eq('id', id);
  if (error) throw error;
}

export async function getRound(id: string): Promise<RoundWithCourse> {
  const { data, error } = await supabase
    .from('rounds')
    .select(
      'id, host_user_id, course_id, tee_time, seats_total, seats_open, format, notes, status, source, created_at, course:courses(id, name, city, state)',
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as RoundWithCourse;
}

export async function listMyRounds(
  hostUserId: string,
): Promise<RoundWithCourse[]> {
  const { data, error } = await supabase
    .from('rounds')
    .select(
      'id, host_user_id, course_id, tee_time, seats_total, seats_open, format, notes, status, source, created_at, course:courses(id, name, city, state)',
    )
    .eq('host_user_id', hostUserId)
    .order('tee_time', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as RoundWithCourse[];
}
