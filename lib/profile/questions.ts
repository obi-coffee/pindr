// Single source of truth for the optional culture-fit questions
// (pre_resubmit_plan.md Phase 2). Adding, removing, or rewording a
// question is one edit here. The keys are stored verbatim in the
// JSONB profile_answers column, so changing an `id` after launch is
// effectively dropping the previous answer — be deliberate.
//
// `choice` questions render as a ChipSelect group; the answer is the
// chosen option string. `text` questions render as a multiline input;
// the answer is the typed text trimmed.

export type ProfileQuestion =
  | {
      id: string;
      prompt: string;
      type: 'choice';
      options: string[];
    }
  | {
      id: string;
      prompt: string;
      type: 'text';
      placeholder?: string;
    };

export type ProfileAnswers = Record<string, string>;

export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    id: 'music',
    prompt: 'Music on the course?',
    type: 'choice',
    options: ['Yes please', 'Only at the right times', 'Hard pass'],
  },
  {
    id: 'pace',
    prompt: 'Pace of play?',
    type: 'choice',
    options: ['Stop and smell the roses', 'Keep it moving', 'Speed demon'],
  },
  {
    id: 'walk_or_ride',
    prompt: 'Walk or ride?',
    type: 'choice',
    options: ['Always walk', 'Always ride', 'Course dependent'],
  },
  {
    id: 'bad_shot',
    prompt: 'How do you handle a bad shot?',
    type: 'choice',
    options: [
      'Laugh it off',
      'Quick reset',
      'Intensity mode',
      'Cold beverage cures all',
    ],
  },
  {
    id: 'wagers',
    prompt: 'Wagers?',
    type: 'choice',
    options: [
      'Just for fun',
      'Skins for snacks',
      'Real money keeps it interesting',
    ],
  },
  {
    id: 'mulligans',
    prompt: 'Mulligans?',
    type: 'choice',
    options: [
      'Strict rules',
      'Friendly mulligans welcome',
      "Mulligans? Never heard of her",
    ],
  },
  {
    id: 'best_moment',
    prompt: 'Best moment on the course?',
    type: 'text',
    placeholder: 'That hole-out from 145, the eagle on 18, etc.',
  },
  {
    id: 'improving',
    prompt: 'What are you working to improve in your game?',
    type: 'text',
    placeholder: 'Short game, course management, finally breaking 90…',
  },
  {
    id: 'snack_drink',
    prompt: 'Favorite clubhouse snack or post-round drink?',
    type: 'text',
    placeholder: 'Hot dog at the turn, beer on the back porch…',
  },
  {
    id: 'dream_course',
    prompt: "Dream course you'd play tomorrow?",
    type: 'text',
    placeholder: 'Cypress Point, Bandon, your home muni…',
  },
];

export function isAnswered(answers: ProfileAnswers | null | undefined): boolean {
  if (!answers) return false;
  return Object.values(answers).some((v) => v && v.trim().length > 0);
}
