import { supabase } from '../supabase';

export type RoundPlanStatus = 'proposed' | 'accepted' | 'declined' | 'cancelled';

export type RoundPlan = {
  id: string;
  match_id: string;
  proposer_id: string;
  course_id: string;
  tee_time: string;
  note: string | null;
  status: RoundPlanStatus;
  round_id: string | null;
  created_at: string;
  responded_at: string | null;
};

export type PlanWithCourse = RoundPlan & {
  course: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
  };
};

const PLAN_SELECT =
  'id, match_id, proposer_id, course_id, tee_time, note, status, round_id, created_at, responded_at, course:courses(id, name, city, state)';

export async function listPlans(matchId: string): Promise<PlanWithCourse[]> {
  const { data, error } = await supabase
    .from('round_plans')
    .select(PLAN_SELECT)
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as PlanWithCourse[];
}

export type ProposePlanInput = {
  matchId: string;
  proposerId: string;
  courseId: string;
  teeTime: Date;
  note: string | null;
};

export async function proposePlan(
  input: ProposePlanInput,
): Promise<PlanWithCourse> {
  const { data, error } = await supabase
    .from('round_plans')
    .insert({
      match_id: input.matchId,
      proposer_id: input.proposerId,
      course_id: input.courseId,
      tee_time: input.teeTime.toISOString(),
      note: input.note,
    })
    .select(PLAN_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as PlanWithCourse;
}

/** Accepts the plan and returns the id of the newly created round. */
export async function acceptPlan(planId: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_round_plan', {
    p_plan_id: planId,
  });
  if (error) throw error;
  return data as string;
}

export async function declinePlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from('round_plans')
    .update({ status: 'declined', responded_at: new Date().toISOString() })
    .eq('id', planId);
  if (error) throw error;
}

export async function cancelPlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from('round_plans')
    .update({ status: 'cancelled', responded_at: new Date().toISOString() })
    .eq('id', planId);
  if (error) throw error;
}
