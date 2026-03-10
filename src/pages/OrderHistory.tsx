import { Fragment, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { DateRangePicker } from '@/components/ui/date-picker';
import { useOrderHistory, useOrderHistoryDebtorProduct, ORDER_HISTORY_KEYS } from '@/hooks/api/useOrderHistory';
import { orderHistoryService } from '@/services/orderHistory.service';
import { showSuccess, showError } from '@/lib/toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/api/useUsers';
import { Loader2, Eye, Package, SearchIcon, X, CheckCircle2, CheckSquare2, ShoppingCart, AlertTriangle } from 'lucide-react';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useClients } from '@/hooks/api/useClients';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import clsx from 'clsx';
import { useRole } from '@/hooks/useRole';

const ITEMS_PER_PAGE = 5;

// Shared component for order history table
function OrderHistoryTable({
    dateGroups,
    isLoading,
    lastPage,
    page,
    setPage,
    formatCurrency,
    navigate,
    user,
}: {
    dateGroups: any[];
    isLoading: boolean;
    lastPage: number;
    page: number;
    setPage: (page: number) => void;
    formatCurrency: (value: string | number | undefined) => string;
    navigate: (path: string) => void;
    user: any;
}) {
    const roles = useRole();
    const isAdminOrSuperAdmin = roles.isAdmin || roles.isSuperAdmin;
    const queryClient = useQueryClient();
    const [confirmUpdateModalOpen, setConfirmUpdateModalOpen] = useState(false);
    const [endedOrderModalOpen, setEndedOrderModalOpen] = useState(false);
    const [orderToConfirm, setOrderToConfirm] = useState<any>(null);
    const [confirmingOrderId, setConfirmingOrderId] = useState<number | null>(null);

    const handleOpenConfirmModal = (order: any) => {
        setOrderToConfirm(order);
        setConfirmUpdateModalOpen(true);
    };
    const handleOpenEndedOrderModal = (order: any) => {
        setOrderToConfirm(order);
        setEndedOrderModalOpen(true);
    };

    const handleApproveUpdate = async () => {
        if (!orderToConfirm) return;
        setConfirmingOrderId(orderToConfirm.id);
        try {
            await orderHistoryService.confirmUpdateStatus(orderToConfirm.id, 0);
            showSuccess('Buyurtma muvaffaqiyatli tasdiqlandi');
            queryClient.invalidateQueries({ queryKey: ORDER_HISTORY_KEYS.all });
            setConfirmUpdateModalOpen(false);
            setOrderToConfirm(null);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { detail?: string } }; message?: string };
            const errorMessage = err?.response?.data?.detail || err?.message || 'Tasdiqlashda xatolik yuz berdi';
            showError(errorMessage);
        } finally {
            setConfirmingOrderId(null);
        }
    };
    const handleEndedOrderApprove = async () => {
        if (!orderToConfirm) return;
        setConfirmingOrderId(orderToConfirm.id);
        try {
            await orderHistoryService.patchOrderStatus(orderToConfirm.id, true);
            showSuccess('Buyurtma muvaffaqiyatli yakunlandi');
            queryClient.invalidateQueries({ queryKey: ORDER_HISTORY_KEYS.all });
            setEndedOrderModalOpen(false);
            setOrderToConfirm(null);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || error?.message || 'Yakunlashda xatolik yuz berdi';
            showError(errorMessage);
        } finally {
            setConfirmingOrderId(null);
        }
    };

    if (isLoading) {
        return (
            <div className='flex items-center justify-center py-10'>
                <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
        );
    }

    if (dateGroups.length === 0) {
        return (
            <div className='flex flex-col items-center justify-center py-10 text-center'>
                <Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
                <p className='text-muted-foreground'>Buyurtmalar topilmadi</p>
            </div>
        );
    }

    return (
        <>
            <div className='rounded-md border'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='w-[60px]'>t/r</TableHead>
                            <TableHead className='w-[110px]'>Sana</TableHead>
                            <TableHead>Mijoz</TableHead>
                            <TableHead>Kim buyurtma oldi</TableHead>
                            <TableHead className='text-right'>To'lanadigan summa($)</TableHead>
                            <TableHead className='text-right'>To'langan summa($)</TableHead>
                            <TableHead className='text-right'>Qaytim</TableHead>
                            <TableHead className='text-right'>Bugungi qarz($)</TableHead>
                            <TableHead className='text-right'>Umumiy qolgan qarz($)</TableHead>
                            {isAdminOrSuperAdmin && <TableHead className='text-right'>Jami foyda($)</TableHead>}
                            <TableHead className='text-right'>Yaratilgan vaqt</TableHead>
                            <TableHead className='text-right'>Buyurtma holati</TableHead>
                            {isAdminOrSuperAdmin && <TableHead className='text-right'>Keshbek($)</TableHead>}
                            <TableHead className='text-right'>Amallar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dateGroups.map((group, groupIdx: number) => {
                            return (
                                <Fragment key={`group-${group.date}-${groupIdx}`}>
                                    {group.items.map((it, idx: number) => {
                                        const payable = parseFloat(
                                            it.all_product_summa || it.summa_total_dollar || '0',
                                        );
                                        const paid =
                                            parseFloat(it.summa_dollar || '0') +
                                            parseFloat(it.summa_naqt || '0') +
                                            parseFloat(it.summa_kilik || '0') +
                                            parseFloat(it.summa_terminal || '0') +
                                            parseFloat(it.summa_transfer || '0');
                                        const changeDollar = parseFloat(it.zdacha_dollar || '0');
                                        const changeSom = parseFloat(it.zdacha_som || '0');
                                        const todayDebt = parseFloat(it.total_debt_today_client || '0');
                                        const totalDebt = parseFloat(
                                            it.client_detail?.total_debt || it.total_debt_client || '0',
                                        );
                                        const totalProfit = parseFloat(it.all_profit_dollar || '0');

                                        return (
                                            <TableRow key={it.id}>
                                                {' '}
                                                <TableCell className='font-medium flex items-center gap-1'>
                                                    {it.number || it.order || '-'}
                                                </TableCell>
                                                {idx === 0 && (
                                                    <TableCell
                                                        rowSpan={group.items.length}
                                                        className='font-medium align-top'
                                                    >
                                                        <div className='flex items-start gap-2'>
                                                            <span>{moment(group.date).format('DD.MM.YYYY')}</span>
                                                        </div>
                                                    </TableCell>
                                                )}
                                                <TableCell
                                                    className={clsx(
                                                        'p-1 text-left text-gray-800 text-xs',
                                                        it.update_status === 1
                                                            ? '!bg-amber-100 group-hover:!bg-amber-200/70 dark:!bg-amber-900/30 '
                                                            : !it.order_status
                                                                ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                : 'group-hover:bg-blue-50/30',
                                                    )}
                                                >
                                                    <span className='inline-flex items-center gap-1'>
                                                        {it.client_detail?.full_name ||
                                                            `ID: ${it.client}`}
                                                        {(roles.isAdmin || roles.isSuperAdmin) &&
                                                            it?.price_difference && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span className='inline-flex items-center text-orange-500 '>
                                                                            <AlertTriangle size={20} />
                                                                        </span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className='!bg-orange-100 !text-orange-800 !border-orange-300'>
                                                                        Mahsulot narxida tafovut
                                                                        aniqlandi
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                    </span>

                                                </TableCell>
                                                <TableCell
                                                    className={clsx(
                                                        'p-1 text-left text-gray-800 text-xs',
                                                        it.update_status === 1
                                                            ? '!bg-amber-100 group-hover:!bg-amber-200/70 dark:!bg-amber-900/30 '
                                                            : !it.order_status
                                                                ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                : 'group-hover:bg-blue-50/30',
                                                    )}
                                                >
                                                    {it.created_by_detail?.full_name || '-'}
                                                </TableCell>
                                                <TableCell
                                                    className={clsx(
                                                        'text-right text-blue-600 font-semibold',
                                                        it.update_status === 1
                                                            ? '!bg-amber-100 group-hover:!bg-amber-200/70 dark:!bg-amber-900/30 '
                                                            : !it.order_status
                                                                ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                : 'group-hover:bg-blue-50/30',
                                                    )}
                                                >
                                                    <Link to={`/order-history/${it.id}`}>
                                                        {formatCurrency(payable)}
                                                    </Link>
                                                </TableCell>
                                                <TableCell
                                                    className={clsx(
                                                        'text-right',
                                                        it.update_status === 1
                                                            ? '!bg-amber-100 group-hover:!bg-amber-200/70 dark:!bg-amber-900/30 '
                                                            : !it.order_status
                                                                ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                : 'group-hover:bg-blue-50/30',
                                                    )}
                                                >
                                                    {formatCurrency(paid)}
                                                </TableCell>
                                                <TableCell
                                                    className={clsx(
                                                        'text-right',
                                                        it.update_status === 1
                                                            ? '!bg-amber-100 group-hover:!bg-amber-200/70 dark:!bg-amber-900/30 '
                                                            : !it.order_status
                                                                ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                : 'group-hover:bg-blue-50/30',
                                                    )}
                                                >
                                                    {formatCurrency(changeDollar)}
                                                </TableCell>
                                                <TableCell
                                                    className={clsx(
                                                        'text-right',
                                                        it.update_status === 1
                                                            ? '!bg-amber-100 group-hover:!bg-amber-200/70 dark:!bg-amber-900/30 '
                                                            : !it.order_status
                                                                ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                : 'group-hover:bg-blue-50/30',
                                                    )}
                                                >
                                                    {formatCurrency(todayDebt)}
                                                </TableCell>
                                                <TableCell
                                                    className={clsx(
                                                        'text-right text-red-600 dark:text-red-400 font-semibold',
                                                        it.update_status === 1
                                                            ? '!bg-amber-100 group-hover:!bg-amber-200/70 dark:!bg-amber-900/30 '
                                                            : !it.order_status
                                                                ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                : 'group-hover:bg-blue-50/30',
                                                    )}
                                                >
                                                    {formatCurrency(totalDebt)}
                                                </TableCell>
                                                {isAdminOrSuperAdmin && (
                                                    <TableCell
                                                        className={clsx(
                                                            'text-right text-green-600 dark:text-green-400 font-semibold',
                                                            it.update_status === 1
                                                                ? '!bg-amber-100 group-hover:!bg-amber-200/70 dark:!bg-amber-900/30 '
                                                                : !it.order_status
                                                                    ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                    : 'group-hover:bg-blue-50/30',
                                                        )}
                                                    >
                                                    {formatCurrency(totalProfit)}
                                                </TableCell>
                                                )}
                                                <TableCell
                                                    className={clsx(
                                                        'text-right',
                                                        it.update_status === 1
                                                            ? '!bg-amber-100 group-hover:!bg-amber-200/70 dark:!bg-amber-900/30 '
                                                            : !it.order_status
                                                                ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                : 'group-hover:bg-blue-50/30',
                                                    )}
                                                >
                                                    {it.created_time
                                                        ? moment(it.created_time).format('DD.MM.YYYY HH:mm')
                                                        : '-'}
                                                </TableCell>
                                                <TableCell
                                                    className={clsx(
                                                        'text-right',
                                                        it.update_status === 1
                                                            ? '!bg-amber-100 group-hover:!bg-amber-200/70 dark:!bg-amber-900/30 '
                                                            : !it.order_status
                                                                ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                : 'group-hover:bg-blue-50/30',
                                                    )}
                                                ></TableCell>
                                                {isAdminOrSuperAdmin && (
                                                    <TableCell
                                                        className={clsx(
                                                            'text-right',
                                                            it.update_status === 1
                                                                ? '!bg-amber-100 group-hover:!bg-amber-200/70 dark:!bg-amber-900/30 '
                                                                : !it.order_status
                                                                    ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                    : 'group-hover:bg-blue-50/30',
                                                        )}
                                                    >
                                                    {formatCurrency(it.client_detail?.keshbek || '0')}
                                                </TableCell>
                                                )}
                                                <TableCell
                                                    className={clsx(
                                                        'text-right',
                                                        it.update_status === 1
                                                            ? '!bg-amber-100 group-hover:!bg-amber-200/70 dark:!bg-amber-900/30 '
                                                            : !it.order_status
                                                                ? 'bg-red-50 dark:bg-[#7b5858]'
                                                                : 'group-hover:bg-blue-50/30',
                                                    )}
                                                >
                                                    <div className='flex items-center justify-end gap-1'>
                                                        {it.order_status === false && (
                                                            <button
                                                                onClick={() => handleOpenEndedOrderModal(it)}
                                                                disabled={confirmingOrderId === it.id}
                                                                className='p-1 rounded hover:bg-red-200 text-red-700 transition-colors disabled:opacity-50'
                                                                title='Tasdiqlash'
                                                            >
                                                                <CheckSquare2 size={15} />
                                                            </button>
                                                        )}
                                                        {it.update_status === 1 && (
                                                            <button
                                                                onClick={() => handleOpenConfirmModal(it)}
                                                                className='p-1 rounded hover:bg-yellow-200 text-yellow-700 transition-colors'
                                                                title='Tasdiqlash'
                                                            >
                                                                <CheckCircle2 size={15} />
                                                            </button>
                                                        )}
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            className='h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                                                            onClick={() => navigate(`/order-history/${it.id}`)}
                                                        >
                                                            <Eye size={15} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </Fragment>
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
                                        <PaginationLink onClick={() => setPage(pageNum)} isActive={pageNum === page}>
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
            {/* Confirm update_status Modal */}
            {confirmUpdateModalOpen && (
                <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-yellow-200'>
                        <div className='flex justify-between items-center p-5 border-b-2 border-yellow-100 bg-yellow-50'>
                            <h3 className='text-xl font-bold text-gray-900'>Buyurtmani tasdiqlash</h3>
                            <button
                                onClick={() => {
                                    setConfirmUpdateModalOpen(false);
                                    setOrderToConfirm(null);
                                }}
                                disabled={confirmingOrderId !== null}
                                className='text-gray-500 hover:text-yellow-600 hover:bg-white p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className='p-6 bg-white'>
                            <p className='text-gray-700 mb-4'>
                                Buyurtma #{orderToConfirm?.id} ni tasdiqlaysizmi? Tasdiqlangandan so'ng o'zgarish qabul
                                qilinadi.
                            </p>
                            {orderToConfirm?.note && (
                                <div className='mb-5 rounded-lg border border-yellow-200 bg-yellow-50 p-3'>
                                    <p className='text-[11px] font-semibold text-yellow-700 mb-1'>Izoh:</p>
                                    <p className='text-sm text-gray-700 whitespace-pre-wrap'>{orderToConfirm.note}</p>
                                </div>
                            )}
                            <div className='flex gap-3 justify-end'>
                                <button
                                    onClick={() => {
                                        setConfirmUpdateModalOpen(false);
                                        setOrderToConfirm(null);
                                    }}
                                    disabled={confirmingOrderId !== null}
                                    className='px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleApproveUpdate}
                                    disabled={confirmingOrderId !== null}
                                    className='px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-all duration-200 font-semibold text-xs shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'
                                >
                                    {confirmingOrderId !== null ? (
                                        <>
                                            <Loader2 className='w-4 h-4 animate-spin' />
                                            <span>Tasdiqlanmoqda...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className='w-4 h-4' />
                                            <span>Ha, tasdiqlash</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {endedOrderModalOpen && (
                <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-200'>
                        <div className='flex justify-between items-center p-5 border-b-2 border-red-100 bg-red-50'>
                            <h3 className='text-xl font-bold text-gray-900'>Buyurtmani tasdiqlash</h3>
                            <button
                                onClick={() => {
                                    setEndedOrderModalOpen(false);
                                    setOrderToConfirm(null);
                                }}
                                disabled={confirmingOrderId !== null}
                                className='text-gray-500 hover:text-red-600 hover:bg-white p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className='p-6 bg-white'>
                            <p className='text-gray-700 mb-4'>Buyurtma #{orderToConfirm?.id} ni tasdiqlaysizmi?</p>
                            {orderToConfirm?.note && (
                                <div className='mb-5 rounded-lg border border-red-200 bg-red-50 p-3'>
                                    <p className='text-[11px] font-semibold text-red-700 mb-1'>Izoh:</p>
                                    <p className='text-sm text-gray-700 whitespace-pre-wrap'>{orderToConfirm.note}</p>
                                </div>
                            )}
                            <div className='flex gap-3 justify-end'>
                                <button
                                    onClick={() => {
                                        setEndedOrderModalOpen(false);
                                        setOrderToConfirm(null);
                                    }}
                                    disabled={confirmingOrderId !== null}
                                    className='px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleEndedOrderApprove}
                                    disabled={confirmingOrderId !== null}
                                    className='px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all duration-200 font-semibold text-xs shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'
                                >
                                    {confirmingOrderId !== null ? (
                                        <>
                                            <Loader2 className='w-4 h-4 animate-spin' />
                                            <span>Tasdiqlanmoqda...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className='w-4 h-4' />
                                            <span>Ha, tasdiqlash</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Filter component
function OrderHistoryFilters({
    formSearch,
    setFormSearch,
    formClientId,
    setFormClientId,
    formClientSearch,
    setFormClientSearch,
    clientOptions,
    clientPage,
    setClientPage,
    clientsHasMore,
    isClientsLoading,
    isClientsFetching,
    formEmployee,
    setFormEmployee,
    users,
    formStatus,
    setFormStatus,
    formPriceDifference,
    setFormPriceDifference,
    formDateFrom,
    setFormDateFrom,
    formDateTo,
    setFormDateTo,
    onFilter,
    onClear,
}: {
    formSearch: string;
    setFormSearch: (value: string) => void;
    formClientId: number | null;
    setFormClientId: (value: number | null) => void;
    formClientSearch: string;
    setFormClientSearch: (value: string) => void;
    clientOptions: Array<{ value: number; label: string }>;
    clientPage: number;
    setClientPage: (page: number) => void;
    clientsHasMore: boolean;
    isClientsLoading: boolean;
    isClientsFetching: boolean;
    formEmployee: number | null;
    setFormEmployee: (value: number | null) => void;
    users: any[];
    formStatus: string;
    setFormStatus: (value: string) => void;
    formPriceDifference: string;
    setFormPriceDifference: (value: string) => void;
    formDateFrom: Date | undefined;
    setFormDateFrom: (value: Date | undefined) => void;
    formDateTo: Date | undefined;
    setFormDateTo: (value: Date | undefined) => void;
    onFilter: () => void;
    onClear: () => void;
}) {
    const roles = useRole();
    return (
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
                        if (clientsHasMore) setClientPage(clientPage + 1);
                    }}
                    hasMore={clientsHasMore}
                    isLoading={isClientsLoading}
                    isLoadingMore={isClientsFetching}
                />
            </div>

            <div className='w-full sm:w-auto'>
                <Autocomplete
                    options={[
                        { value: 0, label: 'Barcha xodimlar' },
                        ...users.map((u: any) => ({ value: u.id, label: u.full_name || u.username })),
                    ]}
                    value={formEmployee ?? 0}
                    onValueChange={(v) => setFormEmployee(Number(v) === 0 ? null : Number(v))}
                    placeholder='Barcha xodimlar'
                    className='w-full sm:min-w-[180px]'
                />
            </div>

            <div className='w-full sm:w-auto'>
                <Autocomplete
                    options={[
                        { value: 'all', label: 'Barchasi' },
                        { value: 'completed', label: 'Yakunlangan' },
                        { value: 'pending', label: 'Korzinkada' },
                    ]}
                    value={formStatus}
                    onValueChange={(v) => setFormStatus(String(v))}
                    placeholder='Barcha holatlar'
                    className='w-full sm:min-w-[140px]'
                />
            </div>
            {(roles.isAdmin || roles.isSuperAdmin) && (
                <div className='w-full sm:w-auto'>
                    <Autocomplete
                        options={[
                            { value: 'all', label: 'Barchasi' },
                            { value: 'diff', label: 'Tafovutli mahsulotlar' }
                        ]}
                        value={formPriceDifference}
                        onValueChange={(v) => setFormPriceDifference(String(v))}
                        placeholder='Narx tafovuti'
                        className='w-full sm:min-w-[140px]'
                    />
                </div>
            )}


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

export default function OrderHistoryPage() {
    const { selectedFilialId, user } = useAuthContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab') || 'sales';
    const [activeTab, setActiveTab] = useState(tabFromUrl);
    const [page, setPage] = useState(1);

    // Update URL when tab changes (only if different from URL)
    useEffect(() => {
        const currentTab = searchParams.get('tab') || 'sales';
        if (activeTab !== currentTab) {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('tab', activeTab);
            setSearchParams(newParams, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Update tab when URL changes (only on mount or when URL changes externally)
    useEffect(() => {
        const urlTab = searchParams.get('tab') || 'sales';
        if ((urlTab === 'sales' || urlTab === 'debtor') && urlTab !== activeTab) {
            setActiveTab(urlTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

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
    const [formPriceDifference, setFormPriceDifference] = useState<string>('all');
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
    if (formPriceDifference !== 'all') params.price_difference = formPriceDifference === 'diff' ? true : false;
    const { data, isLoading } = useOrderHistory(params);
    const { data: debtorData, isLoading: isDebtorLoading } = useOrderHistoryDebtorProduct(params);

    const dateGroups = data?.results || [];
    const pagination = data?.pagination;
    const lastPage = pagination?.lastPage || 1;

    const debtorDateGroups = debtorData?.results || [];
    const debtorPagination = debtorData?.pagination;
    const debtorLastPage = debtorPagination?.lastPage || 1;

    // Format currency helper
    const formatCurrency = (value: string | number | undefined) => {
        if (!value) return '0.00';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    const navigate = useNavigate();

    const handleFilter = () => {
        setSearch(formSearch);
        setClientId(formClientId);
        setEmployee(formEmployee);
        setStatus(formStatus);
        setDateFrom(formDateFrom);
        setDateTo(formDateTo);
        setPage(1);
    };

    const handleClear = () => {
        setFormSearch('');
        setFormClientId(null);
        setFormEmployee(null);
        setFormStatus('all');
        setFormPriceDifference('all');
        setFormDateFrom(undefined);
        setFormDateTo(undefined);

        setSearch('');
        setClientId(null);
        setEmployee(null);
        setStatus('all');
        setFormPriceDifference('all');
        setDateFrom(undefined);
        setDateTo(undefined);
        setClientOptions([]);
        setPage(1);
    };

    return (
        <div className='space-y-6'>
            <Card>
                <CardHeader>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                        <OrderHistoryFilters
                            formSearch={formSearch}
                            setFormSearch={setFormSearch}
                            formClientId={formClientId}
                            setFormClientId={setFormClientId}
                            formClientSearch={formClientSearch}
                            setFormClientSearch={setFormClientSearch}
                            clientOptions={clientOptions}
                            clientPage={clientPage}
                            setClientPage={setClientPage}
                            clientsHasMore={clientsHasMore}
                            isClientsLoading={isClientsLoading}
                            isClientsFetching={isClientsFetching}
                            formEmployee={formEmployee}
                            setFormEmployee={setFormEmployee}
                            users={users}
                            formStatus={formStatus}
                            setFormStatus={setFormStatus}
                            formDateFrom={formDateFrom}
                            setFormDateFrom={setFormDateFrom}
                            formDateTo={formDateTo}
                            setFormDateTo={setFormDateTo}
                            formPriceDifference={formPriceDifference}
                            setFormPriceDifference={setFormPriceDifference}
                            onFilter={handleFilter}
                            onClear={handleClear}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4'>
                        <TabsList className='grid w-full grid-cols-2 bg-gray-100 dark:bg-muted p-1 mb-4'>
                            <TabsTrigger
                                value='sales'
                                className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-colors hover:text-foreground dark:hover:text-foreground'
                            >
                                Savdo ro'yxati
                            </TabsTrigger>
                            <TabsTrigger
                                value='debtor'
                                className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-colors hover:text-foreground dark:hover:text-foreground'
                            >
                                Mijozdan qarzdorlik
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value='sales' className=''>
                            <OrderHistoryTable
                                dateGroups={dateGroups}
                                isLoading={isLoading}
                                lastPage={lastPage}
                                page={page}
                                setPage={setPage}
                                formatCurrency={formatCurrency}
                                navigate={navigate}
                                user={user}
                            />
                        </TabsContent>
                        <TabsContent value='debtor' className=''>
                            <OrderHistoryTable
                                dateGroups={debtorDateGroups}
                                isLoading={isDebtorLoading}
                                lastPage={debtorLastPage}
                                page={page}
                                setPage={setPage}
                                formatCurrency={formatCurrency}
                                navigate={navigate}
                                user={user}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
