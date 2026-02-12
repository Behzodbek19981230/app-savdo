/**
 * Unit Validation Schemas
 * Zod validation schemas for unit forms
 */

import { z } from 'zod';

export const unitSchema = z.object({
  code: z
    .string()
    .min(1, 'Kod majburiy')
    .min(1, 'Kod kamida 1 ta belgidan iborat bo\'lishi kerak')
    .max(50, 'Kod 50 ta belgidan oshmasligi kerak'),
  name: z
    .string()
    .min(1, 'Nomi majburiy')
    .min(2, 'Nomi kamida 2 ta belgidan iborat bo\'lishi kerak')
    .max(255, 'Nomi 255 ta belgidan oshmasligi kerak'),
  is_active: z.boolean().default(true),
});

export type UnitFormData = z.infer<typeof unitSchema>;
