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
  home_location: unknown | null;
  home_city: string | null;
  home_course_name: string | null;
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
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
};
