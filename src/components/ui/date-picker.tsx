'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
	date?: Date;
	onDateChange?: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function DatePicker({
	date,
	onDateChange,
	placeholder = 'Sanani tanlang',
	disabled = false,
	className,
}: DatePickerProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant='outline'
					disabled={disabled}
					className={cn(
						'w-full justify-start text-left font-normal',
						!date && 'text-muted-foreground',
						className,
					)}
				>
					<CalendarIcon className='mr-2 h-4 w-4' />
					{date ? format(date, 'dd.MM.yyyy', { locale: uz }) : <span>{placeholder}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-auto p-0' align='start'>
				<Calendar mode='single' selected={date} onSelect={onDateChange} initialFocus locale={uz} />
			</PopoverContent>
		</Popover>
	);
}

interface DateRangePickerProps {
	dateFrom?: Date;
	dateTo?: Date;
	onDateFromChange?: (date: Date | undefined) => void;
	onDateToChange?: (date: Date | undefined) => void;
	placeholderFrom?: string;
	placeholderTo?: string;
	disabled?: boolean;
	className?: string;
}

export function DateRangePicker({
	dateFrom,
	dateTo,
	onDateFromChange,
	onDateToChange,
	placeholderFrom = 'Boshlanish',
	placeholderTo = 'Tugash',
	disabled = false,
	className,
}: DateRangePickerProps) {
	return (
		<div className={cn('flex items-center gap-2', className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						disabled={disabled}
						className={cn(
							'w-[140px] justify-start text-left font-normal',
							!dateFrom && 'text-muted-foreground',
						)}
					>
						<CalendarIcon className='mr-2 h-4 w-4' />
						{dateFrom ? format(dateFrom, 'dd.MM.yyyy', { locale: uz }) : <span>{placeholderFrom}</span>}
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-auto p-0' align='start'>
					<Calendar mode='single' selected={dateFrom} onSelect={onDateFromChange} initialFocus locale={uz} />
				</PopoverContent>
			</Popover>
			<span className='text-muted-foreground'>—</span>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						disabled={disabled}
						className={cn(
							'w-[140px] justify-start text-left font-normal',
							!dateTo && 'text-muted-foreground',
						)}
					>
						<CalendarIcon className='mr-2 h-4 w-4' />
						{dateTo ? format(dateTo, 'dd.MM.yyyy', { locale: uz }) : <span>{placeholderTo}</span>}
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-auto p-0' align='start'>
					<Calendar mode='single' selected={dateTo} onSelect={onDateToChange} initialFocus locale={uz} />
				</PopoverContent>
			</Popover>
		</div>
	);
}
