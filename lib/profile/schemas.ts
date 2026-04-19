import { z } from 'zod';

export const basicsSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, 'At least 2 characters')
    .max(40, 'Keep it under 40 characters'),
  age: z
    .number({ message: 'Enter your age' })
    .int('Whole numbers only')
    .min(18, 'Must be 18 or older')
    .max(120, 'Enter a realistic age'),
  gender: z.string().trim().max(40).optional(),
  pronouns: z.string().trim().max(40).optional(),
  bio: z.string().trim().max(300, 'Keep it under 300 characters').optional(),
});

export type BasicsInput = z.infer<typeof basicsSchema>;

export const golfSchema = z
  .object({
    has_handicap: z.boolean(),
    handicap: z.number().min(-10, 'Too low').max(54, 'Too high').optional(),
    years_playing: z
      .number({ message: 'Enter how long you have played' })
      .int('Whole numbers only')
      .min(0, 'Cannot be negative')
      .max(100, 'Enter a realistic number'),
    home_course_name: z.string().trim().max(80).optional(),
  })
  .refine((d) => !d.has_handicap || typeof d.handicap === 'number', {
    message: 'Enter your handicap or toggle it off',
    path: ['handicap'],
  });

export type GolfInput = z.infer<typeof golfSchema>;

export const styleSchema = z.object({
  walking_preference: z.enum(['walk', 'ride', 'either'], {
    message: 'Pick one',
  }),
  holes_preference: z.enum(['9', '18', 'either'], { message: 'Pick one' }),
  pace: z.enum(['chill', 'moderate', 'ready'], { message: 'Pick one' }),
  betting: z.enum(['yes', 'small', 'no'], { message: 'Pick one' }),
  drinks: z.enum(['yes', 'sometimes', 'no'], { message: 'Pick one' }),
  post_round: z.enum(['hangout', 'just_round'], { message: 'Pick one' }),
  teaching_mindset: z.enum(['open_to_tips', 'just_play'], {
    message: 'Pick one',
  }),
  style_default: z.enum(['relaxed', 'improvement', 'competitive'], {
    message: 'Pick one',
  }),
});

export type StyleInput = z.infer<typeof styleSchema>;
