import { z } from 'zod';

// Valid service categories for the marketplace
const VALID_CATEGORIES = [
  'plumber',
  'electrician', 
  'cleaner',
  'painter',
  'carpenter',
  'handyman',
  'ac_repair',
  'Plumber',
  'Electrician',
  'Cleaner',
  'Painter',
  'Carpenter',
  'Handyman',
  'AC Repair',
  'AC_Repair',
] as const;

export const jobDataSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be 100 characters or less')
    .trim(),
  category: z.string()
    .refine(
      (val) => VALID_CATEGORIES.some(cat => 
        cat.toLowerCase() === val.toLowerCase()
      ),
      { message: 'Invalid service category' }
    ),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be 2000 characters or less')
    .trim(),
  budget: z.string()
    .max(50, 'Budget must be 50 characters or less')
    .optional()
    .nullable(),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be 100 characters or less')
    .trim(),
});

export type ValidatedJobData = z.infer<typeof jobDataSchema>;

export function validateJobData(data: unknown) {
  return jobDataSchema.safeParse(data);
}

// Normalize category to database format
export function normalizeCategory(category: string): string {
  const normalized = category.toLowerCase().replace(/\s+/g, '_');
  return normalized;
}
