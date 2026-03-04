import { z } from 'zod';

export const clientSchema = z.object({
	telegram_id: z.coerce.number().optional(),
	full_name: z.string().min(1, 'F.I.Sh kiritilishi shart'),
	is_active: z.boolean().default(true),
	date_of_birthday: z.string().optional().or(z.literal('')),
	gender: z.string().optional().or(z.literal('')),
	phone_number: z.string().optional().or(z.literal('')),
	region: z.coerce.number().positive('Viloyat tanlanishi shart'),
	district: z.coerce.number().positive('Tuman tanlanishi shart'),
	filial: z.coerce.number().positive('Filial tanlanishi shart'),
	total_debt: z.coerce.number().default(0),
	keshbek: z.coerce.number().default(0),
	type: z.enum(['dona', 'optom', 'dokon', 'hamkor']).default('dona'),
	is_delete: z.boolean().default(false),
});

export type ClientFormData = z.infer<typeof clientSchema>;
