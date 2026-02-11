'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
    /** Backendga qidiruv: berilsa client-side filter o‘chadi, qidiruv onSearchChange orqali backendga yuboriladi */
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
    emptyText = 'Topilmadi',
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

    // Backend qidiruv: debounce
    React.useEffect(() => {
        if (!serverSearch) return;
        const t = setTimeout(() => {
            onSearchChange?.(searchValue.trim());
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [searchValue, serverSearch, onSearchChange]);

    // PopoverContent'ga wheel event listener qo'shish
    React.useEffect(() => {
        if (!open || !listRef.current) return;

        const listEl = listRef.current;
        const popoverEl = listEl.closest('[role="dialog"]') || listEl.closest('[data-radix-portal]')?.parentElement;

        if (!popoverEl) return;

        const handleWheelEvent = (e: WheelEvent) => {
            // Agar event CommandList ichida bo'lsa, tabiiy scroll ishlaydi
            if (listEl.contains(e.target as Node)) {
                // Faqat scroll oxiriga yetganda keyingi sahifani yuklash
                if (onScrollToBottom) {
                    const threshold = 60;
                    const checkScroll = () => {
                        if (listEl.scrollHeight - listEl.scrollTop <= listEl.clientHeight + threshold) {
                            onScrollToBottom();
                        }
                    };
                    setTimeout(checkScroll, 50);
                }
                return;
            }

            // Agar event PopoverContent ichida bo'lsa, CommandList'ga scroll qilish
            if (popoverEl.contains(e.target as Node)) {
                e.preventDefault();
                e.stopPropagation();

                // CommandList'ga scroll qilish
                listEl.scrollTop += e.deltaY;

                // Scroll oxiriga yetganda keyingi sahifani yuklash
                if (onScrollToBottom) {
                    const threshold = 60;
                    const checkScroll = () => {
                        if (listEl.scrollHeight - listEl.scrollTop <= listEl.clientHeight + threshold) {
                            onScrollToBottom();
                        }
                    };
                    setTimeout(checkScroll, 50);
                }
            }
        };

        popoverEl.addEventListener('wheel', handleWheelEvent, { passive: false });
        return () => {
            popoverEl.removeEventListener('wheel', handleWheelEvent);
        };
    }, [open, onScrollToBottom]);

    // Client-side filter faqat serverSearch bo‘lmaganda
    const filteredOptions = serverSearch
        ? options
        : options.filter((option) => option.label.toLowerCase().includes(searchValue.toLowerCase()));

    const handleCreateNew = async () => {
        if (!onCreateNew) return;

        // Agar search value bo'sh bo'lsa, dialogni ochmaslik
        if (!searchValue.trim()) {
            // Foydalanuvchi biror narsa kiritishini kutamiz
            return;
        }

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
        const el = e.currentTarget;
        if (!onScrollToBottom || !el) return;
        const threshold = 60;
        if (el.scrollHeight - el.scrollTop <= el.clientHeight + threshold) {
            onScrollToBottom();
        }
    };

    const handleWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (!el) return;

        // Scroll oxiriga yetganda keyingi sahifani yuklash
        if (onScrollToBottom) {
            const threshold = 60;
            // Wheel event scroll'dan keyin ishlaydi, shuning uchun kechikish bilan tekshiramiz
            const checkScroll = () => {
                if (el.scrollHeight - el.scrollTop <= el.clientHeight + threshold) {
                    onScrollToBottom();
                }
            };
            // Kichik kechikish bilan tekshirish
            setTimeout(checkScroll, 50);
        }
    }, [onScrollToBottom]);

    // PopoverContent'ga wheel event handler - CommandList'ga event'ni uzatish
    const handlePopoverWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        const el = listRef.current;
        if (!el) return;

        // CommandList'ga scroll qilish
        el.scrollTop += e.deltaY;

        // Scroll oxiriga yetganda keyingi sahifani yuklash
        if (onScrollToBottom) {
            const threshold = 60;
            const checkScroll = () => {
                if (el.scrollHeight - el.scrollTop <= el.clientHeight + threshold) {
                    onScrollToBottom();
                }
            };
            setTimeout(checkScroll, 50);
        }

        // Event propagation ni to'xtatish
        e.preventDefault();
        e.stopPropagation();
    }, [onScrollToBottom]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
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
            </PopoverTrigger>
            <PopoverContent
                className='w-[--radix-popover-trigger-width] p-0 overflow-hidden'
                align='start'
            >
                <Command shouldFilter={false} className='flex flex-col overflow-hidden'>
                    <CommandInput placeholder={searchPlaceholder} value={searchValue} onValueChange={setSearchValue} />
                    <CommandList
                        ref={listRef}
                        onScroll={handleScroll}
                        onWheel={handleWheel}
                        className="max-h-[400px] overflow-y-auto overflow-x-hidden"
                        style={{ maxHeight: '400px' }}
                    >
                        {filteredOptions.length === 0 && !allowCreate && !isLoading && (
                            <CommandEmpty>{emptyText}</CommandEmpty>
                        )}
                        <CommandGroup>
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={String(option.value)}
                                    onSelect={() => {
                                        onValueChange?.(option.value);
                                        setSearchValue('');
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mt-1 h-4 w-4 shrink-0",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />

                                    <span className="flex-1 min-w-0 whitespace-normal break-words">
                                        {option.label}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        {hasMore && (
                            <div className='flex items-center justify-center py-2 border-t'>
                                {isLoadingMore ? (
                                    <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                                ) : (
                                    <span className='text-xs text-muted-foreground'>Yana yuklash uchun pastga scroll qiling</span>
                                )}
                            </div>
                        )}
                        {allowCreate && (
                            <>
                                {filteredOptions.length > 0 && <CommandSeparator />}
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={handleCreateNew}
                                        disabled={isCreating || !searchValue.trim()}
                                        className={cn('text-primary', !searchValue.trim() && 'opacity-50')}
                                    >
                                        {isCreating ? (
                                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        ) : (
                                            <Plus className='mr-2 h-4 w-4' />
                                        )}
                                        {searchValue.trim() ? `${createText}: "${searchValue}"` : `${createText}...`}
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
