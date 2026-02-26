/**
 * PurchaseInvoices Page
 * /purchase-invoices
 * Tovar kirimi (fakturalar) ro'yxati
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Autocomplete } from '@/components/ui/autocomplete';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { usePurchaseInvoices, useDeletePurchaseInvoice, useCreatePurchaseInvoice } from '@/hooks/api/usePurchaseInvoice';
import { useSuppliers } from '@/hooks/api/useSupplier';
import { useSklads } from '@/hooks/api/useSklad';
import { useAuthContext } from '@/contexts/AuthContext';
import type { PurchaseInvoice } from '@/types/purchaseInvoice';
import { PurchaseInvoiceType, PurchaseInvoiceTypeLabels, CreatePurchaseInvoicePayload } from '@/types/purchaseInvoice';
import { DateRangePicker } from '@/components/ui/date-picker';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Plus, Trash2, Eye, Package, ArrowDownCircle, Edit } from 'lucide-react';
import moment from 'moment';

const ITEMS_PER_PAGE = 10;

type SortField = 'date' | 'all_product_summa' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

// Modal form schema
const newInvoiceSchema = z.object({
    date: z.string().min(1, 'Sana tanlanishi shart'),
    type: z.enum([PurchaseInvoiceType.EXTERNAL, PurchaseInvoiceType.INTERNAL]),
    supplier: z.coerce.number().min(0).optional(),
    sklad_outgoing: z.coerce.number().min(0).optional(),
    sklad: z.coerce.number().positive('Ombor tanlanishi shart'),
}).superRefine((data, ctx) => {
    if (data.type === PurchaseInvoiceType.EXTERNAL) {
        if (!data.supplier || data.supplier <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Ta'minotchi tanlanishi shart",
                path: ['supplier'],
            });
        }
    } else {
        if (!data.sklad_outgoing || data.sklad_outgoing <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Ta'minotchi tanlanishi shart",
                path: ['sklad_outgoing'],
            });
        }
    }
});

type NewInvoiceFormData = z.infer<typeof newInvoiceSchema>;

export default function PurchaseInvoices() {
    const navigate = useNavigate();
    const { user, selectedFilialId } = useAuthContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
    const [isNewInvoiceDialogOpen, setIsNewInvoiceDialogOpen] = useState(false);

    // Supplier autocomplete state
    const [supplierPage, setSupplierPage] = useState(1);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierOptions, setSupplierOptions] = useState<Array<{ value: number; label: string }>>([]);

    // Sklad autocomplete state
    const [skladPage, setSkladPage] = useState(1);
    const [skladSearch, setSkladSearch] = useState('');
    const [skladOptions, setSkladOptions] = useState<Array<{ value: number; label: string }>>([]);

    // New invoice form
    const newInvoiceForm = useForm<NewInvoiceFormData>({
        resolver: zodResolver(newInvoiceSchema),
        defaultValues: {
            date: moment().format('YYYY-MM-DD'),
            type: PurchaseInvoiceType.EXTERNAL,
            supplier: 0,
            sklad_outgoing: 0,
            sklad: 0,
        },
    });

    // Watch type to conditionally show supplier or sklad_outgoing
    const invoiceType = newInvoiceForm.watch('type');

    // Clear supplier/sklad_outgoing when type changes
    useEffect(() => {
        if (invoiceType === PurchaseInvoiceType.EXTERNAL) {
            newInvoiceForm.setValue('sklad_outgoing', 0);
        } else {
            newInvoiceForm.setValue('supplier', 0);
        }
    }, [invoiceType, newInvoiceForm]);

    // Data fetching for modal
    const { data: suppliersData, isLoading: isSuppliersLoading, isFetching: isSuppliersFetching } = useSuppliers({
        page: supplierPage,
        limit: 50,
        search: supplierSearch || undefined,
        is_delete: false,
        filial: selectedFilialId ?? undefined,
    });

    const { data: skladsData, isLoading: isSkladsLoading, isFetching: isSkladsFetching } = useSklads({
        page: skladPage,
        perPage: 50,
        search: skladSearch || undefined,
        is_delete: false,
        filial: selectedFilialId ?? undefined,
    });

    const suppliersResults = (suppliersData as any)?.results || [];
    const suppliersPagination = (suppliersData as any)?.pagination;
    const suppliersHasMore = !!suppliersPagination && suppliersPagination.lastPage > (suppliersPagination.currentPage || 1);

    const skladsResults = (skladsData as any)?.results || [];
    const skladsPagination = (skladsData as any)?.pagination;
    const skladsHasMore = !!skladsPagination && skladsPagination.lastPage > (skladsPagination.currentPage || 1);

    useEffect(() => {
        const results = (suppliersData as any)?.results || [];
        if (supplierPage === 1) {
            setSupplierOptions(results.map((s: any) => ({ value: s.id, label: s.name || `#${s.id}` })));
        } else if (results.length > 0) {
            setSupplierOptions((prev) => [...prev, ...results.map((s: any) => ({ value: s.id, label: s.name || `#${s.id}` }))]);
        }
    }, [suppliersData, supplierPage]);

    useEffect(() => {
        const results = (skladsData as any)?.results || [];
        if (skladPage === 1) {
            setSkladOptions(results.map((s: any) => ({ value: s.id, label: s.name || `#${s.id}` })));
        } else if (results.length > 0) {
            setSkladOptions((prev) => [...prev, ...results.map((s: any) => ({ value: s.id, label: s.name || `#${s.id}` }))]);
        }
    }, [skladsData, skladPage]);

    useEffect(() => {
        setSupplierPage(1);
        setSupplierOptions([]);
    }, [supplierSearch, selectedFilialId]);

    useEffect(() => {
        setSkladPage(1);
        setSkladOptions([]);
    }, [skladSearch, selectedFilialId]);

    const createPurchaseInvoice = useCreatePurchaseInvoice();

    const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;

    const { data, isLoading } = usePurchaseInvoices({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        ordering,
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

    return (
        <div className='space-y-6'>
            {/* Header */}

            {/* Table Card */}
            <Card>
                <CardHeader className='pb-4'>
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
                            <Button onClick={() => setIsNewInvoiceDialogOpen(true)} className='gap-2'>
                                <Plus className='h-4 w-4' />
                                Yangi kirim
                            </Button>
                        </div>
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
                                            <TableHead>Turi</TableHead>
                                            <TableHead>Ta'minotchi</TableHead>
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
                                                <TableCell>{getInvoiceTypeBadge(invoice.type)}</TableCell>
                                                <TableCell>
                                                    {invoice.supplier_detail?.name || `#${invoice.supplier}`}
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
                                                <TableCell className='text-right'>
                                                    <div className='flex items-center justify-end gap-1'>
                                                        {invoice.is_karzinka && (
                                                            <Button
                                                                variant='ghost'
                                                                size='icon'
                                                                className='h-8 w-8 text-blue-600 hover:text-blue-700'
                                                                onClick={() => navigate(`/purchase-invoices/add/${invoice.id}`)}
                                                                title="Tahrirlash"
                                                            >
                                                                <Edit className='h-4 w-4' />
                                                            </Button>
                                                        )}
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
                        <DialogTitle>Yangi kirim yaratish</DialogTitle>
                        <DialogDescription>Faktura uchun asosiy ma'lumotlarni kiriting</DialogDescription>
                    </DialogHeader>
                    <Form {...newInvoiceForm}>
                        <form
                            onSubmit={newInvoiceForm.handleSubmit(async (values) => {
                                try {
                                    const payload: CreatePurchaseInvoicePayload = {
                                        type: values.type,
                                        sklad: values.sklad,
                                        date: values.date,
                                        employee: user?.id || 0,
                                        filial: selectedFilialId || user?.filials_detail?.[0]?.id || 0,
                                        is_karzinka: true,
                                    };

                                    // Add supplier or sklad_outgoing based on type
                                    if (values.type === PurchaseInvoiceType.EXTERNAL) {
                                        if (values.supplier && values.supplier > 0) {
                                            payload.supplier = values.supplier;
                                        }
                                    } else {
                                        if (values.sklad_outgoing && values.sklad_outgoing > 0) {
                                            payload.sklad_outgoing = values.sklad_outgoing;
                                        }
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
                            <FormField
                                control={newInvoiceForm.control}
                                name='type'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Turi</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                className='flex gap-6'
                                            >
                                                <div className='flex items-center space-x-2'>
                                                    <RadioGroupItem value={PurchaseInvoiceType.EXTERNAL} id='external' />
                                                    <label htmlFor='external' className='text-sm font-normal cursor-pointer'>
                                                        {PurchaseInvoiceTypeLabels[PurchaseInvoiceType.EXTERNAL]}
                                                    </label>
                                                </div>
                                                <div className='flex items-center space-x-2'>
                                                    <RadioGroupItem value={PurchaseInvoiceType.INTERNAL} id='internal' />
                                                    <label htmlFor='internal' className='text-sm font-normal cursor-pointer'>
                                                        {PurchaseInvoiceTypeLabels[PurchaseInvoiceType.INTERNAL]}
                                                    </label>
                                                </div>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {invoiceType === PurchaseInvoiceType.EXTERNAL ? (
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
                                <FormField
                                    control={newInvoiceForm.control}
                                    name='sklad_outgoing'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ta'minotchi</FormLabel>
                                            <FormControl>
                                                <Autocomplete
                                                    options={skladOptions}
                                                    value={field.value ? Number(field.value) : undefined}
                                                    onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                                                    placeholder="Ta'minotchini tanlang"
                                                    searchPlaceholder="Ta'minotchi qidirish..."
                                                    emptyText="Ta'minotchi topilmadi"
                                                    onSearchChange={(q) => setSkladSearch(q)}
                                                    onScrollToBottom={() => {
                                                        if (skladsHasMore) setSkladPage(skladPage + 1);
                                                    }}
                                                    hasMore={skladsHasMore}
                                                    isLoading={isSkladsLoading}
                                                    isLoadingMore={isSkladsFetching}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={newInvoiceForm.control}
                                name='sklad'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ombor</FormLabel>
                                        <FormControl>
                                            <Autocomplete
                                                options={skladOptions}
                                                value={field.value ? Number(field.value) : undefined}
                                                onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                                                placeholder='Omborni tanlang'
                                                searchPlaceholder='Ombor qidirish...'
                                                emptyText='Ombor topilmadi'
                                                onSearchChange={(q) => setSkladSearch(q)}
                                                onScrollToBottom={() => {
                                                    if (skladsHasMore) setSkladPage(skladPage + 1);
                                                }}
                                                hasMore={skladsHasMore}
                                                isLoading={isSkladsLoading}
                                                isLoadingMore={isSkladsFetching}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                    {createPurchaseInvoice.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
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
