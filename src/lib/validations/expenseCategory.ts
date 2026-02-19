/**
 * Expense Category Validation Schemas
 * Zod validation schemas for expense category forms
 */

import { z } from 'zod';

export const expenseCategorySchema = z.object({
	name: z
		.string()
		.min(1, 'Nomi majburiy')
		.min(2, 'Nomi kamida 2 ta belgidan iborat bo\'lishi kerak')
		.max(255, 'Nomi 255 ta belgidan oshmasligi kerak'),
});

export type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>;
