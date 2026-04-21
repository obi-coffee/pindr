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

export type RoundListItem = {
  id: string;
  tee_time: string;
  seats_open: number;
  seats_total: number;
  format: RoundFormat;
  course_id: string;
  course_name: string;
  course_city: string | null;
  course_state: string | null;
  host_user_id: string;
  host_display_name: string | null;
  host_age: number | null;
  host_handicap: number | null;
  host_has_handicap: boolean;
  host_photo_url: string | null;
  distance_km: number | null;
};

export type ListOpenRoundsFilters = {
  courseId?: string | null;
  from?: Date;
  to?: Date | null;
  maxResults?: number;
};

export async function listOpenRounds(
  filters: ListOpenRoundsFilters = {},
): Promise<RoundListItem[]> {
  const { data, error } = await supabase.rpc('list_open_rounds', {
    p_course_id: filters.courseId ?? null,
    p_from: (filters.from ?? new Date()).toISOString(),
    p_to: filters.to ? filters.to.toISOString() : null,
    p_max_results: filters.maxResults ?? 50,
  });
  if (error) throw error;
  return (data ?? []) as RoundListItem[];
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

export type RoundRequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'withdrawn';

export type MyRoundRequest = {
  id: string;
  status: RoundRequestStatus;
  created_at: string;
  responded_at: string | null;
};

export type PendingRequest = {
  id: string;
  status: RoundRequestStatus;
  created_at: string;
  requesting_user_id: string;
  requester_display_name: string | null;
  requester_age: number | null;
  requester_handicap: number | null;
  requester_has_handicap: boolean;
  requester_photo_url: string | null;
};

export async function requestToJoinRound(
  round: Pick<Round, 'id' | 'source'>,
  userId: string,
): Promise<void> {
  switch (round.source) {
    case 'user_posted':
      await createUserPostedRequest(round.id, userId);
      return;
    case 'golfnow':
      throw new Error('partner-booked rounds will be available soon.');
  }
}

export async function createUserPostedRequest(
  roundId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from('round_requests').insert({
    round_id: roundId,
    requesting_user_id: userId,
  });
  if (error) throw error;
}

export async function withdrawRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('withdraw_round_request', {
    p_request_id: requestId,
  });
  if (error) throw error;
}

export async function respondToRequest(
  requestId: string,
  accept: boolean,
): Promise<void> {
  const { error } = await supabase.rpc('respond_to_round_request', {
    p_request_id: requestId,
    p_accept: accept,
  });
  if (error) throw error;
}

export async function getMyRequestForRound(
  roundId: string,
  userId: string,
): Promise<MyRoundRequest | null> {
  const { data, error } = await supabase
    .from('round_requests')
    .select('id, status, created_at, responded_at')
    .eq('round_id', roundId)
    .eq('requesting_user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as MyRoundRequest | null) ?? null;
}

export async function listRequestsForRound(
  roundId: string,
): Promise<PendingRequest[]> {
  const { data, error } = await supabase.rpc('list_round_requests', {
    p_round_id: roundId,
  });
  if (error) throw error;
  return (data ?? []) as PendingRequest[];
}
