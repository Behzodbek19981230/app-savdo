import React from 'react';
import { cn } from '@/lib/utils';

interface NumberInputProps {
    value: string; // normalized numeric string, e.g. "10000.50"
    onChange: (value: string) => void; // returns normalized string
    allowDecimal?: boolean;
    placeholder?: string;
    className?: string;
    // size prop: small | middle | large
    size?: 'small' | 'middle' | 'large';
    step?: string;
    readOnly?: boolean;
    disabled?: boolean;
}

export function NumberInput({
    value,
    onChange,
    allowDecimal = true,
    placeholder,
    className,
    step,
    size = 'middle',
    readOnly,
    disabled,
}: NumberInputProps) {
    const formatWithSpaces = (val?: string | number) => {
        if (val == null || val === '') return '';
        const s = String(val);
        // Agar faqat nuqta bo'lsa, uni qaytarish
        if (s === '.') return '.';
        const parts = s.split('.');
        // Integer qismini formatlash
        if (parts[0]) {
            parts[0] = parts[0].replace(/^0+(?=\d)/, '');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        }
        return parts.join('.');
    };

    const normalizeInputNumber = (val: string) => {
        if (!val) return '';
        let cleaned = val
            .replace(/\s+/g, '')
            .replace(/,/g, '.')
            .replace(/[^0-9.]/g, '');

        // Agar faqat nuqta bo'lsa, uni qaytarish
        if (cleaned === '.') return '.';

        const parts = cleaned.split('.');

        // Agar decimal ruxsat etilmagan bo'lsa
        if (!allowDecimal && parts.length > 1) {
            return parts[0];
        }

        // Bir nechta nuqtani bitta nuqtaga aylantirish
        if (parts.length > 1) {
            // Faqat birinchi nuqtadan keyingi barcha raqamlarni qo'shish
            const decimalPart = parts.slice(1).join('');
            cleaned = parts[0] + '.' + decimalPart;
        }

        return cleaned;
    };

    const sizeClasses =
        size === 'small'
            ? 'h-8 px-3 py-1.5 text-sm'
            : size === 'large'
                ? 'h-12 px-5 py-3 text-base'
                : 'h-10 px-3 py-2 text-base md:text-sm';

    return (
        <input
            type='text'
            inputMode={allowDecimal ? 'decimal' : 'numeric'}
            value={formatWithSpaces(value)}
            onChange={(e) => onChange(normalizeInputNumber(e.target.value))}
            placeholder={placeholder}
            readOnly={readOnly}
            disabled={disabled}
            className={cn(
                'flex w-full rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
                sizeClasses,
                className,
            )}
            data-step={step}
        />
    );
}

export default NumberInput;
