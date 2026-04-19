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
