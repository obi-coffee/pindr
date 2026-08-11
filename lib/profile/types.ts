export type WalkingPreference = 'walk' | 'ride' | 'either';
export type HolesPreference = '9' | '18' | 'either';
export type Pace = 'chill' | 'moderate' | 'ready';
export type Betting = 'yes' | 'small' | 'no';
export type Drinks = 'yes' | 'sometimes' | 'no';
export type PostRound = 'hangout' | 'just_round';
export type TeachingMindset = 'open_to_tips' | 'just_play';
export type StyleDefault = 'relaxed' | 'improvement' | 'competitive';

export type Profile = {
  user_id: string;
  display_name: string | null;
  age: number | null;
  gender: string | null;
  pronouns: string | null;
  bio: string | null;
  // Optional: no longer fetched by the client. The raw coordinate point
  // is write-only from the app (edit/location, onboarding/location);
  // reads were removed for privacy — see
  // supabase/pending/APPLY-AFTER-1.0.1_profiles_column_privileges.sql.
  home_location?: unknown | null;
  home_city: string | null;
  home_course_name: string | null;
  // Structured link under home_course_name — set when the course was
  // picked from the list, null for legacy/unmatched free text.
  home_course_id: string | null;
  // Only meaningful when home_course_id points at a private club
  // (courses.is_public = false); surfaced in Phase D.
  can_host_guests: boolean;
  handicap: number | null;
  has_handicap: boolean;
  years_playing: number | null;
  walking_preference: WalkingPreference | null;
  holes_preference: HolesPreference | null;
  pace: Pace | null;
  betting: Betting | null;
  drinks: Drinks | null;
  post_round: PostRound | null;
  teaching_mindset: TeachingMindset | null;
  style_default: StyleDefault | null;
  photo_urls: string[];
  // Phase 2 culture-fit answers, keyed by question id from
  // lib/profile/questions.ts. Empty `{}` means no answers given.
  profile_answers: Record<string, string>;
  // Loop Phase E availability slots, keyed by slot id from
  // lib/profile/availability.ts. Empty `{}` means not set.
  availability: Record<string, boolean>;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
};
