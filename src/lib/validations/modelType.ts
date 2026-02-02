/**
 * Model Type Validation Schema
 * Mahsulot model turi uchun validatsiya
 */

import { z } from 'zod';

export const modelTypeSchema = z.object({
  name: z.string({
    required_error: 'Nomi majburiy',
  })
    .min(2, 'Nomi kamida 2 ta belgidan iborat bo\'lishi kerak')
    .max(255, 'Nomi 255 ta belgidan oshmasligi kerak'),
  
  model: z.number({
    required_error: 'Model majburiy',
    invalid_type_error: 'Model raqam bo\'lishi kerak',
  }).int('Model butun son bo\'lishi kerak'),
  
  sorting: z.number({
    invalid_type_error: 'Tartib raqami raqam bo\'lishi kerak',
  }).int('Tartib raqami butun son bo\'lishi kerak')
    .nullable()
    .optional(),
});

export type ModelTypeFormData = z.infer<typeof modelTypeSchema>;
