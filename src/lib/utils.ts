import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
	return formatNumber(value);
}

export function formatNumber(value: number | string | null | undefined) {
	if (value === null || value === undefined || value === '') return '';
	const num = Number(value);
	if (Number.isNaN(num)) return String(value);
	const sign = num < 0 ? '-' : '';
	const abs = Math.abs(num);
	const parts = abs.toFixed(2).split('.');
	const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	const dec = parts[1];
	return `${sign}${intPart}.${dec}`;
}
