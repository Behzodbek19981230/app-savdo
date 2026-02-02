/**
 * Role Validation Schema
 */

import { z } from 'zod';

export const roleSchema = z.object({
  name: z
    .string({ required_error: 'Nomi majburiy' })
    .min(2, 'Nomi kamida 2 ta belgidan iborat bo\'lishi kerak')
    .max(255, 'Nomi 255 ta belgidan oshmasligi kerak'),
  description: z
    .string()
    .max(1000, 'Tavsif 1000 ta belgidan oshmasligi kerak')
    .optional()
    .or(z.literal('')),
});

export type RoleFormData = z.infer<typeof roleSchema>;
