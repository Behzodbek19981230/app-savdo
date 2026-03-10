import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useKorzinka } from '@/hooks/api/useKorzinka';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, Eye, Trash2, RotateCw, SearchIcon, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { orderHistoryService } from '@/services/orderHistory.service';
import { ORDER_HISTORY_KEYS } from '@/hooks/api/useOrderHistory';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useDeleteKorzinkaOrderHistory, useDeleteOrderHistory } from '@/hooks/api/useDeleteOrderHistory';
import { Input } from '@/components/ui/input';
import { Autocomplete } from '@/components/ui/autocomplete';
import { DateRangePicker } from '@/components/ui/date-picker';
import { useUsers } from '@/hooks/api/useUsers';
import { useClients } from '@/hooks/api/useClients';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import moment from 'moment';
import { formatCurrency } from '@/lib/utils';

const KorzinkaPage: React.FC = () => {
    const { selectedFilialId } = useAuthContext();

    // Applied filters (used for querying)
    const [search, setSearch] = useState<string>('');
    const [employee, setEmployee] = useState<number | null>(null);
    const [clientId, setClientId] = useState<number | null>(null);
    const [status, setStatus] = useState<string>('all'); // all | completed | not_completed
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

    // Form-level filters (user edits these but they won't apply until user clicks "Filter")
    const [formSearch, setFormSearch] = useState<string>('');
    const [formEmployee, setFormEmployee] = useState<number | null>(null);
    const [formClientId, setFormClientId] = useState<number | null>(null);
    const [formClientSearch, setFormClientSearch] = useState('');
    const [formStatus, setFormStatus] = useState<string>('all');
    const [formDateFrom, setFormDateFrom] = useState<Date | undefined>(undefined);
    const [formDateTo, setFormDateTo] = useState<Date | undefined>(undefined);

    // Client autocomplete state
    const [clientPage, setClientPage] = useState(1);
    const [clientOptions, setClientOptions] = useState<Array<{ value: number; label: string }>>([]);

    const { data: usersData } = useUsers({ limit: 1000, is_active: true });
    const users = usersData?.results || [];
    const userOptions = [{ value: 'all', label: 'Barchasi' }, ...users.map((u: any) => ({ value: u.id, label: u.full_name || u.username || `#${u.id}` }))];

    const {
        data: clientsData,
        isLoading: isClientsLoading,
        isFetching: isClientsFetching,
    } = useClients({
        page: clientPage,
        perPage: 50,
        search: formClientSearch || undefined,
        filial: selectedFilialId ?? undefined,
    });

    const clientsResults = (clientsData as any)?.results || [];
    const clientsPagination = (clientsData as any)?.pagination;
    const clientsHasMore = !!clientsPagination && clientsPagination.lastPage > (clientsPagination.currentPage || 1);

    useEffect(() => {
        const results = (clientsData as any)?.results || [];
        if (clientPage === 1) {
            setClientOptions(
                results.map((c: any) => ({ value: c.id, label: c.full_name || c.phone_number || `#${c.id}` })),
            );
        } else if (results.length > 0) {
            setClientOptions((prev) => [
                ...prev,
                ...results.map((c: any) => ({
                    value: c.id,
                    label: c.full_name || c.phone_number || `#${c.id}`,
                })),
            ]);
        }
    }, [clientsData, clientPage]);

    useEffect(() => {
        // reset pages/options when client search or filial changes
        setClientPage(1);
        setClientOptions([]);
    }, [formClientSearch, selectedFilialId]);

    const params: Record<string, unknown> = {
        filial: selectedFilialId ?? undefined,
    };
    if (search) params.search = search;
    if (employee) params.employee = employee;
    if (clientId) params.client = clientId;
    if (status === 'completed') params.order_status = true;
    if (status === 'not_completed') params.order_status = false;
    if (dateFrom) params.date_from = moment(dateFrom).format('YYYY-MM-DD');
    if (dateTo) params.date_to = moment(dateTo).format('YYYY-MM-DD');

    const { data, isLoading, error } = useKorzinka(params, true);
    const dateGroups = data?.results || data?.data || [];
    const navigate = useNavigate();
    const deleteMutation = useDeleteKorzinkaOrderHistory();

    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const [restoringId, setRestoringId] = useState<number | null>(null);

    const openDeleteDialog = (id: number) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const openRestoreDialog = (id: number) => {
        setRestoringId(id);
        setIsRestoreDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteMutation.mutateAsync(deletingId);
            setIsDeleteDialogOpen(false);
            setDeletingId(null);
        } catch (err) {
            // error toast handled by hook
        }
    };

    const handleRestore = async () => {
        if (!restoringId) return;
        try {
            await orderHistoryService.restoreKorzinka(restoringId);
            toast({ title: 'Qayta tiklandi', description: "Buyurtma buyurtmalarga qo'shildi", variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['korzinka'], exact: false });
            queryClient.invalidateQueries({ queryKey: ORDER_HISTORY_KEYS.all });
            setIsRestoreDialogOpen(false);
            setRestoringId(null);
        } catch (err: any) {
            console.error(err);
            toast({ title: 'Xatolik', description: err?.message || 'Qayta tiklashda xatolik', variant: 'destructive' });
        }
    };

    const handleFilter = () => {
        setSearch(formSearch);
        setEmployee(formEmployee);
        setClientId(formClientId);
        setStatus(formStatus);
        setDateFrom(formDateFrom);
        setDateTo(formDateTo);
    };

    const handleClear = () => {
        setFormSearch('');
        setFormEmployee(null);
        setFormClientId(null);
        setFormClientSearch('');
        setFormStatus('all');
        setFormDateFrom(undefined);
        setFormDateTo(undefined);

        setSearch('');
        setEmployee(null);
        setClientId(null);
        setStatus('all');
        setDateFrom(undefined);
        setDateTo(undefined);
    };

    return (
        <div className='space-y-6'>
            <Card>
                <CardHeader>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                        <CardTitle className='whitespace-nowrap'>Korzinka - Buyurtmalar</CardTitle>
                        <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-end gap-2 w-full'>

                            <div className='w-full sm:w-[260px]'>
                                <Autocomplete
                                    options={clientOptions}
                                    value={formClientId ?? undefined}
                                    onValueChange={(v) => setFormClientId(v ? Number(v) : null)}
                                    placeholder='Mijozni tanlang'
                                    searchPlaceholder='Mijoz qidirish...'
                                    emptyText='Mijoz topilmadi'
                                    onSearchChange={(q) => setFormClientSearch(q)}
                                    onScrollToBottom={() => {
                                        if (clientsHasMore) setClientPage(clientPage + 1);
                                    }}
                                    hasMore={clientsHasMore}
                                    isLoading={isClientsLoading}
                                    isLoadingMore={isClientsFetching}
                                    className='h-8'
                                />
                            </div>
                            <div className='w-full sm:w-auto'>
                                <Autocomplete
                                    options={userOptions}
                                    value={formEmployee ?? 'all'}
                                    onValueChange={(v) => setFormEmployee(v === 'all' ? null : Number(v))}
                                    placeholder='Xodim'
                                    className='w-full sm:min-w-[180px] h-8'
                                />
                            </div>
                            <div className='w-full sm:w-auto'>
                                <Autocomplete
                                    options={[
                                        { value: 'all', label: 'Barcha holatlar' },
                                        { value: 'completed', label: 'Yakunlangan' },
                                        { value: 'not_completed', label: 'Yakunlanmagan' },
                                    ]}
                                    value={formStatus}
                                    onValueChange={(v) => setFormStatus(String(v))}
                                    placeholder='Holat'
                                    className='w-full sm:min-w-[160px] h-8'
                                />
                            </div>
                            <div className='w-full sm:w-auto'>
                                <DateRangePicker
                                    dateFrom={formDateFrom}
                                    dateTo={formDateTo}
                                    onDateFromChange={(d) => setFormDateFrom(d)}
                                    onDateToChange={(d) => setFormDateTo(d)}
                                    className='[&>div>button]:h-8'
                                />
                            </div>
                            <div className='w-full sm:w-auto flex gap-2 items-center'>
                                <Button onClick={handleFilter} className='bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs px-3'>
                                    <SearchIcon className='h-3.5 w-3.5 mr-1' />
                                    Qidirish
                                </Button>
                                <Button
                                    variant='outline'
                                    onClick={handleClear}
                                    className='border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-8 text-xs px-3'
                                >
                                    <X className='h-3.5 w-3.5 mr-1' />
                                    Tozalash
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className='flex items-center justify-center py-10'>
                            <Loader2 className='h-8 w-8 animate-spin text-primary' />
                        </div>
                    ) : error ? (
                        <div className='text-red-600'>Korzinka ma'lumotlarini olishda xato</div>
                    ) : dateGroups.length === 0 ? (
                        <div className='text-muted-foreground text-center py-8'>Korzinkada buyurtma topilmadi</div>
                    ) : (
                        <div className='rounded-md border'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className='w-[60px]'>t/r</TableHead>
                                        <TableHead>Sanasi</TableHead>
                                        <TableHead>Mijoz</TableHead>
                                        <TableHead>Xodim</TableHead>
                                        <TableHead className='text-right'>Buyurtma summasi</TableHead>
                                        <TableHead>Holati</TableHead>
                                        <TableHead className='text-right'>Amallar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dateGroups.map((group: any, groupIdx: number) => {
                                        const totalSumma = group.items.reduce(
                                            (sum: number, item: any) =>
                                                sum + parseFloat(item.summa_total_dollar || '0'),
                                            0,
                                        );

                                        return (
                                            <>
                                                <TableRow
                                                    key={`summary-${group.date}`}
                                                    className='bg-muted/50 font-semibold'
                                                >
                                                    <TableCell></TableCell>
                                                    <TableCell>{moment(group.date).format('YYYY-MM-DD')}</TableCell>
                                                    <TableCell></TableCell>
                                                    <TableCell></TableCell>
                                                    <TableCell className='text-right'>
                                                        {formatCurrency(totalSumma)}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>

                                                {group.items.map((it: any, idx: number) => (
                                                    <TableRow
                                                        key={it.id}
                                                        className={it.order_status === false ? 'bg-red-50' : ''}
                                                    >
                                                        <TableCell className='font-medium'>{idx + 1}</TableCell>
                                                        <TableCell>
                                                            {it.created_time
                                                                ? moment(it.created_time).format('YYYY-MM-DD HH:mm')
                                                                : group.date}
                                                        </TableCell>
                                                        <TableCell>
                                                            {it.client_detail?.full_name || `#${it.client}`}
                                                        </TableCell>
                                                        <TableCell>{it.created_by_detail?.full_name || '-'}</TableCell>
                                                        <TableCell className='text-right text-blue-600 font-semibold'>
                                                            <Link to={`/order-history/${it.id}`}>
                                                                {formatCurrency(
                                                                    it.summa_total_dollar || it.all_product_summa || 0,
                                                                )}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell>
                                                            {it.is_karzinka ? (
                                                                <span className='px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs'>
                                                                    Korzinkada
                                                                </span>
                                                            ) : it.order_status ? (
                                                                <span className='px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs'>
                                                                    Yakunlangan
                                                                </span>
                                                            ) : (
                                                                <span className='px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs'>
                                                                    Yakunlanmagan
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className='text-right'>
                                                            <div className='flex items-center justify-end '>
                                                                <Button
                                                                    variant='ghost'
                                                                    size='icon'
                                                                    className=' text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                                                                    onClick={() => navigate(`/order-history/${it.id}`)}
                                                                >
                                                                    <Eye className='h-4 w-4' />
                                                                </Button>
                                                                {/* Restore from korzinka back to orders */}
                                                                <Button
                                                                    variant='ghost'
                                                                    size='icon'
                                                                    onClick={() => openRestoreDialog(it.id)}
                                                                    title='Qayta tiklash'
                                                                    className='text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                                                >
                                                                    <RotateCw className='h-4 w-4 ' />
                                                                </Button>
                                                                <Button
                                                                    variant='ghost'
                                                                    size='icon'
                                                                    onClick={() => openDeleteDialog(it.id)}
                                                                    className='text-destructive hover:text-destructive/80 hover:bg-destructive/10 dark:hover:bg-destructive/20'
                                                                >
                                                                    <Trash2 className='h-4 w-4' />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    {/* Restore Confirmation Modal */}
                    <AlertDialog open={isRestoreDialogOpen} onOpenChange={(open) => setIsRestoreDialogOpen(open)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Buyurtmani qayta tiklash</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ushbu buyurtmani yana buyurtmalar qatoriga qo'shmoqchimisiz?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRestore} disabled={false}>
                                    Qayta tiklash
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) setDeletingId(null);
                        }}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bu amalni qaytarib bo'lmaydi. Korzinkadan buyurtma o'chiriladi.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isLoading}>
                                    {deleteMutation.isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                                    O'chirish
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
};

export default KorzinkaPage;
