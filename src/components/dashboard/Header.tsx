import { Bell, Calendar, Menu, Pencil, DollarSign, Loader2, Building2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, LogOut } from 'lucide-react';
import { useLogout } from '@/hooks/api/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useExchangeRates, useCreateExchangeRate, useUpdateExchangeRate } from '@/hooks/api/useExchangeRate';
import type { ExchangeRate } from '@/types/exchangeRate';
import { useCompanies, useNotes, useUpdateNote } from '@/hooks/api';
import moment from 'moment';
import { Label } from '../ui/label';
import { authService, type NoteItem } from '@/services';

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const [today, setToday] = useState(new Date());
    const [isExchangeDialogOpen, setIsExchangeDialogOpen] = useState(false);
    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
    const [dollarValue, setDollarValue] = useState<number | undefined>(undefined);
    const { selectedFilialId, setSelectedFilialId } = useAuthContext();

    const user = authService.getStoredUser();
    const { mutate: logout } = useLogout();

    // Filiallar ro'yxati

    // Admin role borligini tekshirish
    const isAdmin = user?.role_detail?.some((role) => role.key === 'admin') || false;
    const isManager = user?.role_detail?.some((role) => role.key === 'manager') || false;
    const isSuperAdmin = user?.role_detail?.some((role) => role.key === 'super_admin') || false;

    const createExchangeRate = useCreateExchangeRate();
    const updateExchangeRate = useUpdateExchangeRate();
    const updateNote = useUpdateNote();
    const isMutating = createExchangeRate.isPending || updateExchangeRate.isPending;

    const { data: filialsData } = useCompanies();
    const { data: notesData, refetch: refetchNotes } = useNotes({
        params: {
            is_read: false,
        },
    });
    const unreadNotesCount = (notesData || []).filter((note) => note.is_read === false).length;
    const sortedNotes = useMemo(() => {
        return [...(notesData || [])].sort((a, b) => {
            const aUnread = a.is_read === false ? 0 : 1;
            const bUnread = b.is_read === false ? 0 : 1;
            if (aUnread !== bUnread) return aUnread - bUnread;
            const aTime = new Date(a.date || a.updated_at || a.created_at || 0).getTime();
            const bTime = new Date(b.date || b.updated_at || b.created_at || 0).getTime();
            return bTime - aTime;
        });
    }, [notesData]);
    const filials = !isSuperAdmin ? user?.filials_detail || [] : filialsData?.results || [];
    // Tanlangan filial yoki birinchi filial (default: birinchi filial)
    const userFilialId = selectedFilialId || filials[0]?.id || user?.companies?.[0];

    // Tanlangan filial ma'lumotlari (default: birinchi filial)
    const selectedFilial = filials.find((f) => f.id === userFilialId) || filials[0];
    // Tanlangan filial bo'yicha exchange rate olish
    const { data: exchangeRatesData, isLoading: isExchangeLoading } = useExchangeRates(
        userFilialId ? { filial: userFilialId } : undefined,
    );
    // Filialga tegishli exchange rate
    const currentExchangeRate: ExchangeRate | null = exchangeRatesData?.results?.[0] || null;

    useEffect(() => {
        const interval = setInterval(() => {
            setToday(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const openExchangeDialog = () => {
        setDollarValue(Number(currentExchangeRate?.dollar) || 0);
        setIsExchangeDialogOpen(true);
    };

    const handleSaveExchangeRate = async () => {
        if (!userFilialId) return;
        const dollar = dollarValue ? Number(dollarValue) : NaN;
        if (isNaN(dollar) || dollar <= 0) return;

        try {
            if (currentExchangeRate) {
                await updateExchangeRate.mutateAsync({
                    id: currentExchangeRate.id,
                    data: { dollar },
                });
            } else {
                await createExchangeRate.mutateAsync({
                    filial: userFilialId,
                    dollar,
                });
            }
            setIsExchangeDialogOpen(false);
        } catch {
            // handled in hook toast
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('uz-UZ').format(value);
    };

    const formatNoteDate = (rawDate?: string) => {
        if (!rawDate) return '-';
        const date = new Date(rawDate);
        if (Number.isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('uz-UZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const buildNotePayload = (note: NoteItem, overrides?: Partial<NoteItem>) => ({
        sorting: note.sorting ?? 0,
        date: overrides?.date || note.date || new Date().toISOString(),
        title: overrides?.title || note.title || '',
        text: overrides?.text || note.text || '',
        status: overrides?.status || note.status || 'new',
        is_read: overrides?.is_read ?? note.is_read ?? false,
        is_delete: overrides?.is_delete ?? note.is_delete ?? false,
    });

    const handleOpenNote = async (note: NoteItem) => {
        const toggledIsRead = !(note.is_read === true);
        try {
            await updateNote.mutateAsync({
                id: note.id,
                payload: buildNotePayload(note, { is_read: toggledIsRead }),
            });
            setSelectedNote({ ...note, is_read: toggledIsRead });
            void refetchNotes();
        } catch {
            setSelectedNote(note);
            void refetchNotes();
        }
        setIsNoteDialogOpen(true);
    };

    const handleDoneNote = async () => {
        if (!selectedNote) return;
        await updateNote.mutateAsync({
            id: selectedNote.id,
            payload: buildNotePayload(selectedNote, { status: 'done', is_read: true }),
        });
        setSelectedNote((prev) => (prev ? { ...prev, status: 'done', is_read: true } : prev));
    };

    return (
        <>
            <header className='flex-shrink-0 flex items-center justify-between bg-background border-b border-border px-4 lg:px-6 py-3 lg:py-4 lg:pb-3'>
                <div className='flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1'>
                    {/* Mobile Menu Button */}
                    <Button
                        variant='ghost'
                        size='icon'
                        onClick={onMenuClick}
                        className='lg:hidden flex-shrink-0 h-10 w-10'
                    >
                        <Menu className='h-5 w-5' />
                    </Button>

                    <div className='flex flex-col gap-1 min-w-0'>
                        <h2 className='text-base sm:text-lg font-semibold tracking-[0.2px] text-foreground truncate'>
                            Xush kelibsiz! 👋
                        </h2>
                        <div className='flex items-center gap-3'>
                            <p className='text-xs text-muted-foreground hidden sm:flex items-center gap-2 truncate'>
                                <Calendar className='h-3.5 w-3.5 flex-shrink-0' />
                                <span className='truncate'>{moment(today).format('DD.MM.YYYY HH:mm:ss')}</span>
                            </p>
                        </div>
                    </div>
                    {/* Dollar kursi */}
                    <div className='hidden sm:flex items-center gap-1.5 text-lg'>
                        <DollarSign className='h-3.5 w-3.5 text-green-600' />
                        <span className='font-medium text-foreground'>
                            {isExchangeLoading ? (
                                <Loader2 className='h-3 w-3 animate-spin' />
                            ) : currentExchangeRate ? (
                                `${formatCurrency(currentExchangeRate.dollar)} so'm`
                            ) : (
                                "Kurs yo'q"
                            )}
                        </span>
                        {(isAdmin || isManager || isSuperAdmin) && (
                            <Button
                                variant='ghost'
                                size='icon'
                                className='h-5 w-5 p-0 hover:bg-muted'
                                onClick={openExchangeDialog}
                            >
                                <Pencil className='h-3 w-3 text-muted-foreground' />
                            </Button>
                        )}
                    </div>
                </div>

                <div className='flex items-center gap-2 lg:gap-2.5 flex-shrink-0'>
                    {/* Mobile dollar kursi button - faqat Admin va Manager uchun tahrirlash */}
                    {(isAdmin || isManager || isSuperAdmin) && (
                        <Button
                            variant='outline'
                            size='icon'
                            className='sm:hidden h-10 w-10 rounded-xl shadow-sm'
                            onClick={openExchangeDialog}
                        >
                            <DollarSign className='h-4 w-4' />
                        </Button>
                    )}

                    {/* Filial tanlash dropdown */}
                    {filials.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant='outline'
                                    className='hidden md:flex items-center gap-2 h-10 px-3 rounded-xl shadow-sm min-w-[160px] max-w-[280px]'
                                >
                                    {selectedFilial?.logo ? (
                                        <img
                                            src={`${import.meta.env.VITE_FILE_BASE_URL}/` + selectedFilial.logo}
                                            alt={selectedFilial.name}
                                            className='h-5 w-5 rounded-sm object-cover flex-shrink-0'
                                        />
                                    ) : (
                                        <Building2 className='h-4 w-4 flex-shrink-0' />
                                    )}
                                    <span className='truncate text-sm'>{selectedFilial?.name || 'Filial tanlang'}</span>
                                    {filials.length > 1 && <ChevronDown className='h-4 w-4 flex-shrink-0 ml-auto' />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-[220px]'>
                                {filials.map((filial) => (
                                    <DropdownMenuItem
                                        key={filial.id}
                                        onClick={() => setSelectedFilialId(filial.id)}
                                        className='flex items-center gap-2 cursor-pointer'
                                    >
                                        {filial.logo ? (
                                            <img
                                                src={`${import.meta.env.VITE_FILE_BASE_URL}/` + filial.logo}
                                                alt={filial.name}
                                                className='h-5 w-5 rounded-sm object-cover flex-shrink-0'
                                            />
                                        ) : (
                                            <Building2 className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
                                        )}
                                        <span className='truncate flex-1'>{filial.name}</span>
                                        {filial.id === userFilialId && (
                                            <Check className='h-4 w-4 text-primary flex-shrink-0' />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Mobile uchun filial tanlash */}
                    {filials.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant='outline'
                                    size='icon'
                                    className='md:hidden h-10 w-10 rounded-xl shadow-sm overflow-hidden'
                                >
                                    {selectedFilial?.logo ? (
                                        <img
                                            src={selectedFilial.logo}
                                            alt={selectedFilial.name}
                                            className='h-6 w-6 rounded-sm object-cover'
                                        />
                                    ) : (
                                        <Building2 className='h-4 w-4' />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-[200px]'>
                                {filials.map((filial) => (
                                    <DropdownMenuItem
                                        key={filial.id}
                                        onClick={() => setSelectedFilialId(filial.id)}
                                        className='flex items-center gap-2 cursor-pointer'
                                    >
                                        {filial.logo ? (
                                            <img
                                                src={filial.logo}
                                                alt={filial.name}
                                                className='h-5 w-5 rounded-sm object-cover flex-shrink-0'
                                            />
                                        ) : (
                                            <Building2 className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
                                        )}
                                        <span className='truncate flex-1'>{filial.name}</span>
                                        {filial.id === userFilialId && (
                                            <Check className='h-4 w-4 text-primary flex-shrink-0' />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant='outline' size='icon' className='relative h-10 w-10 rounded-xl shadow-sm'>
                                <Bell className='h-[18px] w-[18px]' />
                                {unreadNotesCount > 0 && (
                                    <span className='absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-extrabold text-destructive-foreground border-2 border-background'>
                                        {unreadNotesCount > 99 ? '99+' : unreadNotesCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-[340px] p-1.5'>
                            <p className='px-2 py-1.5 text-xs font-semibold text-muted-foreground'>Bildirishnomalar</p>
                            <div className='max-h-[360px] overflow-y-auto'>
                                {sortedNotes.length === 0 ? (
                                    <p className='px-2 py-4 text-sm text-muted-foreground text-center'>
                                        Hozircha bildirishnoma yo&apos;q
                                    </p>
                                ) : (
                                    sortedNotes.slice(0, 12).map((note) => (
                                        <DropdownMenuItem
                                            key={note.id}
                                            className='cursor-pointer rounded-xl border border-border/60 bg-card/70 p-0 focus:bg-accent/40'
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                if (note.is_read === false) {
                                                    void handleOpenNote(note);
                                                }
                                            }}
                                        >
                                            <div className='w-full p-2.5'>
                                                <div className='w-full flex items-start justify-between gap-2'>
                                                    <p className='text-sm font-semibold leading-5 line-clamp-1'>
                                                        {note.title || 'Sarlavha'}
                                                    </p>
                                                    <span
                                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${note.is_read === false
                                                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                                                            : 'bg-muted text-muted-foreground'
                                                            }`}
                                                    >
                                                        {note.is_read === false ? "Yangi" : "O'qilgan"}
                                                    </span>
                                                </div>
                                                <p className='mt-1 text-xs text-muted-foreground line-clamp-2'>
                                                    {note.text || "Matn yo'q"}
                                                </p>
                                                <div className='mt-2 flex items-center justify-between'>
                                                    <p className='text-[11px] text-muted-foreground'>{formatNoteDate(note.date)}</p>
                                                    <span className='text-[11px] text-muted-foreground'>
                                                        {note.status === 'done'
                                                            ? 'Bajarilgan'
                                                            : note.status === 'expired'
                                                                ? "Muddati o'tgan"
                                                                : 'Yangi'}
                                                    </span>
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <ThemeToggle />

                    {/* User Profile Dropdown */}
                    <div className='flex items-center gap-2 px-2 py-1 rounded-xl border border-border bg-foreground/[0.04] dark:bg-white/[0.03] hover:bg-foreground/[0.06] transition-colors'>
                        {user?.avatar ? (
                            <img
                                src={`${import.meta.env.VITE_FILE_BASE_URL}/` + user.avatar}
                                alt={user.fullname}
                                className='h-[34px] w-[34px] rounded-full object-cover border-2 border-primary/[0.22] flex-shrink-0'
                            />
                        ) : (
                            <div className='flex h-[34px] w-[34px] items-center justify-center rounded-full bg-primary/[0.18] border border-primary/[0.22] flex-shrink-0'>
                                <span className='text-[13px] font-black text-primary'>
                                    {user?.fullname?.charAt(0) || user?.username?.charAt(0) || 'U'}
                                </span>
                            </div>
                        )}
                        <div className='min-w-0 text-left hidden md:block'>
                            <p className='text-[13px] font-semibold text-sidebar-foreground truncate'>
                                {user?.fullname || user?.username || 'Foydalanuvchi'}
                            </p>
                            <p className='text-xs text-muted-foreground truncate'>
                                {user?.role_detail?.[0]?.name || user?.email || 'Manager'}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Dollar kursi dialog - faqat Admin uchun tahrirlash mumkin */}
            <Dialog open={isExchangeDialogOpen} onOpenChange={setIsExchangeDialogOpen}>
                <DialogContent className='sm:max-w-[400px]'>
                    <DialogHeader>
                        <DialogTitle>Dollar kursi</DialogTitle>
                        <DialogDescription>
                            {isAdmin || isManager || isSuperAdmin
                                ? 'Bugungi dollar kursini kiriting'
                                : 'Joriy dollar kursi'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='grid gap-4 py-4'>
                        <div className='grid gap-2'>
                            <Label htmlFor='dollar'>1 USD = ? UZS</Label>
                            <Input
                                id='dollar'
                                type='number'
                                placeholder='Masalan: 12500'
                                value={dollarValue}
                                onChange={(e) => {
                                    const intValue = e.target.value;
                                    setDollarValue(Number(intValue));
                                }}
                                min={0}
                                step={1}
                                disabled={!(isAdmin || isManager || isSuperAdmin)}
                                readOnly={!(isAdmin || isManager || isSuperAdmin)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setIsExchangeDialogOpen(false)}>
                            {isAdmin || isManager || isSuperAdmin ? 'Bekor qilish' : 'Yopish'}
                        </Button>
                        {(isAdmin || isManager || isSuperAdmin) && (
                            <Button onClick={handleSaveExchangeRate} disabled={isMutating || !dollarValue}>
                                {isMutating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                                Saqlash
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogContent className='sm:max-w-[560px]'>
                    <DialogHeader>
                        <DialogTitle>{selectedNote?.title || 'Eslatma'}</DialogTitle>
                        <DialogDescription>
                            {selectedNote ? formatNoteDate(selectedNote.date) : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-3'>
                        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                            <span>
                                Muallif: {selectedNote?.created_by_detail?.full_name || selectedNote?.author_name || '—'}
                            </span>
                            <span>•</span>
                            <span>
                                Status:{' '}
                                {selectedNote?.status === 'done'
                                    ? 'Bajarilgan'
                                    : selectedNote?.status === 'expired'
                                        ? "Muddati o'tgan"
                                        : 'Yangi'}
                            </span>
                        </div>
                        <div className='rounded-lg border border-border bg-card p-3 text-sm leading-6 whitespace-pre-wrap'>
                            {selectedNote?.text || "Matn yo'q"}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setIsNoteDialogOpen(false)}>
                            Yopish
                        </Button>
                        {selectedNote?.status !== 'done' && (
                            <Button onClick={handleDoneNote} disabled={updateNote.isPending}>
                                {updateNote.isPending ? 'Saqlanmoqda...' : 'Bajarildi'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
