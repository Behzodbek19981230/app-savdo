import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-picker';
import { DatePicker } from '@/components/ui/date-picker';
import {
    useSupplierAccount,
    useSupplierDebtRepayment,
    useCreateSupplierAccount,
    useUpdateSupplierAccount,
    useDeleteSupplierAccount,
    useCreateSupplierDebtRepayment,
    useUpdateSupplierDebtRepayment,
    useDeleteSupplierDebtRepayment,
    useSupplierAccountById,
    useSupplierDebtRepaymentById,
} from '@/hooks/api/useSupplierAccount';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, Package, SearchIcon, X, Plus, Edit, Trash2 } from 'lucide-react';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useSuppliers } from '@/hooks/api/useSupplier';
import { useUsers } from '@/hooks/api/useUsers';
import { useExchangeRates } from '@/hooks/api/useExchangeRate';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import NumberInput from '@/components/ui/NumberInput';
import { showSuccess, showError } from '@/lib/toast';

const ITEMS_PER_PAGE = 5;

// Schema for Supplier Account
const supplierAccountSchema = z.object({
    supplier: z.coerce.number().positive('Ta\'minotchi tanlanishi shart'),
    total_turnover: z.coerce.number().min(0, 'Jami aylanma kiritilishi shart'),
    filial_debt: z.coerce.number().min(0, 'Filial qarzi kiritilishi shart'),
});

type SupplierAccountFormData = z.infer<typeof supplierAccountSchema>;

// Schema for Supplier Debt Repayment
const supplierDebtRepaymentSchema = z.object({
    supplier: z.coerce.number().positive('Ta\'minotchi tanlanishi shart'),
    employee: z.coerce.number().positive('Xodim tanlanishi shart'),
    date: z.date({ required_error: 'Sana tanlanishi shart' }),
    total_debt_old: z.coerce.number().min(0, 'Eski qarz kiritilishi shart'),
    total_debt: z.coerce.number().min(0, 'Jami qarz kiritilishi shart'),
    summa_total_dollar: z.coerce.number().min(0, 'Jami to\'lov kiritilishi shart'),
    summa_dollar: z.coerce.number().min(0, 'Dollar to\'lovi kiritilishi shart'),
    summa_naqt: z.coerce.number().min(0, 'Naqt to\'lovi kiritilishi shart'),
    summa_kilik: z.coerce.number().min(0, 'Kesibek to\'lovi kiritilishi shart'),
    summa_terminal: z.coerce.number().min(0, 'Terminal to\'lovi kiritilishi shart'),
    summa_transfer: z.coerce.number().min(0, 'Transfer to\'lovi kiritilishi shart'),
});

type SupplierDebtRepaymentFormData = z.infer<typeof supplierDebtRepaymentSchema>;

// Shared component for supplier account table
function SupplierAccountTable({
    dateGroups,
    items,
    isLoading,
    lastPage,
    page,
    setPage,
    formatCurrency,
    activeTab,
    onEdit,
    onDelete,
}: {
    dateGroups?: any[];
    items?: any[];
    isLoading: boolean;
    lastPage: number;
    page: number;
    setPage: (page: number) => void;
    formatCurrency: (value: string | number | undefined) => string;
    activeTab: string;
    onEdit: (item: any) => void;
    onDelete: (item: any) => void;
}) {
    if (isLoading) {
        return (
            <div className='flex items-center justify-center py-10'>
                <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
        );
    }

    // Check if we have direct items array (new API structure) or dateGroups (old structure)
    const hasDirectItems = items && items.length > 0;
    const hasDateGroups = dateGroups && dateGroups.length > 0;

    if (!hasDirectItems && !hasDateGroups) {
        return (
            <div className='flex flex-col items-center justify-center py-10 text-center'>
                <Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
                <p className='text-muted-foreground'>Ma'lumotlar topilmadi</p>
            </div>
        );
    }

    // Render direct items (new API structure)
    if (hasDirectItems) {
        // For supplier-account tab
        if (activeTab === 'account') {
            return (
                <>
                    <div className='rounded-md border'>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='w-[60px]'>t/r</TableHead>
                                    <TableHead>Ta'minotchi</TableHead>
                                    <TableHead className='text-right'>Jami aylanma ($)</TableHead>
                                    <TableHead className='text-right'>Filial qarzi ($)</TableHead>
                                    <TableHead className='w-[100px]'>Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((it: any, idx: number) => (
                                    <TableRow key={it.id}>
                                        <TableCell className='font-medium'>{items.length - idx}</TableCell>
                                        <TableCell>
                                            {it.supplier_detail?.name || `#${it.supplier || '-'}`}
                                        </TableCell>
                                        <TableCell className='text-right text-blue-600 font-semibold'>
                                            {formatCurrency(it.total_turnover)}
                                        </TableCell>
                                        <TableCell className='text-right text-red-600 font-semibold'>
                                            {formatCurrency(it.filial_debt)}
                                        </TableCell>
                                        <TableCell>
                                            <div className='flex items-center gap-2'>
                                                <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    onClick={() => onEdit(it)}
                                                    className='h-8 w-8 p-0'
                                                >
                                                    <Edit className='h-4 w-4' />
                                                </Button>
                                                <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    onClick={() => onDelete(it)}
                                                    className='h-8 w-8 p-0 text-destructive hover:text-destructive'
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
                    {!isLoading && items.length > 0 && lastPage > 1 && (
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
                </>
            );
        }

        // For supplier-debt-repayment tab
        return (
            <>
                <div className='rounded-md border'>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className='w-[60px]'>t/r</TableHead>
                                <TableHead>Sana</TableHead>
                                <TableHead>Xodim</TableHead>
                                <TableHead>Ta'minotchi</TableHead>
                                <TableHead className='text-right'>Eski qarz ($)</TableHead>
                                <TableHead className='text-right'>Jami qarz ($)</TableHead>
                                <TableHead className='text-right'>Jami to'lov ($)</TableHead>
                                <TableHead className='text-right'>Dollar</TableHead>
                                <TableHead className='text-right'>Naqt</TableHead>
                                <TableHead className='text-right'>Plastik</TableHead>
                                <TableHead className='text-right'>Terminal</TableHead>
                                <TableHead className='text-right'>Transfer</TableHead>
                                <TableHead className='w-[100px]'>Amallar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((it: any, idx: number) => (
                                <TableRow key={it.id}>
                                    <TableCell className='font-medium'>{items.length - idx}</TableCell>
                                    <TableCell>
                                        {it.date ? moment(it.date).format('YYYY-MM-DD') : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {it.employee_detail?.full_name || it.employee_detail?.username || `#${it.employee || '-'}`}
                                    </TableCell>
                                    <TableCell>
                                        {it.supplier_detail?.name || `#${it.supplier || '-'}`}
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        {formatCurrency(it.total_debt_old)}
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        {formatCurrency(it.total_debt)}
                                    </TableCell>
                                    <TableCell className='text-right text-blue-600 font-semibold'>
                                        {formatCurrency(it.summa_total_dollar)}
                                    </TableCell>
                                    <TableCell className='text-right'>{formatCurrency(it.summa_dollar)}</TableCell>
                                    <TableCell className='text-right'>{formatCurrency(it.summa_naqt)}</TableCell>
                                    <TableCell className='text-right'>{formatCurrency(it.summa_kilik)}</TableCell>
                                    <TableCell className='text-right'>
                                        {formatCurrency(it.summa_terminal)}
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        {formatCurrency(it.summa_transfer)}
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex items-center gap-2'>
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={() => onEdit(it)}
                                                className='h-8 w-8 p-0'
                                            >
                                                <Edit className='h-4 w-4' />
                                            </Button>
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={() => onDelete(it)}
                                                className='h-8 w-8 p-0 text-destructive hover:text-destructive'
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
                {!isLoading && items.length > 0 && lastPage > 1 && (
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
            </>
        );
    }

    // Render dateGroups (old structure for supplier-debt-repayment)
    return (
        <>
            <div className='rounded-md border'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='w-[60px]'>t/r</TableHead>
                            <TableHead>Sanasi</TableHead>
                            {activeTab === 'repayment' && <TableHead>Xodim</TableHead>}
                            <TableHead>Ta'minotchi</TableHead>
                            {activeTab === 'account' && <TableHead>Faktura</TableHead>}
                            <TableHead className='text-right'>Jami summa ($)</TableHead>
                            <TableHead className='text-right'>Dollar</TableHead>
                            <TableHead className='text-right'>Naqt</TableHead>
                            <TableHead className='text-right'>Plastik</TableHead>
                            <TableHead className='text-right'>Terminal</TableHead>
                            <TableHead className='text-right'>Transfer</TableHead>
                            <TableHead className='w-[100px]'>Amallar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dateGroups?.map((group: any) => {
                            // Check if group has items array
                            if (!group || !group.items || !Array.isArray(group.items)) {
                                return null;
                            }

                            // Calculate totals for this date group
                            const totalSumma = group.items.reduce(
                                (sum: number, item: any) => sum + parseFloat(item.summa_total_dollar || '0'),
                                0,
                            );
                            const totalDollar = group.items.reduce(
                                (sum: number, item: any) => sum + parseFloat(item.summa_dollar || '0'),
                                0,
                            );
                            const totalNaqt = group.items.reduce(
                                (sum: number, item: any) => sum + parseFloat(item.summa_naqt || '0'),
                                0,
                            );
                            const totalKilik = group.items.reduce(
                                (sum: number, item: any) => sum + parseFloat(item.summa_kilik || '0'),
                                0,
                            );
                            const totalTerminal = group.items.reduce(
                                (sum: number, item: any) => sum + parseFloat(item.summa_terminal || '0'),
                                0,
                            );
                            const totalTransfer = group.items.reduce(
                                (sum: number, item: any) => sum + parseFloat(item.summa_transfer || '0'),
                                0,
                            );

                            return (
                                <>
                                    {/* Summary Row */}
                                    <TableRow key={`summary-${group.date}`} className='bg-muted/50 font-semibold'>
                                        <TableCell>
                                            <div className='flex items-center gap-2'>
                                                <Badge>{group.count}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className='font-semibold'>
                                            {moment(group.date).format('YYYY-MM-DD')}
                                        </TableCell>
                                        {activeTab === 'repayment' && <TableCell></TableCell>}
                                        <TableCell></TableCell>
                                        {activeTab === 'account' && <TableCell></TableCell>}
                                        <TableCell className='text-right font-semibold'>
                                            {formatCurrency(totalSumma)}
                                        </TableCell>
                                        <TableCell className='text-right font-semibold'>
                                            {formatCurrency(totalDollar)}
                                        </TableCell>
                                        <TableCell className='text-right font-semibold'>
                                            {formatCurrency(totalNaqt)}
                                        </TableCell>
                                        <TableCell className='text-right font-semibold'>
                                            {formatCurrency(totalKilik)}
                                        </TableCell>
                                        <TableCell className='text-right font-semibold'>
                                            {formatCurrency(totalTerminal)}
                                        </TableCell>
                                        <TableCell className='text-right font-semibold'>
                                            {formatCurrency(totalTransfer)}
                                        </TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                    {/* Items */}
                                    {group.items.map((it: any, idx: number) => (
                                        <TableRow key={it.id}>
                                            <TableCell className='font-medium'>{group.items.length - idx}</TableCell>
                                            <TableCell>
                                                {it.created_time
                                                    ? moment(it.created_time).format('YYYY-MM-DD HH:mm')
                                                    : it.date
                                                        ? moment(it.date).format('YYYY-MM-DD')
                                                        : group.date}
                                            </TableCell>
                                            {activeTab === 'repayment' && (
                                                <TableCell>
                                                    {it.employee_detail?.full_name || it.employee_detail?.username || `#${it.employee || '-'}`}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                {it.supplier_detail?.name || `#${it.supplier || '-'}`}
                                            </TableCell>
                                            {activeTab === 'account' && (
                                                <TableCell>
                                                    {it.purchase_invoice_detail?.invoice_number || `#${it.purchase_invoice || '-'}`}
                                                </TableCell>
                                            )}
                                            <TableCell className='text-right text-blue-600 font-semibold'>
                                                {formatCurrency(it.summa_total_dollar)}
                                            </TableCell>
                                            <TableCell className='text-right'>{formatCurrency(it.summa_dollar)}</TableCell>
                                            <TableCell className='text-right'>{formatCurrency(it.summa_naqt)}</TableCell>
                                            <TableCell className='text-right'>{formatCurrency(it.summa_kilik)}</TableCell>
                                            <TableCell className='text-right'>
                                                {formatCurrency(it.summa_terminal)}
                                            </TableCell>
                                            <TableCell className='text-right'>
                                                {formatCurrency(it.summa_transfer)}
                                            </TableCell>
                                            <TableCell>
                                                <div className='flex items-center gap-2'>
                                                    <Button
                                                        variant='ghost'
                                                        size='sm'
                                                        onClick={() => onEdit(it)}
                                                        className='h-8 w-8 p-0'
                                                    >
                                                        <Edit className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        variant='ghost'
                                                        size='sm'
                                                        onClick={() => onDelete(it)}
                                                        className='h-8 w-8 p-0 text-destructive hover:text-destructive'
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
        </>
    );
}

// Filter component
function SupplierAccountFilters({
    formSearch,
    setFormSearch,
    formSupplierId,
    setFormSupplierId,
    formSupplierSearch,
    setFormSupplierSearch,
    supplierOptions,
    supplierPage,
    setSupplierPage,
    suppliersHasMore,
    isSuppliersLoading,
    isSuppliersFetching,
    formDateFrom,
    setFormDateFrom,
    formDateTo,
    setFormDateTo,
    onFilter,
    onClear,
}: {
    formSearch: string;
    setFormSearch: (value: string) => void;
    formSupplierId: number | null;
    setFormSupplierId: (value: number | null) => void;
    formSupplierSearch: string;
    setFormSupplierSearch: (value: string) => void;
    supplierOptions: Array<{ value: number; label: string }>;
    supplierPage: number;
    setSupplierPage: (page: number) => void;
    suppliersHasMore: boolean;
    isSuppliersLoading: boolean;
    isSuppliersFetching: boolean;
    formDateFrom: Date | undefined;
    setFormDateFrom: (value: Date | undefined) => void;
    formDateTo: Date | undefined;
    setFormDateTo: (value: Date | undefined) => void;
    onFilter: () => void;
    onClear: () => void;
}) {
    return (
        <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-end gap-2 w-full'>
            <div className='w-full sm:w-auto'>
                <Input
                    placeholder="Ta'minotchi nomi yoki telefon"
                    value={formSearch}
                    onChange={(e) => setFormSearch(e.target.value)}
                    className='w-full sm:min-w-[220px]'
                />
            </div>

            <div className='w-full sm:w-[260px]'>
                <Autocomplete
                    options={supplierOptions}
                    value={formSupplierId ?? undefined}
                    onValueChange={(v) => setFormSupplierId(v ? Number(v) : null)}
                    placeholder="Ta'minotchini tanlang"
                    searchPlaceholder="Ta'minotchi qidirish..."
                    emptyText="Ta'minotchi topilmadi"
                    onSearchChange={(q) => setFormSupplierSearch(q)}
                    onScrollToBottom={() => {
                        if (suppliersHasMore) setSupplierPage(supplierPage + 1);
                    }}
                    hasMore={suppliersHasMore}
                    isLoading={isSuppliersLoading}
                    isLoadingMore={isSuppliersFetching}
                />
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
                <Button onClick={onFilter} className='bg-blue-600 hover:bg-blue-700 text-white'>
                    <SearchIcon className='h-4 w-4' />
                    Qidirish
                </Button>
                <Button
                    variant='outline'
                    onClick={onClear}
                    className='border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                >
                    <X className='h-4 w-4' />
                    Tozalash
                </Button>
            </div>
        </div>
    );
}

export default function SupplierAccountPage() {
    const { selectedFilialId } = useAuthContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab') || 'account';
    const [activeTab, setActiveTab] = useState(tabFromUrl);
    const [page, setPage] = useState(1);

    // Update URL when tab changes (only if different from URL)
    useEffect(() => {
        const currentTab = searchParams.get('tab') || 'account';
        if (activeTab !== currentTab) {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('tab', activeTab);
            setSearchParams(newParams, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Update tab when URL changes (only on mount or when URL changes externally)
    useEffect(() => {
        const urlTab = searchParams.get('tab') || 'account';
        if ((urlTab === 'account' || urlTab === 'repayment') && urlTab !== activeTab) {
            setActiveTab(urlTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // applied filters (used for querying)
    const [search, setSearch] = useState('');
    const [supplierId, setSupplierId] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

    // form-level filters (user edits these but they won't apply until user clicks "Filter")
    const [formSearch, setFormSearch] = useState<string>('');
    const [formSupplierId, setFormSupplierId] = useState<number | null>(null);
    const [formDateFrom, setFormDateFrom] = useState<Date | undefined>(undefined);
    const [formDateTo, setFormDateTo] = useState<Date | undefined>(undefined);

    // Supplier autocomplete state
    const [formSupplierSearch, setFormSupplierSearch] = useState('');
    const [supplierPage, setSupplierPage] = useState(1);
    const [supplierOptions, setSupplierOptions] = useState<Array<{ value: number; label: string }>>([]);

    // Dialog states
    const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
    const [isRepaymentDialogOpen, setIsRepaymentDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
    const [editingRepaymentId, setEditingRepaymentId] = useState<number | null>(null);
    const [deletingItem, setDeletingItem] = useState<any | null>(null);

    // Forms
    const accountForm = useForm<SupplierAccountFormData>({
        resolver: zodResolver(supplierAccountSchema),
        defaultValues: {
            supplier: 0,
            total_turnover: 0,
            filial_debt: 0,
        },
    });

    const repaymentForm = useForm<SupplierDebtRepaymentFormData>({
        resolver: zodResolver(supplierDebtRepaymentSchema),
        defaultValues: {
            supplier: 0,
            employee: 0,
            date: new Date(),
            total_debt_old: 0,
            total_debt: 0,
            summa_total_dollar: 0,
            summa_dollar: 0,
            summa_naqt: 0,
            summa_kilik: 0,
            summa_terminal: 0,
            summa_transfer: 0,
        },
    });

    const {
        data: suppliersData,
        isLoading: isSuppliersLoading,
        isFetching: isSuppliersFetching,
    } = useSuppliers({
        page: supplierPage,
        limit: 50,
        search: formSupplierSearch || undefined,
        filial: selectedFilialId ?? undefined,
    });

    const { data: usersData } = useUsers({ limit: 1000 });
    const users = useMemo(() => usersData?.results || [], [usersData]);

    // Get dollar rate for repayment modal
    const { data: exchangeRatesData } = useExchangeRates(
        selectedFilialId ? { filial: selectedFilialId } : undefined,
    );
    const dollarRate = exchangeRatesData?.results?.[0]?.dollar || 12500;

    const suppliersResults = (suppliersData as any)?.results || [];
    const suppliersPagination = (suppliersData as any)?.pagination;
    const suppliersHasMore =
        !!suppliersPagination && suppliersPagination.lastPage > (suppliersPagination.currentPage || 1);

    useEffect(() => {
        const results = (suppliersData as any)?.results || [];
        if (supplierPage === 1) {
            setSupplierOptions(
                results.map((s: any) => ({ value: s.id, label: s.name || s.phone_number || `#${s.id}` })),
            );
        } else if (results.length > 0) {
            setSupplierOptions((prev) => [
                ...prev,
                ...results.map((s: any) => ({
                    value: s.id,
                    label: s.name || s.phone_number || `#${s.id}`,
                })),
            ]);
        }
    }, [suppliersData, supplierPage]);

    useEffect(() => {
        // reset pages/options when supplier search or filial changes
        setSupplierPage(1);
        setSupplierOptions([]);
    }, [formSupplierSearch, selectedFilialId]);

    // Fetch account by ID for editing
    const { data: accountData } = useSupplierAccountById(editingAccountId);
    useEffect(() => {
        if (accountData && editingAccountId) {
            accountForm.reset({
                supplier: accountData.supplier || 0,
                total_turnover: typeof accountData.total_turnover === 'string' ? parseFloat(accountData.total_turnover) : (accountData.total_turnover as number || 0),
                filial_debt: typeof accountData.filial_debt === 'string' ? parseFloat(accountData.filial_debt) : (accountData.filial_debt as number || 0),
            });
        }
    }, [accountData, editingAccountId, accountForm]);

    // Fetch repayment by ID for editing
    const { data: repaymentData } = useSupplierDebtRepaymentById(editingRepaymentId);
    useEffect(() => {
        if (repaymentData && editingRepaymentId) {
            repaymentForm.reset({
                supplier: repaymentData.supplier || 0,
                employee: repaymentData.employee || 0,
                date: repaymentData.date ? new Date(repaymentData.date) : new Date(),
                total_debt_old: repaymentData.total_debt_old || 0,
                total_debt: repaymentData.total_debt || 0,
                summa_total_dollar: parseFloat(repaymentData.summa_total_dollar || '0'),
                summa_dollar: parseFloat(repaymentData.summa_dollar || '0'),
                summa_naqt: parseFloat(repaymentData.summa_naqt || '0'),
                summa_kilik: parseFloat(repaymentData.summa_kilik || '0'),
                summa_terminal: parseFloat(repaymentData.summa_terminal || '0'),
                summa_transfer: parseFloat(repaymentData.summa_transfer || '0'),
            });
        }
    }, [repaymentData, editingRepaymentId, repaymentForm]);

    // Build params
    const params: Record<string, unknown> = {
        page,
        limit: ITEMS_PER_PAGE,
        filial: selectedFilialId ?? undefined,
    };
    if (search) params.search = search;
    if (supplierId) params.supplier = supplierId;
    if (dateFrom) params.date_from = moment(dateFrom).format('YYYY-MM-DD');
    if (dateTo) params.date_to = moment(dateTo).format('YYYY-MM-DD');

    const { data, isLoading } = useSupplierAccount(params);
    const { data: repaymentDataList, isLoading: isRepaymentLoading } = useSupplierDebtRepayment(params);

    // Check if results is direct array (supplier-account) or dateGroups
    const accountResults = data?.results || [];
    const isAccountDirectArray = accountResults.length > 0 && !(accountResults[0] as any)?.date && !(accountResults[0] as any)?.items;
    const accountItems = isAccountDirectArray ? (accountResults as any[]) : [];
    const accountDateGroups = isAccountDirectArray ? [] : (accountResults as any[]);

    const pagination = data?.pagination;
    const lastPage = pagination?.lastPage || 1;

    // Check if repayment results is direct array or dateGroups
    const repaymentResults = repaymentDataList?.results || [];
    // Check if first item has 'date' property directly (direct array) or has 'items' property (dateGroups)
    const isRepaymentDirectArray = repaymentResults.length > 0 &&
        (repaymentResults[0] as any)?.date !== undefined &&
        !(repaymentResults[0] as any)?.items;
    const repaymentItems = isRepaymentDirectArray ? (repaymentResults as any[]) : [];
    const repaymentDateGroups = isRepaymentDirectArray ? [] : (repaymentResults as any[]);
    const repaymentPagination = repaymentDataList?.pagination;
    const repaymentLastPage = repaymentPagination?.lastPage || 1;

    // Mutations
    const createAccount = useCreateSupplierAccount();
    const updateAccount = useUpdateSupplierAccount();
    const deleteAccount = useDeleteSupplierAccount();
    const createRepayment = useCreateSupplierDebtRepayment();
    const updateRepayment = useUpdateSupplierDebtRepayment();
    const deleteRepayment = useDeleteSupplierDebtRepayment();

    // Format currency helper
    const formatCurrency = (value: string | number | undefined) => {
        if (!value) return '0.00';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    const handleFilter = () => {
        setSearch(formSearch);
        setSupplierId(formSupplierId);
        setDateFrom(formDateFrom);
        setDateTo(formDateTo);
        setPage(1);
    };

    const handleClear = () => {
        setFormSearch('');
        setFormSupplierId(null);
        setFormDateFrom(undefined);
        setFormDateTo(undefined);

        setSearch('');
        setSupplierId(null);
        setDateFrom(undefined);
        setDateTo(undefined);
        setSupplierOptions([]);
        setPage(1);
    };

    const handleOpenAccountDialog = () => {
        setEditingAccountId(null);
        accountForm.reset({
            supplier: 0,
            total_turnover: 0,
            filial_debt: 0,
        });
        setIsAccountDialogOpen(true);
    };

    const handleEditAccount = (item: any) => {
        setEditingAccountId(item.id);
        setIsAccountDialogOpen(true);
    };

    const handleCloseAccountDialog = () => {
        setIsAccountDialogOpen(false);
        setEditingAccountId(null);
        accountForm.reset();
    };

    const handleSubmitAccount = async (values: SupplierAccountFormData) => {
        try {
            if (editingAccountId) {
                await updateAccount.mutateAsync({ id: editingAccountId, payload: values });
                showSuccess('Mening qarzlarim muvaffaqiyatli yangilandi');
            } else {
                await createAccount.mutateAsync({
                    supplier: values.supplier,
                    total_turnover: values.total_turnover,
                    filial_debt: values.filial_debt,
                });
                showSuccess('Mening qarzlarim muvaffaqiyatli qo\'shildi');
            }
            handleCloseAccountDialog();
        } catch (error: any) {
            showError(error?.response?.data?.detail || 'Xatolik yuz berdi');
        }
    };

    const handleOpenRepaymentDialog = () => {
        setEditingRepaymentId(null);
        repaymentForm.reset({
            supplier: 0,
            employee: 0,
            date: new Date(),
            total_debt_old: 0,
            total_debt: 0,
            summa_total_dollar: 0,
            summa_dollar: 0,
            summa_naqt: 0,
            summa_kilik: 0,
            summa_terminal: 0,
            summa_transfer: 0,
        });
        setIsRepaymentDialogOpen(true);
    };

    const handleEditRepayment = (item: any) => {
        setEditingRepaymentId(item.id);
        setIsRepaymentDialogOpen(true);
    };

    const handleCloseRepaymentDialog = () => {
        setIsRepaymentDialogOpen(false);
        setEditingRepaymentId(null);
        repaymentForm.reset();
    };

    // Watch repayment form values for auto-calculation
    const summaDollar = repaymentForm.watch('summa_dollar') || 0;
    const summaNaqt = repaymentForm.watch('summa_naqt') || 0;
    const summaKilik = repaymentForm.watch('summa_kilik') || 0;
    const summaTerminal = repaymentForm.watch('summa_terminal') || 0;
    const summaTransfer = repaymentForm.watch('summa_transfer') || 0;

    // Auto-calculate total dollar based on inputs
    useEffect(() => {
        if (!isRepaymentDialogOpen) return;
        const totalInSom = summaNaqt + summaKilik + summaTerminal + summaTransfer;
        const totalInDollar = summaDollar + (totalInSom / dollarRate);
        repaymentForm.setValue('summa_total_dollar', parseFloat(totalInDollar.toFixed(2)));
    }, [summaDollar, summaNaqt, summaKilik, summaTerminal, summaTransfer, dollarRate, repaymentForm, isRepaymentDialogOpen]);

    const handleSubmitRepayment = async (values: SupplierDebtRepaymentFormData) => {
        try {
            const payload = {
                supplier: values.supplier,
                employee: values.employee,
                date: moment(values.date).format('YYYY-MM-DD'),
                total_debt_old: values.total_debt_old,
                total_debt: values.total_debt,
                summa_total_dollar: values.summa_total_dollar,
                summa_dollar: values.summa_dollar,
                summa_naqt: values.summa_naqt,
                summa_kilik: values.summa_kilik,
                summa_terminal: values.summa_terminal,
                summa_transfer: values.summa_transfer,
            };
            if (editingRepaymentId) {
                await updateRepayment.mutateAsync({ id: editingRepaymentId, payload });
                showSuccess('To\'langan qarzlar muvaffaqiyatli yangilandi');
            } else {
                await createRepayment.mutateAsync(payload);
                showSuccess('To\'langan qarzlar muvaffaqiyatli qo\'shildi');
            }
            handleCloseRepaymentDialog();
        } catch (error: any) {
            showError(error?.response?.data?.detail || 'Xatolik yuz berdi');
        }
    };

    const handleDelete = (item: any) => {
        setDeletingItem(item);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        try {
            if (activeTab === 'account') {
                await deleteAccount.mutateAsync(deletingItem.id);
                showSuccess('Mening qarzlarim muvaffaqiyatli o\'chirildi');
            } else {
                await deleteRepayment.mutateAsync(deletingItem.id);
                showSuccess('To\'langan qarzlar muvaffaqiyatli o\'chirildi');
            }
            setIsDeleteDialogOpen(false);
            setDeletingItem(null);
        } catch (error: any) {
            showError(error?.response?.data?.detail || 'Xatolik yuz berdi');
        }
    };

    return (
        <div className='space-y-6'>
            <Card>
                <CardHeader>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                        <div className='flex items-center gap-2'>
                            <CardTitle className='whitespace-nowrap'>
                                {activeTab === 'account' ? 'Mening qarzlarim' : 'To\'langan qarzlar'}
                            </CardTitle>

                        </div>
                        <SupplierAccountFilters
                            formSearch={formSearch}
                            setFormSearch={setFormSearch}
                            formSupplierId={formSupplierId}
                            setFormSupplierId={setFormSupplierId}
                            formSupplierSearch={formSupplierSearch}
                            setFormSupplierSearch={setFormSupplierSearch}
                            supplierOptions={supplierOptions}
                            supplierPage={supplierPage}
                            setSupplierPage={setSupplierPage}
                            suppliersHasMore={suppliersHasMore}
                            isSuppliersLoading={isSuppliersLoading}
                            isSuppliersFetching={isSuppliersFetching}
                            formDateFrom={formDateFrom}
                            setFormDateFrom={setFormDateFrom}
                            formDateTo={formDateTo}
                            setFormDateTo={setFormDateTo}
                            onFilter={handleFilter}
                            onClear={handleClear}
                        />
                        <Button onClick={activeTab === 'account' ? handleOpenAccountDialog : handleOpenRepaymentDialog} size='sm'>
                            <Plus className='h-4 w-4 mr-2' />
                            Qo'shish
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className='grid w-full grid-cols-2 bg-gray-100 p-1'>
                            <TabsTrigger
                                value='account'
                                className='data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md'
                            >
                                Mening qarzlarim
                            </TabsTrigger>
                            <TabsTrigger
                                value='repayment'
                                className='data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md'
                            >
                                To'langan qarzlar
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value='account' className='mt-4'>
                            <SupplierAccountTable
                                dateGroups={accountDateGroups}
                                items={accountItems}
                                isLoading={isLoading}
                                lastPage={lastPage}
                                page={page}
                                setPage={setPage}
                                formatCurrency={formatCurrency}
                                activeTab={activeTab}
                                onEdit={handleEditAccount}
                                onDelete={handleDelete}
                            />
                        </TabsContent>
                        <TabsContent value='repayment' className='mt-4'>
                            <SupplierAccountTable
                                dateGroups={repaymentDateGroups}
                                items={repaymentItems}
                                isLoading={isRepaymentLoading}
                                lastPage={repaymentLastPage}
                                page={page}
                                setPage={setPage}
                                formatCurrency={formatCurrency}
                                activeTab={activeTab}
                                onEdit={handleEditRepayment}
                                onDelete={handleDelete}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Supplier Account Dialog */}
            <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle>{editingAccountId ? 'Tahrirlash' : 'Yangi qo\'shish'}</DialogTitle>
                        <DialogDescription>Mening qarzlarim ma'lumotlarini kiriting</DialogDescription>
                    </DialogHeader>
                    <Form {...accountForm}>
                        <form onSubmit={accountForm.handleSubmit(handleSubmitAccount)} className='space-y-4'>
                            <FormField
                                control={accountForm.control}
                                name='supplier'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ta'minotchi <span className='text-destructive'>*</span></FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(Number(value))}
                                            value={field.value ? String(field.value) : ''}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Ta'minotchini tanlang" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {supplierOptions.map((s) => (
                                                    <SelectItem key={s.value} value={String(s.value)}>
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={accountForm.control}
                                name='total_turnover'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jami aylanma <span className='text-destructive'>*</span></FormLabel>
                                        <FormControl>
                                            <NumberInput
                                                value={String(field.value ?? 0)}
                                                onChange={(val) => field.onChange(val === '' ? 0 : parseFloat(val))}
                                                placeholder='0.00'
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={accountForm.control}
                                name='filial_debt'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Filial qarzi <span className='text-destructive'>*</span></FormLabel>
                                        <FormControl>
                                            <NumberInput
                                                value={String(field.value ?? 0)}
                                                onChange={(val) => field.onChange(val === '' ? 0 : parseFloat(val))}
                                                placeholder='0.00'
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type='button' variant='outline' onClick={handleCloseAccountDialog}>
                                    Bekor qilish
                                </Button>
                                <Button type='submit' disabled={createAccount.isPending || updateAccount.isPending}>
                                    {(createAccount.isPending || updateAccount.isPending) && (
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    )}
                                    {editingAccountId ? 'Saqlash' : 'Qo\'shish'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Supplier Debt Repayment Dialog */}
            <Dialog open={isRepaymentDialogOpen} onOpenChange={setIsRepaymentDialogOpen}>
                <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>{editingRepaymentId ? 'Tahrirlash' : 'Yangi qo\'shish'}</DialogTitle>
                        <DialogDescription>
                            To'langan qarzlar ma'lumotlarini kiriting. Kurs: {formatCurrency(dollarRate)} UZS
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...repaymentForm}>
                        <form onSubmit={repaymentForm.handleSubmit(handleSubmitRepayment)} className='space-y-4'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField
                                    control={repaymentForm.control}
                                    name='supplier'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ta'minotchi <span className='text-destructive'>*</span></FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(Number(value))}
                                                value={field.value ? String(field.value) : ''}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Ta'minotchini tanlang" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {supplierOptions.map((s) => (
                                                        <SelectItem key={s.value} value={String(s.value)}>
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={repaymentForm.control}
                                    name='employee'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Xodim <span className='text-destructive'>*</span></FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(Number(value))}
                                                value={field.value ? String(field.value) : ''}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Xodimni tanlang' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {users.map((u) => (
                                                        <SelectItem key={u.id} value={String(u.id)}>
                                                            {u.full_name || u.username}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={repaymentForm.control}
                                name='date'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sana <span className='text-destructive'>*</span></FormLabel>
                                        <FormControl>
                                            <DatePicker date={field.value} onDateChange={field.onChange} className='w-full' />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField
                                    control={repaymentForm.control}
                                    name='total_debt_old'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Eski qarz <span className='text-destructive'>*</span></FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    value={String(field.value ?? 0)}
                                                    onChange={(val) => field.onChange(val === '' ? 0 : parseFloat(val))}
                                                    placeholder='0.00'
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={repaymentForm.control}
                                    name='total_debt'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Jami qarz <span className='text-destructive'>*</span></FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    value={String(field.value ?? 0)}
                                                    onChange={(val) => field.onChange(val === '' ? 0 : parseFloat(val))}
                                                    placeholder='0.00'
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField
                                    control={repaymentForm.control}
                                    name='summa_total_dollar'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Jami to'lov ($) <span className='text-destructive'>*</span></FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    value={String(field.value ?? 0)}
                                                    onChange={(val) => field.onChange(val === '' ? 0 : parseFloat(val))}
                                                    placeholder='0.00'
                                                    readOnly
                                                    className='bg-muted cursor-not-allowed'
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={repaymentForm.control}
                                    name='summa_dollar'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dollar to'lovi <span className='text-destructive'>*</span></FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    value={String(field.value ?? 0)}
                                                    onChange={(val) => field.onChange(val === '' ? 0 : parseFloat(val))}
                                                    placeholder='0.00'
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField
                                    control={repaymentForm.control}
                                    name='summa_naqt'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Naqt to'lovi <span className='text-destructive'>*</span></FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    value={String(field.value ?? 0)}
                                                    onChange={(val) => field.onChange(val === '' ? 0 : parseFloat(val))}
                                                    placeholder='0.00'
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={repaymentForm.control}
                                    name='summa_kilik'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kilik to'lovi <span className='text-destructive'>*</span></FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    value={String(field.value ?? 0)}
                                                    onChange={(val) => field.onChange(val === '' ? 0 : parseFloat(val))}
                                                    placeholder='0.00'
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField
                                    control={repaymentForm.control}
                                    name='summa_terminal'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Terminal to'lovi <span className='text-destructive'>*</span></FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    value={String(field.value ?? 0)}
                                                    onChange={(val) => field.onChange(val === '' ? 0 : parseFloat(val))}
                                                    placeholder='0.00'
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={repaymentForm.control}
                                    name='summa_transfer'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Transfer to'lovi <span className='text-destructive'>*</span></FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    value={String(field.value ?? 0)}
                                                    onChange={(val) => field.onChange(val === '' ? 0 : parseFloat(val))}
                                                    placeholder='0.00'
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <Button type='button' variant='outline' onClick={handleCloseRepaymentDialog}>
                                    Bekor qilish
                                </Button>
                                <Button type='submit' disabled={createRepayment.isPending || updateRepayment.isPending}>
                                    {(createRepayment.isPending || updateRepayment.isPending) && (
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    )}
                                    {editingRepaymentId ? 'Saqlash' : 'Qo\'shish'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>O'chirishni tasdiqlash</AlertDialogTitle>
                        <AlertDialogDescription>
                            Haqiqatan ham bu yozuvni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            {(deleteAccount.isPending || deleteRepayment.isPending) && (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            )}
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
