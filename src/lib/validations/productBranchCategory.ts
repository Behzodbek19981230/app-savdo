/**
 * Product Branch Category Validation Schema
 * Mahsulot turlari kategoriyasi uchun validatsiya
 */

import { z } from 'zod';

export const productBranchCategorySchema = z.object({
  product_branch: z.number({
    required_error: "Bo'limni tanlang",
    invalid_type_error: "Bo'lim majburiy",
  }).int("Bo'lim butun son bo'lishi kerak").positive("Bo'limni tanlang"),
  name: z
    .string()
    .min(1, 'Nomi majburiy')
    .min(2, "Nomi kamida 2 ta belgidan iborat bo'lishi kerak")
    .max(255, "Nomi 255 ta belgidan oshmasligi kerak"),
  sorting: z
    .number()
    .int("Faqat butun son kiritish mumkin")
    .nullable()
    .optional()
    .or(z.literal('')),
});

export type ProductBranchCategoryFormData = z.infer<typeof productBranchCategorySchema>;
