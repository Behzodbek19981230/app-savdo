/**
 * Product Validation Schema
 * Mahsulot uchun validatsiya
 */

import { z } from 'zod';
import { ProductType } from '@/services/product.service';

export const productSchema = z.object({
	category: z
		.number({
			required_error: "Bo'lim majburiy",
			invalid_type_error: "Bo'lim raqam bo'lishi kerak",
		})
		.int("Bo'lim butun son bo'lishi kerak"),

	branch_category: z.coerce.number().int().min(0).optional().default(0),

	model: z
		.number({
			required_error: 'Model majburiy',
			invalid_type_error: "Model raqam bo'lishi kerak",
		})
		.int("Model butun son bo'lishi kerak"),

	model_type: z
		.number({
			required_error: 'Model turi majburiy',
			invalid_type_error: "Model turi raqam bo'lishi kerak",
		})
		.int("Model turi butun son bo'lishi kerak"),

	size: z.number().int().min(0, "O'lcham tanlanishi shart"), // ProductTypeSize id
	unit: z.coerce.number().int().min(0, "O'lchov birligi tanlanishi shart"),

	count: z.number().int().min(0, "Miqdor 0 dan kichik bo'lmasligi kerak"),
	reserve_limit: z.coerce.number().positive('Zaxira limiti kiritilishi shart'),

	real_price: z.number().min(0, "Xaqiqiy narx 0 dan kichik bo'lmasligi kerak"),
	price: z.number().min(0, "Dona narxi 0 dan kichik bo'lmasligi kerak"),
	wholesale_price: z.number().min(0, "Optom narx 0 dan kichik bo'lmasligi kerak"),
	min_price: z.number().min(0, "Minimal narx 0 dan kichik bo'lmasligi kerak"),

	note: z.string().max(5000).optional(),
	discription: z.string().max(5000).optional(),

	sorting: z.number().int().nullable().optional(),
});

// Schema used by the full product API
export type ProductFormData = z.infer<typeof productSchema>;

// Form-specific schema: only the keys present in the product modal form
export const productFormSchema = productSchema.omit({
	price: true,
	wholesale_price: true,
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
