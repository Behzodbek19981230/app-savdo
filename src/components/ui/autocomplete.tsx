'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Plus, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface AutocompleteOption {
	value: string | number;
	label: string;
}

const SEARCH_DEBOUNCE_MS = 300;

interface AutocompleteProps {
	options: AutocompleteOption[];
	value?: string | number;
	onValueChange?: (value: string | number) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	disabled?: boolean;
	className?: string;
	allowCreate?: boolean;
	onCreateNew?: (name: string) => Promise<{ id: number; name: string } | null>;
	createText?: string;
	isLoading?: boolean;
	/** Backendga qidiruv: berilsa client-side filter o'chadi, qidiruv onSearchChange orqali backendga yuboriladi */
	onSearchChange?: (search: string) => void;
	/** Scroll oxiriga yetganda keyingi sahifa (load more) */
	onScrollToBottom?: () => void;
	hasMore?: boolean;
	isLoadingMore?: boolean;
}

export function Autocomplete({
	options,
	value,
	onValueChange,
	placeholder = 'Tanlang...',
	searchPlaceholder = 'Qidirish...',
	emptyText = "Ma'lumot topilmadi",
	disabled = false,
	className,
	allowCreate = false,
	onCreateNew,
	createText = "Yangi qo'shish",
	isLoading = false,
	onSearchChange,
	onScrollToBottom,
	hasMore = false,
	isLoadingMore = false,
}: AutocompleteProps) {
	const [open, setOpen] = React.useState(false);
	const [searchValue, setSearchValue] = React.useState('');
	const [isCreating, setIsCreating] = React.useState(false);
	const listRef = React.useRef<HTMLDivElement>(null);

	const selectedOption = options.find((option) => option.value === value);
	const serverSearch = typeof onSearchChange === 'function';

	// onSearchChange funksiyasini ref da saqlash - dependency muammosini oldini olish
	const onSearchChangeRef = React.useRef(onSearchChange);
	React.useEffect(() => {
		onSearchChangeRef.current = onSearchChange;
	}, [onSearchChange]);

	// Backend qidiruv: debounce (lekin bo'sh bo'lsa darhol)
	React.useEffect(() => {
		if (!serverSearch) return;
		// Agar searchValue bo'sh bo'lsa, darhol chaqirish (debounce yo'q)
		if (!searchValue.trim()) {
			onSearchChangeRef.current?.('');
			return;
		}
		// Aks holda debounce bilan
		const t = setTimeout(() => {
			onSearchChangeRef.current?.(searchValue.trim());
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(t);
	}, [searchValue, serverSearch]);

	// Popover ochilganda ham (ayniqsa search bo'sh bo'lsa) backenddan ro'yxatni tortish
	const handleOpenChange = React.useCallback(
		(nextOpen: boolean) => {
			setOpen(nextOpen);
			if (nextOpen && serverSearch) {
				onSearchChangeRef.current?.(searchValue.trim());
			}
		},
		[serverSearch, searchValue],
	);

	// Reset search when popover closes
	React.useEffect(() => {
		if (!open) {
			setSearchValue('');
		}
	}, [open]);

	// Client-side filter faqat serverSearch bo'lmaganda
	const filteredOptions = React.useMemo(() => {
		if (serverSearch) return options;
		if (!searchValue) return options;
		const query = searchValue.toLowerCase();
		return options.filter((option) => option.label.toLowerCase().includes(query));
	}, [options, searchValue, serverSearch]);

	const handleSelect = (option: AutocompleteOption, e?: React.PointerEvent<HTMLButtonElement>) => {
		// Touch event handling - agar scroll bo'lsa, select qilmaslik
		if (e && e.pointerType === 'touch') {
			const el = e.currentTarget as HTMLElement;
			const moved = el.dataset.__moved === '1';
			if (moved) return;
		}

		onValueChange?.(option.value);
		setOpen(false);
		setSearchValue('');
	};

	const handleCreateNew = async () => {
		if (!onCreateNew || !searchValue.trim()) return;

		setIsCreating(true);
		try {
			const newItem = await onCreateNew(searchValue.trim());
			if (newItem) {
				onValueChange?.(newItem.id);
				setSearchValue('');
				setOpen(false);
			}
		} finally {
			setIsCreating(false);
		}
	};

	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		// Scroll eventni to'xtatish
		e.stopPropagation();
		if (e.nativeEvent) {
			(e.nativeEvent as Event).stopImmediatePropagation();
		}
		// Scroll oxiriga yetganda keyingi sahifani yuklash
		if (onScrollToBottom && listRef.current) {
			const el = listRef.current;
			const threshold = 60;
			if (el.scrollHeight - el.scrollTop <= el.clientHeight + threshold) {
				onScrollToBottom();
			}
		}
	};

	return (
		<PopoverPrimitive.Root open={disabled ? false : open} onOpenChange={disabled ? undefined : handleOpenChange}>
			<PopoverPrimitive.Trigger asChild>
				<Button
					variant='outline'
					role='combobox'
					aria-expanded={open}
					disabled={disabled || isLoading}
					className={cn('w-full justify-between font-normal', className)}
				>
					{isLoading ? (
						<span className='text-muted-foreground flex items-center gap-2'>
							<Loader2 className='h-4 w-4 animate-spin' />
							Yuklanmoqda...
						</span>
					) : selectedOption ? (
						selectedOption.label
					) : (
						<span className='text-muted-foreground'>{placeholder}</span>
					)}
					<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
				</Button>
			</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					className={cn(
						'z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border bg-popover p-0 shadow-lg',
						'data-[state=open]:animate-in data-[state=closed]:animate-out',
						'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
						'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
						'data-[side=bottom]:slide-in-from-top-2',
						'flex flex-col max-h-[400px] overflow-hidden',
					)}
					align='start'
					sideOffset={4}
					onWheel={(e) => {
						// Popover ichida wheel eventni to'xtatish
						e.stopPropagation();
						if (e.nativeEvent) {
							(e.nativeEvent as WheelEvent).stopImmediatePropagation();
						}
					}}
					onTouchMove={(e) => {
						// Touch scroll eventni to'xtatish
						e.stopPropagation();
					}}
				>
					{/* Search Input */}
					<div className='p-1.5 border-b shrink-0'>
						<div className='relative'>
							<Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
							<Input
								type='text'
								placeholder={searchPlaceholder}
								value={searchValue}
								onChange={(e) => {
									const newValue = e.target.value;
									setSearchValue(newValue);
									// Agar tozalansa (bo'sh bo'lsa), darhol backendga yuborish
									if (!newValue.trim() && serverSearch) {
										onSearchChangeRef.current?.('');
									}
								}}
								className='pl-8 h-9 text-sm'
								autoFocus
							/>
						</div>
					</div>

					{/* Options List */}
					<div
						ref={listRef}
						className='flex-1 overflow-y-auto overflow-x-hidden p-1 min-h-0 overscroll-contain'
						style={{
							maxHeight: '300px',
							overscrollBehavior: 'contain',
							WebkitOverflowScrolling: 'touch',
						}}
						onWheel={(e) => {
							// Scroll eventni to'xtatish
							e.stopPropagation();
							if (e.nativeEvent) {
								(e.nativeEvent as WheelEvent).stopImmediatePropagation();
							}
						}}
						onScroll={handleScroll}
						onTouchMove={(e) => {
							// Touch scroll eventni to'xtatish
							e.stopPropagation();
						}}
						onMouseDown={(e) => {
							// Mouse eventni to'xtatish - scroll ishlashi uchun
							e.stopPropagation();
						}}
					>
						{filteredOptions.length > 0 ? (
							filteredOptions.map((option) => (
								<button
									key={option.value}
									type='button'
									onPointerDown={(e) => {
										const el = e.currentTarget as HTMLElement;
										if (e.pointerType === 'touch') {
											el.dataset.__startX = String(e.clientX);
											el.dataset.__startY = String(e.clientY);
											el.dataset.__moved = '0';
										}
									}}
									onPointerMove={(e) => {
										const el = e.currentTarget as HTMLElement;
										if (e.pointerType === 'touch') {
											const sx = Number(el.dataset.__startX || 0);
											const sy = Number(el.dataset.__startY || 0);
											if (Math.abs(e.clientX - sx) > 6 || Math.abs(e.clientY - sy) > 6) {
												el.dataset.__moved = '1';
											}
										}
									}}
									onPointerUp={(e) => {
										const el = e.currentTarget as HTMLElement;
										if (e.pointerType === 'touch') {
											const moved = el.dataset.__moved === '1';
											if (!moved) {
												e.preventDefault();
												e.stopPropagation();
												handleSelect(option, e);
											}
											delete el.dataset.__startX;
											delete el.dataset.__startY;
											delete el.dataset.__moved;
										} else {
											handleSelect(option, e);
										}
									}}
									className={cn(
										'relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-7 pr-2 text-sm outline-none',
										'focus:bg-accent focus:text-accent-foreground',
										'hover:bg-accent hover:text-accent-foreground',
										'transition-colors duration-200',
										selectedOption?.value === option.value && 'bg-accent text-accent-foreground',
									)}
								>
									<span className='absolute left-2 flex h-4 w-4 items-center justify-center'>
										{selectedOption?.value === option.value && (
											<Check className='h-4 w-4 text-primary' />
										)}
									</span>
									<span className='flex-1 min-w-0 whitespace-normal break-words text-left'>
										{option.label}
									</span>
								</button>
							))
						) : (
							<div className='py-4 text-center text-sm text-muted-foreground'>{emptyText}</div>
						)}

						{/* Load More Indicator */}
						{hasMore && onScrollToBottom && (
							<div className='flex items-center justify-center py-2 border-t'>
								{isLoadingMore ? (
									<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
								) : (
									<span className='text-xs text-muted-foreground'>
										Yana yuklash uchun pastga scroll qiling
									</span>
								)}
							</div>
						)}

						{/* Add New Option */}
						{searchValue.trim() &&
							!filteredOptions.some(
								(opt) =>
									opt.label.toLowerCase() === searchValue.toLowerCase() ||
									String(opt.value).toLowerCase() === searchValue.toLowerCase(),
							) &&
							allowCreate &&
							onCreateNew && (
								<button
									type='button'
									onClick={handleCreateNew}
									disabled={isCreating}
									className='w-full flex items-center justify-center space-x-2 py-2.5 px-2 text-sm text-primary hover:bg-accent rounded-lg transition-colors duration-200 font-medium border-t mt-1 pt-2 disabled:opacity-50'
								>
									{isCreating ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										<Plus className='h-4 w-4' />
									)}
									<span>
										{createText}: "{searchValue}"
									</span>
								</button>
							)}
					</div>
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
