import { supabase } from '../supabase';

// Single source of truth for availability slots (Loop Phase E). Same
// contract as profile questions: `id` is stored verbatim as a key in
// the JSONB profiles.availability column, so changing an id after
// launch drops previous answers — be deliberate. Rewording a label is
// free.

export type AvailabilitySlotId =
  | 'weekday_am'
  | 'weekday_pm'
  | 'weekend_am'
  | 'weekend_pm'
  | 'twilight';

export type Availability = Partial<Record<string, boolean>>;

export type AvailabilitySlot = {
  id: AvailabilitySlotId;
  label: string; // chips + profile tags
  short: string; // compact line in the chat header
};

export const AVAILABILITY_SLOTS: AvailabilitySlot[] = [
  { id: 'weekday_am', label: 'Weekday mornings', short: 'weekday am' },
  { id: 'weekday_pm', label: 'Weekday evenings', short: 'weekday pm' },
  { id: 'weekend_am', label: 'Weekend mornings', short: 'weekend am' },
  { id: 'weekend_pm', label: 'Weekend afternoons', short: 'weekend pm' },
  { id: 'twilight', label: 'Twilight', short: 'twilight' },
];

/** Slots marked true, in canonical display order. */
export function selectedSlots(
  availability: Availability | null | undefined,
): AvailabilitySlot[] {
  if (!availability) return [];
  return AVAILABILITY_SLOTS.filter((s) => availability[s.id] === true);
}

/** Compact one-liner for tight spaces: "weekend am · twilight". */
export function availabilityShortLine(
  availability: Availability | null | undefined,
): string | null {
  const slots = selectedSlots(availability);
  if (slots.length === 0) return null;
  return slots.map((s) => s.short).join(' · ');
}

export function toAvailability(ids: Iterable<string>): Availability {
  const out: Availability = {};
  for (const id of ids) out[id] = true;
  return out;
}

export async function saveAvailability(
  userId: string,
  availability: Availability,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ availability })
    .eq('user_id', userId);
  if (error) throw error;
}
