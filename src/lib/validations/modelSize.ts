/**
 * Model Size Validation Schema
 * Mahsulot model o'lchami uchun validatsiya
 */

import { z } from 'zod';
import { ModelSizeType } from '@/services/modelSize.service';

export const modelSizeSchema = z.object({
  model_type: z.number({
    required_error: 'Model turi majburiy',
    invalid_type_error: 'Model turi raqam bo\'lishi kerak',
  }).int('Model turi butun son bo\'lishi kerak'),
  
  size: z.number({
    required_error: 'O\'lcham majburiy',
    invalid_type_error: 'O\'lcham raqam bo\'lishi kerak',
  }).int('O\'lcham butun son bo\'lishi kerak')
    .min(0, 'O\'lcham 0 dan kichik bo\'lmasligi kerak'),
  
  type: z.nativeEnum(ModelSizeType, {
    required_error: 'Tur majburiy',
    invalid_type_error: 'Noto\'g\'ri tur tanlangan',
  }),
  
  sorting: z.number({
    invalid_type_error: 'Tartib raqami raqam bo\'lishi kerak',
  }).int('Tartib raqami butun son bo\'lishi kerak')
    .nullable()
    .optional(),
});

export type ModelSizeFormData = z.infer<typeof modelSizeSchema>;
