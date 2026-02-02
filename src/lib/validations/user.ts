/**
 * User Validation Schemas
 */

import { z } from 'zod';

export const userBaseSchema = z.object({
  username: z
    .string({ required_error: 'Username majburiy' })
    .min(3, 'Username kamida 3 ta belgidan iborat bo\'lishi kerak')
    .max(50, 'Username juda uzun'),
  full_name: z
    .string({ required_error: 'F.I.Sh majburiy' })
    .min(2, 'F.I.Sh kamida 2 ta belgidan iborat bo\'lishi kerak')
    .max(255, 'F.I.Sh juda uzun'),
  is_active: z.boolean().default(true),
  date_of_birthday: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  phone_number: z.string().optional().or(z.literal('')),
  email: z.string().email('Email noto\'g\'ri').optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  company: z.number().int().optional(),
  region: z.number().int().optional(),
  district: z.number().int().optional(),
  roles: z.array(z.number().int()).min(1, 'Role majburiy'),
  address: z.string().optional().or(z.literal('')),
  // avatar binary file bo'ladi (FormData)
  avatar: z.any().optional(),
});

export const userCreateSchema = userBaseSchema.superRefine((val, ctx) => {
  if (!val.password || String(val.password).trim().length < 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['password'],
      message: 'Parol majburiy (kamida 4 ta belgi)',
    });
  }
});

export const userUpdateSchema = userBaseSchema.superRefine((val, ctx) => {
  if (val.password && String(val.password).trim().length > 0 && String(val.password).trim().length < 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['password'],
      message: 'Parol kamida 4 ta belgi bo\'lishi kerak',
    });
  }
});

export type UserFormData = z.infer<typeof userBaseSchema>;
