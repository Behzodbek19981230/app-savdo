/**
 * PurchaseInvoices Page
 * /purchase-invoices
 * Tovar kirimi (fakturalar) ro'yxati
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Autocomplete } from '@/components/ui/autocomplete';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    usePurchaseInvoices,
    useDeletePurchaseInvoice,
    useCreatePurchaseInvoice,
} from '@/hooks/api/usePurchaseInvoice';
import { useSuppliers } from '@/hooks/api/useSupplier';
import { useSklads } from '@/hooks/api/useSklad';
import { useAuthContext } from '@/contexts/AuthContext';
import type { PurchaseInvoice } from '@/types/purchaseInvoice';
import { PurchaseInvoiceType, PurchaseInvoiceTypeLabels, CreatePurchaseInvoicePayload } from '@/types/purchaseInvoice';
import { DateRangePicker } from '@/components/ui/date-picker';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Loader2,
    Plus,
    Trash2,
    Eye,
    Package,
    ArrowDownCircle,
    Edit,
    ShoppingBag,
} from 'lucide-react';
import moment from 'moment';

const ITEMS_PER_PAGE = 10;

type SortField = 'date' | 'all_product_summa' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

// Modal form schema: Tashqi = sana + supplier, Ichki = sana + sklad_outgoing + sklad (validation by tab in submit)
const newInvoiceSchema = z.object({
    date: z.string().min(1, 'Sana tanlanishi shart'),
    supplier: z.coerce.number().min(0).optional(),
    sklad_outgoing: z.coerce.number().min(0).optional(),
    sklad: z.coerce.number().min(0).optional(),
});

type NewInvoiceFormData = z.infer<typeof newInvoiceSchema>;

type InvoiceTabType = PurchaseInvoiceType.EXTERNAL | PurchaseInvoiceType.INTERNAL;

const TAB_PARAM = 'type';

export default function PurchaseInvoices() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, selectedFilialId } = useAuthContext();

    const typeParam = searchParams.get(TAB_PARAM);
    const activeTab: InvoiceTabType =
        typeParam === PurchaseInvoiceType.INTERNAL || typeParam === PurchaseInvoiceType.EXTERNAL
            ? typeParam
            : PurchaseInvoiceType.EXTERNAL;

    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
    const [isNewInvoiceDialogOpen, setIsNewInvoiceDialogOpen] = useState(false);
    const [supplierFilterId, setSupplierFilterId] = useState<number | undefined>(undefined);
    const [skladOutgoingFilterId, setSkladOutgoingFilterId] = useState<number | undefined>(undefined);

    // Supplier autocomplete state
    const [supplierPage, setSupplierPage] = useState(1);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierOptions, setSupplierOptions] = useState<Array<{ value: number; label: string }>>([]);

    // Sklad autocomplete state (chiquvchi ombor uchun)
    const [skladPage, setSkladPage] = useState(1);
    const [skladSearch, setSkladSearch] = useState('');
    const [skladOptions, setSkladOptions] = useState<Array<{ value: number; label: string }>>([]);

    // Sklad autocomplete state (kiruvchi ombor uchun)
    const [skladIncomingPage, setSkladIncomingPage] = useState(1);
    const [skladIncomingSearch, setSkladIncomingSearch] = useState('');
    const [skladIncomingOptions, setSkladIncomingOptions] = useState<Array<{ value: number; label: string }>>([]);

    // New invoice form (type = activeTab when opening modal)
    const newInvoiceForm = useForm<NewInvoiceFormData>({
        resolver: zodResolver(newInvoiceSchema),
        defaultValues: {
            date: moment().format('YYYY-MM-DD'),
            supplier: 0,
            sklad_outgoing: 0,
            sklad: 0,
        },
    });

    // Watch form values to filter options
    const selectedSkladOutgoing = newInvoiceForm.watch('sklad_outgoing');
    const selectedSklad = newInvoiceForm.watch('sklad');

    // Data fetching for modal
    const {
        data: suppliersData,
        isLoading: isSuppliersLoading,
        isFetching: isSuppliersFetching,
    } = useSuppliers({
        page: supplierPage,
        limit: 50,
        search: supplierSearch || undefined,
        is_delete: false,
        filial: selectedFilialId ?? undefined,
    });

    const {
        data: skladsData,
        isLoading: isSkladsLoading,
        isFetching: isSkladsFetching,
    } = useSklads({
        page: skladPage,
        perPage: 50,
        search: skladSearch || undefined,
        is_delete: false,
        filial: selectedFilialId ?? undefined,
    });

    const {
        data: skladsIncomingData,
        isLoading: isSkladsIncomingLoading,
        isFetching: isSkladsIncomingFetching,
    } = useSklads({
        page: skladIncomingPage,
        perPage: 50,
        search: skladIncomingSearch || undefined,
        is_delete: false,
        filial: selectedFilialId ?? undefined,
    });

    // Filter ro'yxatlari (ta'minotchi / ombor bo'yicha)
    const { data: suppliersListData } = useSuppliers({
        limit: 300,
        is_delete: false,
        filial: selectedFilialId ?? undefined,
    });
    const { data: skladsListData } = useSklads({
        perPage: 300,
        is_delete: false,
        filial: selectedFilialId ?? undefined,
    });
    const filterSuppliers = (suppliersListData as { results?: { id: number; name: string }[] })?.results || [];
    const filterSklads = (skladsListData as { results?: { id: number; name: string }[] })?.results || [];

    const suppliersResults = (suppliersData as any)?.results || [];
    const suppliersPagination = (suppliersData as any)?.pagination;
    const suppliersHasMore =
        !!suppliersPagination && suppliersPagination.lastPage > (suppliersPagination.currentPage || 1);

    const skladsResults = (skladsData as any)?.results || [];
    const skladsPagination = (skladsData as any)?.pagination;
    const skladsHasMore = !!skladsPagination && skladsPagination.lastPage > (skladsPagination.currentPage || 1);

    const skladsIncomingResults = (skladsIncomingData as any)?.results || [];
    const skladsIncomingPagination = (skladsIncomingData as any)?.pagination;
    const skladsIncomingHasMore = !!skladsIncomingPagination && skladsIncomingPagination.lastPage > (skladsIncomingPagination.currentPage || 1);

    // API dan kelgan ma'lumotni doim options ga yozamiz (ro'yxat doim chiqib tursin)
    useEffect(() => {
        const results = (suppliersData as any)?.results || [];
        const opts = results.map((s: any) => ({ value: s.id, label: s.name || `#${s.id}` }));
        if (supplierPage === 1) {
            setSupplierOptions(opts);
        } else if (opts.length > 0) {
            setSupplierOptions((prev) => [...prev, ...opts]);
        }
    }, [suppliersData, supplierPage]);

    useEffect(() => {
        const results = (skladsData as any)?.results || [];
        const opts = results.map((s: any) => ({ value: s.id, label: s.name || `#${s.id}` }));
        if (skladPage === 1) {
            setSkladOptions(opts);
        } else if (opts.length > 0) {
            setSkladOptions((prev) => [...prev, ...opts]);
        }
    }, [skladsData, skladPage]);

    useEffect(() => {
        const results = (skladsIncomingData as any)?.results || [];
        const opts = results.map((s: any) => ({ value: s.id, label: s.name || `#${s.id}` }));
        if (skladIncomingPage === 1) {
            setSkladIncomingOptions(opts);
        } else if (opts.length > 0) {
            setSkladIncomingOptions((prev) => [...prev, ...opts]);
        }
    }, [skladsIncomingData, skladIncomingPage]);

    // Sahifa 1 qilamiz; ro'yxatni faqat foydalanuvchi qidirganda tozalamaymiz (bo'sh qidiruvda doim chiqib tursin)
    useEffect(() => {
        setSupplierPage(1);
        if (supplierSearch.trim()) setSupplierOptions([]);
    }, [supplierSearch, selectedFilialId]);

    useEffect(() => {
        setSkladPage(1);
        if (skladSearch.trim()) setSkladOptions([]);
    }, [skladSearch, selectedFilialId]);

    useEffect(() => {
        setSkladIncomingPage(1);
        if (skladIncomingSearch.trim()) setSkladIncomingOptions([]);
    }, [skladIncomingSearch, selectedFilialId]);

    const createPurchaseInvoice = useCreatePurchaseInvoice();

    const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;

    const { data, isLoading } = usePurchaseInvoices({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        ordering,
        type: activeTab,
        supplier: activeTab === PurchaseInvoiceType.EXTERNAL ? supplierFilterId : undefined,
        sklad_outgoing: activeTab === PurchaseInvoiceType.INTERNAL ? skladOutgoingFilterId : undefined,
        date_from: dateFrom ? moment(dateFrom).format('YYYY-MM-DD') : undefined,
        date_to: dateTo ? moment(dateTo).format('YYYY-MM-DD') : undefined,
        filial: selectedFilialId ?? undefined,
    });

    const deletePurchaseInvoice = useDeletePurchaseInvoice();

    const invoices = data?.results || [];
    const pagination = data?.pagination;
    const totalPages = pagination?.lastPage || 1;

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === 'asc') setSortDirection('desc');
            else if (sortDirection === 'desc') {
                setSortField(null);
                setSortDirection(null);
            } else setSortDirection('asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className='h-4 w-4 ml-2 text-muted-foreground' />;
        if (sortDirection === 'asc') return <ArrowUp className='h-4 w-4 ml-2' />;
        return <ArrowDown className='h-4 w-4 ml-2' />;
    };

    const openDeleteDialog = (id: number) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deletePurchaseInvoice.mutateAsync(deletingId);
            setIsDeleteDialogOpen(false);
            setDeletingId(null);
        } catch {
            // handled in hook toast
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('uz-UZ').format(value);
    };

    const formatDollar = (value: number) => {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    };

    const getInvoiceTypeBadge = (type: string) => {
        if (type === PurchaseInvoiceType.EXTERNAL) {
            return (
                <Badge variant='default' className='bg-green-600'>
                    {PurchaseInvoiceTypeLabels[PurchaseInvoiceType.EXTERNAL]}
                </Badge>
            );
        }
        return (
            <Badge variant='default' className='bg-blue-600'>
                {PurchaseInvoiceTypeLabels[PurchaseInvoiceType.INTERNAL]}
            </Badge>
        );
    };

    const handleTabChange = (value: string) => {
        setSearchParams({ [TAB_PARAM]: value }, { replace: true });
        setCurrentPage(1);
        setSupplierFilterId(undefined);
        setSkladOutgoingFilterId(undefined);
    };

    const openNewInvoiceDialog = () => {
        newInvoiceForm.reset({
            date: moment().format('YYYY-MM-DD'),
            supplier: 0,
            sklad_outgoing: 0,
            sklad: 0,
        });
        setSupplierSearch('');
        setSkladSearch('');
        setSkladIncomingSearch('');
        setSupplierPage(1);
        setSkladPage(1);
        setSkladIncomingPage(1);
        setIsNewInvoiceDialogOpen(true);
    };

    return (
        <div className='space-y-6'>
            {/* Table Card */}
            <Card>
                <CardHeader className='pb-4'>
                    <div className='flex flex-col gap-4'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                            <div>
                                <CardTitle>Tovar kirimi</CardTitle>
                                <CardDescription>Ta'minotchilardan tovar kirimi ro'yxati</CardDescription>
                            </div>
                            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
                                <DateRangePicker
                                    dateFrom={dateFrom}
                                    dateTo={dateTo}
                                    onDateFromChange={(date) => {
                                        setDateFrom(date);
                                        setCurrentPage(1);
                                    }}
                                    onDateToChange={(date) => {
                                        setDateTo(date);
                                        setCurrentPage(1);
                                    }}
                                />
                                <Button onClick={openNewInvoiceDialog} className='gap-2'>
                                    <Plus className='h-4 w-4' />
                                    Yangi kirim
                                </Button>
                            </div>
                        </div>
                        <Tabs value={activeTab} onValueChange={handleTabChange}>
                            <TabsList className='grid w-full grid-cols-2 h-11 bg-muted dark:bg-muted/80 p-1'>
                                <TabsTrigger
                                    value={PurchaseInvoiceType.EXTERNAL}
                                    className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-colors hover:text-foreground dark:hover:text-foreground'
                                >
                                    {PurchaseInvoiceTypeLabels[PurchaseInvoiceType.EXTERNAL]}
                                </TabsTrigger>
                                <TabsTrigger
                                    value={PurchaseInvoiceType.INTERNAL}
                                    className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-colors hover:text-foreground dark:hover:text-foreground'
                                >
                                    {PurchaseInvoiceTypeLabels[PurchaseInvoiceType.INTERNAL]}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Tab bo'yicha filter: Tashqi = Ta'minotchi, Ichki = Qaysi ombor */}
                        {activeTab === PurchaseInvoiceType.EXTERNAL && (
                            <div className='flex flex-wrap items-center gap-2'>
                                <span className='text-sm text-muted-foreground'>Ta'minotchi:</span>
                                <Select
                                    value={supplierFilterId !== undefined ? String(supplierFilterId) : 'all'}
                                    onValueChange={(v) => {
                                        setSupplierFilterId(v === 'all' ? undefined : Number(v));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className='w-[220px]'>
                                        <SelectValue placeholder="Ta'minotchini tanlang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='all'>Barchasi</SelectItem>
                                        {filterSuppliers.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {activeTab === PurchaseInvoiceType.INTERNAL && (
                            <div className='flex flex-wrap items-center gap-2'>
                                <span className='text-sm text-muted-foreground'>Qaysi ombor:</span>
                                <Select
                                    value={skladOutgoingFilterId !== undefined ? String(skladOutgoingFilterId) : 'all'}
                                    onValueChange={(v) => {
                                        setSkladOutgoingFilterId(v === 'all' ? undefined : Number(v));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className='w-[220px]'>
                                        <SelectValue placeholder='Omborni tanlang' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='all'>Barchasi</SelectItem>
                                        {filterSklads.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className='flex items-center justify-center py-10'>
                            <Loader2 className='h-8 w-8 animate-spin text-primary' />
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-10 text-center'>
                            <Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
                            <p className='text-muted-foreground'>Hozircha fakturalar mavjud emas</p>
                            <Button
                                variant='outline'
                                className='mt-4'
                                onClick={() => navigate('/purchase-invoices/add')}
                            >
                                <Plus className='h-4 w-4 mr-2' />
                                Birinchi fakturani qo'shing
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className='rounded-md border'>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className='w-[60px]'>#</TableHead>
                                            <TableHead
                                                className='cursor-pointer select-none'
                                                onClick={() => handleSort('date')}
                                            >
                                                <div className='flex items-center'>
                                                    Sana
                                                    {getSortIcon('date')}
                                                </div>
                                            </TableHead>
                                            <TableHead>
                                                {activeTab === PurchaseInvoiceType.INTERNAL
                                                    ? 'Qaysi ombor'
                                                    : "Ta'minotchi"}
                                            </TableHead>
                                            <TableHead>Filial</TableHead>
                                            <TableHead>Ombor</TableHead>
                                            <TableHead className='text-right'>Mahsulotlar</TableHead>
                                            <TableHead
                                                className='cursor-pointer select-none text-right'
                                                onClick={() => handleSort('all_product_summa')}
                                            >
                                                <div className='flex items-center justify-end'>
                                                    Jami summa
                                                    {getSortIcon('all_product_summa')}
                                                </div>
                                            </TableHead>
                                            <TableHead className='text-center w-[90px]'>Karzinka</TableHead>
                                            <TableHead className='text-right w-[100px]'>Amallar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.map((invoice, index) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell className='font-medium'>
                                                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                                </TableCell>
                                                <TableCell>{moment(invoice.date).format('DD.MM.YYYY')}</TableCell>
                                                <TableCell>
                                                    {invoice.type === PurchaseInvoiceType.INTERNAL
                                                        ? (invoice as unknown as { sklad_outgoing_detail?: { name: string } })
                                                            .sklad_outgoing_detail?.name || '-'
                                                        : invoice.supplier_detail?.name || `#${invoice.supplier}` || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {invoice.filial_detail?.name || `#${invoice.filial}`}
                                                </TableCell>
                                                <TableCell>
                                                    {invoice.sklad_detail?.name || `#${invoice.sklad}`}
                                                </TableCell>
                                                <TableCell className='text-right'>
                                                    <Badge variant='outline'>{invoice.product_count} ta</Badge>
                                                </TableCell>
                                                <TableCell className='text-right font-semibold text-green-600'>
                                                    ${formatDollar(invoice.all_product_summa)}
                                                </TableCell>
                                                <TableCell className='text-center'>
                                                    {invoice.is_karzinka ? (
                                                        <Badge variant='default' className='bg-amber-600'>
                                                            Korzinkada
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant='default' className='bg-green-600 text-white'>
                                                            Yakunlangan
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className='text-right'>
                                                    <div className='flex items-center justify-end gap-1'>

                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            className='h-8 w-8 text-blue-600 hover:text-blue-700'
                                                            onClick={() =>
                                                                navigate(`/purchase-invoices/add/${invoice.id}`)
                                                            }
                                                            title='Tahrirlash'
                                                        >
                                                            <Edit className='h-4 w-4' />
                                                        </Button>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            className='h-8 w-8'
                                                            onClick={() => navigate(`/purchase-invoices/${invoice.id}`)}
                                                        >
                                                            <Eye className='h-4 w-4' />
                                                        </Button>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            className='h-8 w-8 text-destructive hover:text-destructive'
                                                            onClick={() => openDeleteDialog(invoice.id)}
                                                        >
                                                            <Trash2 className='h-4 w-4' />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className='mt-4 flex justify-center'>
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                    className={cn(
                                                        currentPage === 1 && 'pointer-events-none opacity-50',
                                                    )}
                                                />
                                            </PaginationItem>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(
                                                    (page) =>
                                                        page === 1 ||
                                                        page === totalPages ||
                                                        Math.abs(page - currentPage) <= 1,
                                                )
                                                .map((page, idx, arr) => (
                                                    <PaginationItem key={page}>
                                                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                                                            <span className='px-2'>...</span>
                                                        )}
                                                        <PaginationLink
                                                            onClick={() => setCurrentPage(page)}
                                                            isActive={currentPage === page}
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                ))}
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                    className={cn(
                                                        currentPage === totalPages && 'pointer-events-none opacity-50',
                                                    )}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fakturani o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>
                            Haqiqatan ham bu fakturani o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            disabled={deletePurchaseInvoice.isPending}
                        >
                            {deletePurchaseInvoice.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* New Invoice Dialog */}
            <Dialog open={isNewInvoiceDialogOpen} onOpenChange={setIsNewInvoiceDialogOpen}>
                <DialogContent className='sm:max-w-[500px]'>
                    <DialogHeader>
                        <DialogTitle>
                            {activeTab === PurchaseInvoiceType.INTERNAL
                                ? 'Ichki kirim'
                                : 'Tashqi kirim'}{' '}
                            yaratish
                        </DialogTitle>
                        <DialogDescription>Faktura uchun asosiy ma'lumotlarni kiriting</DialogDescription>
                    </DialogHeader>
                    <Form {...newInvoiceForm}>
                        <form
                            onSubmit={newInvoiceForm.handleSubmit(async (values) => {
                                const invoiceType = activeTab;
                                // Validate by tab: Tashqi = supplier, Ichki = sklad_outgoing + sklad
                                if (invoiceType === PurchaseInvoiceType.EXTERNAL) {
                                    if (!values.supplier || values.supplier <= 0) {
                                        newInvoiceForm.setError('supplier', {
                                            message: "Ta'minotchi tanlanishi shart",
                                        });
                                        return;
                                    }
                                } else {
                                    if (!values.sklad_outgoing || values.sklad_outgoing <= 0) {
                                        newInvoiceForm.setError('sklad_outgoing', {
                                            message: 'Qaysi ombordan tanlanishi shart',
                                        });
                                        return;
                                    }
                                    if (!values.sklad || values.sklad <= 0) {
                                        newInvoiceForm.setError('sklad', {
                                            message: 'Qaysi omborga tanlanishi shart',
                                        });
                                        return;
                                    }
                                }

                                try {
                                    const firstSkladId = skladsResults[0]?.id;
                                    if (!firstSkladId && invoiceType === PurchaseInvoiceType.EXTERNAL) {
                                        // Tashqi kirim uchun ombor ro'yxati bo'sh bo'lmasligi kerak
                                        return;
                                    }

                                    const payload: CreatePurchaseInvoicePayload = {
                                        type: invoiceType,
                                        date: values.date,
                                        sklad: invoiceType === PurchaseInvoiceType.EXTERNAL ? firstSkladId : values.sklad!,
                                        employee: user?.id || 0,
                                        filial: selectedFilialId || user?.filials_detail?.[0]?.id || 0,
                                        is_karzinka: true,
                                    };

                                    if (invoiceType === PurchaseInvoiceType.EXTERNAL) {
                                        payload.supplier = values.supplier!;
                                    } else {
                                        payload.sklad_outgoing = values.sklad_outgoing!;
                                    }

                                    const invoice = await createPurchaseInvoice.mutateAsync(payload);
                                    setIsNewInvoiceDialogOpen(false);
                                    newInvoiceForm.reset();
                                    navigate(`/purchase-invoices/add/${invoice.id}`);
                                } catch {
                                    // Error handled in hook
                                }
                            })}
                            className='space-y-4'
                        >
                            <FormField
                                control={newInvoiceForm.control}
                                name='date'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sana</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={field.value ? moment(field.value).toDate() : undefined}
                                                onDateChange={(date) => {
                                                    if (date) {
                                                        field.onChange(moment(date).format('YYYY-MM-DD'));
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {activeTab === PurchaseInvoiceType.EXTERNAL ? (
                                <FormField
                                    control={newInvoiceForm.control}
                                    name='supplier'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ta'minotchi</FormLabel>
                                            <FormControl>
                                                <Autocomplete
                                                    options={supplierOptions}
                                                    value={field.value ? Number(field.value) : undefined}
                                                    onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                                                    placeholder="Ta'minotchini tanlang"
                                                    searchPlaceholder="Ta'minotchi qidirish..."
                                                    emptyText="Ta'minotchi topilmadi"
                                                    onSearchChange={(q) => setSupplierSearch(q)}
                                                    onScrollToBottom={() => {
                                                        if (suppliersHasMore) setSupplierPage(supplierPage + 1);
                                                    }}
                                                    hasMore={suppliersHasMore}
                                                    isLoading={isSuppliersLoading}
                                                    isLoadingMore={isSuppliersFetching}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <>
                                    <FormField
                                        control={newInvoiceForm.control}
                                        name='sklad_outgoing'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Qaysi ombordan</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value && field.value > 0 ? String(field.value) : 'none'}
                                                        onValueChange={(v) => {
                                                            if (v === 'none') {
                                                                field.onChange(0);
                                                                return;
                                                            }
                                                            const value = v ? Number(v) : 0;
                                                            field.onChange(value);
                                                            // Agar ikkinchi ombor birinchi ombor bilan bir xil bo'lsa, uni tozalash
                                                            if (value === selectedSklad) {
                                                                newInvoiceForm.setValue('sklad', 0);
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder='Chiquvchi omborni tanlang' />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value='none'>Tanlang</SelectItem>
                                                            {filterSklads
                                                                .filter((s) => !selectedSklad || s.id !== selectedSklad)
                                                                .map((s) => (
                                                                    <SelectItem key={s.id} value={String(s.id)}>
                                                                        {s.name}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={newInvoiceForm.control}
                                        name='sklad'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Qaysi omborga</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value && field.value > 0 ? String(field.value) : 'none'}
                                                        onValueChange={(v) => {
                                                            if (v === 'none') {
                                                                field.onChange(0);
                                                                return;
                                                            }
                                                            const value = v ? Number(v) : 0;
                                                            field.onChange(value);
                                                            // Agar birinchi ombor ikkinchi ombor bilan bir xil bo'lsa, uni tozalash
                                                            if (value === selectedSkladOutgoing) {
                                                                newInvoiceForm.setValue('sklad_outgoing', 0);
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder='Kiruvchi omborni tanlang' />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value='none'>Tanlang</SelectItem>
                                                            {filterSklads
                                                                .filter((s) => !selectedSkladOutgoing || s.id !== selectedSkladOutgoing)
                                                                .map((s) => (
                                                                    <SelectItem key={s.id} value={String(s.id)}>
                                                                        {s.name}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                            <DialogFooter>
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={() => {
                                        setIsNewInvoiceDialogOpen(false);
                                        newInvoiceForm.reset();
                                    }}
                                >
                                    Bekor qilish
                                </Button>
                                <Button type='submit' disabled={createPurchaseInvoice.isPending}>
                                    {createPurchaseInvoice.isPending && (
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    )}
                                    Saqlash
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
