import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-picker';
import { useOrderHistory } from '@/hooks/api/useOrderHistory';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/api/useUsers';
import { Loader2, Eye, Package, SearchIcon, X } from 'lucide-react';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useClients } from '@/hooks/api/useClients';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 5;

export default function OrderHistoryPage() {
    const { selectedFilialId } = useAuthContext();
    const [page, setPage] = useState(1);

    // applied filters (used for querying)
    const [search, setSearch] = useState('');
    const [employee, setEmployee] = useState<number | null>(null);
    const [status, setStatus] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

    // form-level filters (user edits these but they won't apply until user clicks "Filter")
    const [formSearch, setFormSearch] = useState<string>('');
    const [formEmployee, setFormEmployee] = useState<number | null>(null);
    const [formStatus, setFormStatus] = useState<string>('all');
    const [formDateFrom, setFormDateFrom] = useState<Date | undefined>(undefined);
    const [formDateTo, setFormDateTo] = useState<Date | undefined>(undefined);

    const { data: usersData } = useUsers({ limit: 1000, is_active: true });
    const users = usersData?.results || [];

    // Client autocomplete state
    const [clientId, setClientId] = useState<number | null>(null); // applied client filter
    const [formClientId, setFormClientId] = useState<number | null>(null); // form value
    const [formClientSearch, setFormClientSearch] = useState('');
    const [clientPage, setClientPage] = useState(1);
    const [clientOptions, setClientOptions] = useState<Array<{ value: number; label: string }>>([]);

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
        if (clientPage === 1) {
            setClientOptions(
                clientsResults.map((c: any) => ({ value: c.id, label: c.full_name || c.phone_number || `#${c.id}` })),
            );
        } else if (clientsResults.length > 0) {
            setClientOptions((prev) => [
                ...prev,
                ...clientsResults.map((c: any) => ({
                    value: c.id,
                    label: c.full_name || c.phone_number || `#${c.id}`,
                })),
            ]);
        }
    }, [clientsData]);

    useEffect(() => {
        // reset pages/options when client search or filial changes
        setClientPage(1);
        setClientOptions([]);
    }, [formClientSearch, selectedFilialId]);

    // Build params
    const params: Record<string, unknown> = {
        page,
        limit: ITEMS_PER_PAGE,
        filial: selectedFilialId ?? undefined,
    };
    if (search) params.search = search;
    if (clientId) params.client = clientId;
    if (employee) params.employee = employee;
    if (status !== 'all') params.order_status = status === 'completed' ? true : false;
    if (dateFrom) params.date_from = moment(dateFrom).format('YYYY-MM-DD');
    if (dateTo) params.date_to = moment(dateTo).format('YYYY-MM-DD');

    const { data, isLoading } = useOrderHistory(params);

    const dateGroups = data?.results || [];
    const pagination = data?.pagination;
    const lastPage = pagination?.lastPage || 1;

    // Format currency helper
    const formatCurrency = (value: string | number | undefined) => {
        if (!value) return '0.00';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    // NOTE: We no longer auto-apply filters on change. Filters are applied when user clicks "Filter".

    const navigate = useNavigate();

    return (
        <div className='space-y-6'>
            <Card>
                <CardHeader>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                        <div>
                            <CardTitle className='text-2xl font-bold whitespace-nowrap'>Buyurtma tarixi</CardTitle>
                        </div>
                        <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-end gap-2 w-full'>
                            <div className='w-full sm:w-auto'>
                                <Input
                                    placeholder='Mijoz nomi yoki telefon'
                                    value={formSearch}
                                    onChange={(e) => setFormSearch(e.target.value)}
                                    className='w-full sm:min-w-[220px]'
                                />
                            </div>

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
                                        if (clientsHasMore) setClientPage((p) => p + 1);
                                    }}
                                    hasMore={clientsHasMore}
                                    isLoading={isClientsLoading}
                                    isLoadingMore={isClientsFetching}
                                />
                            </div>

                            <div className='w-full sm:w-auto'>
                                <Select
                                    onValueChange={(v) => setFormEmployee(v && v !== '0' ? Number(v) : null)}
                                    value={formEmployee ? String(formEmployee) : '0'}
                                >
                                    <SelectTrigger className='w-full sm:min-w-[180px]'>
                                        <SelectValue placeholder='Barcha xodimlar' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='0'>Barcha xodimlar</SelectItem>
                                        {users.map((u: any) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.full_name || u.username}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className='w-full sm:w-auto'>
                                <Select onValueChange={(v) => setFormStatus(v)} value={formStatus}>
                                    <SelectTrigger className='w-full sm:min-w-[140px]'>
                                        <SelectValue placeholder='Barcha holatlar' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='all'>Barchasi</SelectItem>
                                        <SelectItem value='completed'>Yakunlangan</SelectItem>
                                        <SelectItem value='pending'>Korzinkada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className='w-full sm:w-auto'>
                                <DateRangePicker
                                    dateFrom={formDateFrom}
                                    dateTo={formDateTo}
                                    onDateFromChange={(d) => setFormDateFrom(d)}
                                    onDateToChange={(d) => setFormDateTo(d)}
                                />
                            </div>
                            <div className='w-full sm:w-auto flex gap-2 items-center'>
                                <Button
                                    onClick={() => {
                                        // apply form filters
                                        setSearch(formSearch);
                                        setClientId(formClientId);
                                        setEmployee(formEmployee);
                                        setStatus(formStatus);
                                        setDateFrom(formDateFrom);
                                        setDateTo(formDateTo);
                                        setPage(1);
                                    }}
                                    className='bg-blue-600 hover:bg-blue-700 text-white'
                                >
                                    <SearchIcon className='h-4 w-4' />
                                    Qidirish
                                </Button>
                                <Button
                                    variant='outline'
                                    onClick={() => {
                                        // clear both form and applied filters
                                        setFormSearch('');
                                        setFormClientId(null);
                                        setFormEmployee(null);
                                        setFormStatus('all');
                                        setFormDateFrom(undefined);
                                        setFormDateTo(undefined);

                                        setSearch('');
                                        setClientId(null);
                                        setEmployee(null);
                                        setStatus('all');
                                        setDateFrom(undefined);
                                        setDateTo(undefined);
                                        setClientOptions([]);
                                        setPage(1);
                                    }}
                                    className='border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                                >
                                    <X className='h-4 w-4' />
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
                    ) : dateGroups.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-10 text-center'>
                            <Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
                            <p className='text-muted-foreground'>Buyurtmalar topilmadi</p>
                        </div>
                    ) : (
                        <div className='rounded-md border'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className='w-[60px]'>t/r</TableHead>

                                        <TableHead>Sanasi</TableHead>
                                        <TableHead>Mijoz</TableHead>
                                        <TableHead>Xodim</TableHead>
                                        <TableHead className='text-right'>Zakaz (summa)</TableHead>
                                        <TableHead className='text-right'>To'langan</TableHead>
                                        <TableHead className='text-right'>Qarz</TableHead>
                                        <TableHead className='text-right'>Umumiy qarz</TableHead>
                                        <TableHead>Holati</TableHead>
                                        <TableHead className='text-right'>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dateGroups.map((group: any, groupIdx: number) => {
                                        // Calculate totals for this date group
                                        const totalSumma = group.items.reduce(
                                            (sum: number, item: any) =>
                                                sum + parseFloat(item.summa_total_dollar || '0'),
                                            0,
                                        );
                                        const totalPaid = group.items.reduce((sum: number, item: any) => {
                                            const paid =
                                                parseFloat(item.summa_dollar || '0') +
                                                parseFloat(item.summa_naqt || '0') +
                                                parseFloat(item.summa_kilik || '0') +
                                                parseFloat(item.summa_terminal || '0') +
                                                parseFloat(item.summa_transfer || '0');
                                            return sum + paid;
                                        }, 0);
                                        const totalQarz = group.items.reduce((sum: number, item: any) => {
                                            const paid =
                                                parseFloat(item.summa_dollar || '0') +
                                                parseFloat(item.summa_naqt || '0') +
                                                parseFloat(item.summa_kilik || '0') +
                                                parseFloat(item.summa_terminal || '0') +
                                                parseFloat(item.summa_transfer || '0');
                                            const qarz = parseFloat(item.summa_total_dollar || '0') - paid;
                                            return sum + qarz;
                                        }, 0);
                                        const totalDebt = group.items.reduce(
                                            (sum: number, item: any) => sum + parseFloat(item.total_debt_client || '0'),
                                            0,
                                        );

                                        return (
                                            <>
                                                {/* Summary Row */}
                                                <TableRow
                                                    key={`summary-${group.date}`}
                                                    className='bg-muted/50 font-semibold'
                                                >
                                                    <TableCell>
                                                        <div className='flex items-center gap-2'>
                                                            <Badge>{group.count}</Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className='font-semibold'>
                                                        {moment(group.date).format('YYYY-MM-DD')}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                    <TableCell></TableCell>
                                                    <TableCell className='text-right font-semibold'>
                                                        {formatCurrency(totalSumma)}
                                                    </TableCell>
                                                    <TableCell className='text-right font-semibold'>
                                                        {formatCurrency(totalPaid)}
                                                    </TableCell>
                                                    <TableCell className='text-right font-semibold'>
                                                        {formatCurrency(totalQarz)}
                                                    </TableCell>
                                                    <TableCell className='text-right font-semibold'>
                                                        {formatCurrency(totalDebt)}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                                {/* Order Items */}
                                                {group.items.map((it: any, idx: number) => {
                                                    const paid =
                                                        parseFloat(it.summa_dollar || '0') +
                                                        parseFloat(it.summa_naqt || '0') +
                                                        parseFloat(it.summa_kilik || '0') +
                                                        parseFloat(it.summa_terminal || '0') +
                                                        parseFloat(it.summa_transfer || '0');
                                                    const qarz = parseFloat(it.summa_total_dollar || '0') - paid;

                                                    return (
                                                        <TableRow
                                                            key={it.id}
                                                            className={
                                                                it.order_status === false
                                                                    ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                    : ''
                                                            }
                                                        >
                                                            <TableCell className='font-medium'>
                                                                {group.items.length - idx}
                                                            </TableCell>
                                                            <TableCell>
                                                                {it.created_time
                                                                    ? moment(it.created_time).format('YYYY-MM-DD HH:mm')
                                                                    : group.date}
                                                            </TableCell>
                                                            <TableCell>
                                                                {it.client_detail?.full_name || `#${it.client}`}
                                                            </TableCell>
                                                            <TableCell>
                                                                {it.created_by_detail?.full_name || '-'}
                                                            </TableCell>
                                                            <TableCell className='text-right text-blue-600 font-semibold'>
                                                                <Link to={`/order-history/${it.id}`}>
                                                                    {formatCurrency(it.summa_total_dollar)}
                                                                </Link>
                                                            </TableCell>
                                                            <TableCell className='text-right'>
                                                                {formatCurrency(paid)}
                                                            </TableCell>
                                                            <TableCell className='text-right'>
                                                                {formatCurrency(qarz)}
                                                            </TableCell>
                                                            <TableCell className='text-right'>
                                                                {formatCurrency(it.total_debt_client)}
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
                                                                    <span className='px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs dark:bg-red-900 dark:text-red-200'>
                                                                        Yakunlanmagan
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className='text-right'>
                                                                <div className='flex items-center justify-end gap-1'>
                                                                    <Button
                                                                        variant='ghost'
                                                                        size='icon'
                                                                        onClick={() =>
                                                                            navigate(`/order-history/${it.id}`)
                                                                        }
                                                                    >
                                                                        <Eye className='h-4 w-4' />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {/* Pagination */}
                    {!isLoading && dateGroups.length > 0 && lastPage > 1 && (
                        <div className='mt-4 flex justify-center'>
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setPage(Math.max(1, page - 1))}
                                            className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                                        />
                                    </PaginationItem>
                                    {[...Array(Math.min(5, lastPage))].map((_, i) => {
                                        let pageNum: number;
                                        if (lastPage <= 5) pageNum = i + 1;
                                        else if (page <= 3) pageNum = i + 1;
                                        else if (page >= lastPage - 2) pageNum = lastPage - 4 + i;
                                        else pageNum = page - 2 + i;
                                        return (
                                            <PaginationItem key={pageNum}>
                                                <PaginationLink
                                                    onClick={() => setPage(pageNum)}
                                                    isActive={pageNum === page}
                                                >
                                                    {pageNum}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setPage(Math.min(lastPage, page + 1))}
                                            className={page === lastPage ? 'pointer-events-none opacity-50' : ''}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
