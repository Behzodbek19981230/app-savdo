/**
 * Company Validation Schemas
 */

import { z } from 'zod';

export const companyBaseSchema = z.object({
  name: z.string({ required_error: 'Nomi majburiy' }).min(2, 'Nomi kamida 2 ta belgi'),
  email: z.string().email('Email noto\'g\'ri').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  title: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  // File validationni submit paytida alohida tekshiramiz
  logo: z.any().optional(),
});

export type CompanyFormData = z.infer<typeof companyBaseSchema>;
