/**
 * Product Model Validation Schemas
 * Zod validation schemas for product model forms
 */

import { z } from 'zod';

export const productModelSchema = z.object({
  name: z
    .string()
    .min(1, 'Nomi majburiy')
    .min(2, 'Nomi kamida 2 ta belgidan iborat bo\'lishi kerak')
    .max(255, 'Nomi 255 ta belgidan oshmasligi kerak'),
  category: z
    .array(z.number())
    .min(1, 'Kamida bitta kategoriya tanlash majburiy'),
  sorting: z
    .number()
    .int('Faqat butun son kiritish mumkin')
    .nullable()
    .optional()
    .or(z.literal('')),
});

export type ProductModelFormData = z.infer<typeof productModelSchema>;
