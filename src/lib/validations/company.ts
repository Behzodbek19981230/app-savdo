/**
 * Company (Filial) Validation Schemas
 */

import { z } from 'zod';

export const companyBaseSchema = z.object({
	name: z.string({ required_error: 'Nomi majburiy' }).min(2, 'Nomi kamida 2 ta belgi'),
	region: z.number().optional(),
	district: z.number().optional(),
	address: z.string().optional().or(z.literal('')),
	phone_number: z.string().optional().or(z.literal('')),
	logo: z.any().optional(),
	is_active: z.boolean().optional(),
});

export type CompanyFormData = z.infer<typeof companyBaseSchema>;
