/**
 * Product Category Validation Schemas
 * Zod validation schemas for product category forms
 */

import { z } from 'zod';

export const productCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Nomi majburiy')
    .min(2, 'Nomi kamida 2 ta belgidan iborat bo\'lishi kerak')
    .max(255, 'Nomi 255 ta belgidan oshmasligi kerak'),
  sorting: z
    .number()
    .int('Faqat butun son kiritish mumkin')
    .nullable()
    .optional()
    .or(z.literal('')),
});

export type ProductCategoryFormData = z.infer<typeof productCategorySchema>;
