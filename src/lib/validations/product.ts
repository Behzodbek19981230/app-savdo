/**
 * Product Validation Schema
 * Mahsulot uchun validatsiya
 */

import { z } from 'zod';
import { ProductType } from '@/services/product.service';

export const productSchema = z.object({
    category: z.number({
        required_error: 'Kategoriya majburiy',
        invalid_type_error: 'Kategoriya raqam bo\'lishi kerak',
    }).int('Kategoriya butun son bo\'lishi kerak'),

    model: z.number({
        required_error: 'Model majburiy',
        invalid_type_error: 'Model raqam bo\'lishi kerak',
    }).int('Model butun son bo\'lishi kerak'),

    model_type: z.number({
        required_error: 'Model turi majburiy',
        invalid_type_error: 'Model turi raqam bo\'lishi kerak',
    }).int('Model turi butun son bo\'lishi kerak'),

    model_size: z.number({
        required_error: 'Model o\'lchami majburiy',
        invalid_type_error: 'Model o\'lchami raqam bo\'lishi kerak',
    }).int('Model o\'lchami butun son bo\'lishi kerak'),

    size: z.number({
        required_error: 'O\'lcham majburiy',
        invalid_type_error: 'O\'lcham raqam bo\'lishi kerak',
    }).int('O\'lcham butun son bo\'lishi kerak')
        .min(0, 'O\'lcham 0 dan kichik bo\'lmasligi kerak'),

    type: z.nativeEnum(ProductType, {
        required_error: 'Tur majburiy',
        invalid_type_error: 'Noto\'g\'ri tur tanlangan',
    }),

    count: z.number({
        required_error: 'Soni majburiy',
        invalid_type_error: 'Soni raqam bo\'lishi kerak',
    }).int('Soni butun son bo\'lishi kerak')
        .min(0, 'Soni 0 dan kichik bo\'lmasligi kerak'),

    real_price: z.number({
        required_error: 'Haqiqiy narx majburiy',
        invalid_type_error: 'Haqiqiy narx raqam bo\'lishi kerak',
    }).min(0, 'Haqiqiy narx 0 dan kichik bo\'lmasligi kerak'),

    price: z.number({
        required_error: 'Narx majburiy',
        invalid_type_error: 'Narx raqam bo\'lishi kerak',
    }).min(0, 'Narx 0 dan kichik bo\'lmasligi kerak'),

    discription: z.string()
        .max(5000, 'Tavsif 5000 belgidan oshmasligi kerak')
        .optional(),

    sorting: z.number({
        invalid_type_error: 'Tartib raqami raqam bo\'lishi kerak',
    }).int('Tartib raqami butun son bo\'lishi kerak')
        .nullable()
        .optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
