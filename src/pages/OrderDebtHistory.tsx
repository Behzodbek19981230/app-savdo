import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-picker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, Filter, RotateCcw, ArrowLeft, User, ShoppingCart, Receipt, Search, SearchIcon, X } from 'lucide-react';
import { reportsService, OrderDebtHistoryResponse } from '@/services/reports.service';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';

export default function OrderDebtHistoryPage() {
    const { selectedFilialId } = useAuthContext();
    const navigate = useNavigate();

    // Default: oxirgi 1 oy
    const getDefaultDateRange = () => {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        return {
            from: oneMonthAgo,
            to: today,
        };
    };

    const defaultDates = getDefaultDateRange();

    // Applied filters (default: oxirgi 1 oy)
    const [dateFrom, setDateFrom] = useState<Date>(defaultDates.from);
    const [dateTo, setDateTo] = useState<Date>(defaultDates.to);

    // Form-level filters (default: oxirgi 1 oy)
    const [formDateFrom, setFormDateFrom] = useState<Date>(defaultDates.from);
    const [formDateTo, setFormDateTo] = useState<Date>(defaultDates.to);

    // Build params for API call (use applied filters)
    const params = {
        filial_id: selectedFilialId || 0,
        date_from: dateFrom ? dateFrom.toISOString().split('T')[0] : '',
        date_to: dateTo ? dateTo.toISOString().split('T')[0] : '',
    };

    const { data, isLoading } = useQuery({
        queryKey: ['orderDebtHistory', params.filial_id, params.date_from, params.date_to],
        queryFn: () => reportsService.getOrderDebtHistory(params),
        enabled: !!selectedFilialId && !!params.date_from && !!params.date_to,
    });

    const handleFilter = () => {
        setDateFrom(formDateFrom);
        setDateTo(formDateTo);
    };

    const handleClear = () => {
        const defaultDates = getDefaultDateRange();
        setFormDateFrom(defaultDates.from);
        setFormDateTo(defaultDates.to);
        setDateFrom(defaultDates.from);
        setDateTo(defaultDates.to);
    };

    const formatCurrency = (value: string | number | undefined) => {
        if (!value) return '0.00';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('uz-UZ', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    const formatDateRange = () => {
        if (!dateFrom || !dateTo) return '';
        return `${formatDate(dateFrom.toISOString())} sanadan ${formatDate(dateTo.toISOString())} sanagacha bo'lgan vaqtdagi hisobot`;
    };

    if (isLoading) {
        return (
            <div className='space-y-6'>
                <div className='flex items-center justify-center py-10'>
                    <Loader2 className='h-8 w-8 animate-spin text-primary' />
                </div>
            </div>
        );
    }

    if (!dateFrom || !dateTo) {
        return (
            <div className='space-y-6'>
                <Card>
                    <CardContent className='flex flex-col items-center justify-center py-10 text-center'>
                        <p className='text-muted-foreground'>Sana oralig'ini tanlang</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!data) {
        return (
            <div className='space-y-6'>
                <Card>
                    <CardContent className='flex flex-col items-center justify-center py-10 text-center'>
                        <p className='text-muted-foreground'>Ma'lumotlar topilmadi</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { orders, repayments, expenses } = data;

    return (
        <div className='space-y-6'>
            {/* Filter Section - Top */}
            <Card>
                <CardHeader>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                        <div className='flex items-center gap-3'>
                            <CardTitle className='text-xl font-bold whitespace-nowrap'>Kunlik hisobotlar</CardTitle>


                        </div>
                        <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-end gap-2 w-full'>
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
                                    onClick={handleFilter}
                                    className='bg-blue-600 hover:bg-blue-700 text-white'
                                >
                                    <SearchIcon className='h-4 w-4' />
                                    Qidirish
                                </Button>
                                <Button
                                    variant='outline'
                                    onClick={handleClear}
                                    className='border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                                >
                                    <X className='h-4 w-4' />
                                    Tozalash
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Header Banner */}
            <div className='bg-primary text-primary-foreground p-4 rounded-lg flex items-center justify-between'>
                <p className='text-sm font-medium'>{formatDateRange()}</p>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={() => navigate('/reports/top-clients')}
                    className='bg-blue-500 hover:bg-blue-600 text-white border-blue-400'
                >
                    <ArrowLeft className='h-4 w-4 mr-2' />
                    Orqaga qaytish
                </Button>
            </div>

            {/* Buyurtmalar Section */}
            <div className='mb-6'>
                <div className='flex items-center gap-2 mb-4'>
                    <ShoppingCart className='h-6 w-6 text-primary' />
                    <h2 className='text-xl font-bold'>Buyurtmalar</h2>
                </div>

                {/* Buyurtmalar Total Card */}
                <Card className='mb-4'>
                    <CardContent className='p-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div className='space-y-3'>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Jami summa ($):</span>
                                    <span className='text-base font-bold text-orange-600'>
                                        {formatCurrency(orders.total.summa_total_dollar)} $
                                    </span>
                                </div>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Mahsulot summa ($):</span>
                                    <span className='text-base font-bold text-orange-600'>
                                        {formatCurrency(orders.total.all_product_summa)} $
                                    </span>
                                </div>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Dollar:</span>
                                    <span className='text-base font-semibold text-orange-600'>
                                        {formatCurrency(orders.total.summa_dollar)} $
                                    </span>
                                </div>
                                <div className='flex justify-between items-center'>
                                    <span className='text-sm text-muted-foreground'>So'm:</span>
                                    <span className='text-base font-semibold text-orange-600'>
                                        {formatCurrency(orders.total.summa_naqt)}
                                    </span>
                                </div>
                            </div>
                            <div className='space-y-3'>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Click:</span>
                                    <span className='text-base font-semibold text-blue-600'>
                                        {formatCurrency(orders.total.summa_kilik)}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Terminal:</span>
                                    <span className='text-base font-semibold text-blue-600'>
                                        {formatCurrency(orders.total.summa_terminal)}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Transfer:</span>
                                    <span className='text-base font-semibold text-blue-600'>
                                        {formatCurrency(orders.total.summa_transfer)}
                                    </span>
                                </div>
                                {orders.total.discount_amount && (
                                    <div className='flex justify-between items-center'>
                                        <span className='text-sm text-muted-foreground'>Chegirma ($):</span>
                                        <span className='text-base font-semibold text-blue-600'>
                                            {formatCurrency(orders.total.discount_amount)} $
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Accordion */}
                <Accordion type='single' collapsible className='w-full'>
                    <AccordionItem value='orders-items' className='border rounded-lg px-4'>
                        <AccordionTrigger className='hover:no-underline py-3'>
                            <span className='text-sm font-medium text-muted-foreground'>
                                Buyurtmalar ro'yxati ({orders.items.length} ta)
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            {orders.items.length === 0 ? (
                                <Card>
                                    <CardContent className='flex flex-col items-center justify-center py-10 text-center'>
                                        <p className='text-muted-foreground'>Buyurtmalar topilmadi</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                                    {orders.items.map((item, index) => (
                                        <Card key={index} className='bg-blue-50 border-blue-200 hover:shadow-md transition-shadow'>
                                            <CardContent className='p-4'>
                                                <div className='flex items-start gap-3'>
                                                    <div className='bg-primary rounded-full p-2 flex-shrink-0'>
                                                        <ShoppingCart className='h-4 w-4 text-primary-foreground' />
                                                    </div>
                                                    <div className='flex-1 min-w-0'>
                                                        <p className='font-medium text-sm mb-1 truncate'>{item.client_full_name}</p>
                                                        <p className='text-xs text-muted-foreground mb-2'>{formatDate(item.date)}</p>
                                                        <p className='text-xs text-muted-foreground mb-1'>Jami summa:</p>
                                                        <p className='text-base font-bold text-blue-600'>
                                                            {formatCurrency(parseFloat(item.summa_total_dollar || '0'))} $
                                                        </p>
                                                        <p className='text-xs text-muted-foreground mt-1'>
                                                            Mahsulot: {formatCurrency(parseFloat(item.all_product_summa || '0'))} $
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            {/* To'langan Qarzlar Section */}
            <div className='mb-6'>
                <div className='flex items-center gap-2 mb-4'>
                    <User className='h-6 w-6 text-primary' />
                    <h2 className='text-xl font-bold'>To'langan Qarzlar</h2>
                </div>

                {/* To'langan Qarzlar Total Card */}
                <Card className='mb-4'>
                    <CardContent className='p-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div className='space-y-3'>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Jami to'lanadigan summa ($):</span>
                                    <span className='text-base font-bold text-orange-600'>
                                        {formatCurrency(orders.total.summa_total_dollar)} $
                                    </span>
                                </div>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Jami to'langan summa ($):</span>
                                    <span className='text-base font-bold text-orange-600'>
                                        {formatCurrency(Math.abs(parseFloat(repayments.total.summa_total_dollar || '0')))} $
                                    </span>
                                </div>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Chegirma ($):</span>
                                    <span className='text-base font-bold text-orange-600'>
                                        {formatCurrency(repayments.total.discount_amount || '0')} $
                                    </span>
                                </div>
                                <div className='flex justify-between items-center'>
                                    <span className='text-sm text-muted-foreground'>To'lanmagan summa ($):</span>
                                    <span className='text-base font-bold text-orange-600'>
                                        {formatCurrency(
                                            parseFloat(orders.total.summa_total_dollar || '0') -
                                            Math.abs(parseFloat(repayments.total.summa_total_dollar || '0')) -
                                            parseFloat(repayments.total.discount_amount || '0')
                                        )} $
                                    </span>
                                </div>
                            </div>
                            <div className='space-y-3'>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>To'langan summa transferda ($):</span>
                                    <span className='text-base font-bold text-blue-600'>
                                        {formatCurrency(repayments.total.summa_transfer)} $
                                    </span>
                                </div>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>To'langan summa so'mda:</span>
                                    <span className='text-base font-bold text-blue-600'>
                                        {formatCurrency(repayments.total.summa_naqt)}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>To'langan summa kartada:</span>
                                    <span className='text-base font-bold text-blue-600'>
                                        {formatCurrency(repayments.total.summa_terminal)}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center'>
                                    <span className='text-sm text-muted-foreground'>Qaytim:</span>
                                    <span className='text-base font-bold text-blue-600'>
                                        {formatCurrency(repayments.total.zdacha_som)} ({formatCurrency(repayments.total.zdacha_dollar || '0')} $)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Accordion */}
                <Accordion type='single' collapsible className='w-full'>
                    <AccordionItem value='repayments-items' className='border rounded-lg px-4'>
                        <AccordionTrigger className='hover:no-underline py-3'>
                            <span className='text-sm font-medium text-muted-foreground'>
                                To'langan qarzlar ro'yxati ({repayments.items.length} ta)
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            {repayments.items.length === 0 ? (
                                <Card>
                                    <CardContent className='flex flex-col items-center justify-center py-10 text-center'>
                                        <p className='text-muted-foreground'>To'langan qarzlar topilmadi</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                                    {repayments.items.map((item, index) => (
                                        <Card key={index} className='bg-amber-50 border-amber-200 hover:shadow-md transition-shadow'>
                                            <CardContent className='p-4'>
                                                <div className='flex items-start gap-3'>
                                                    <div className='bg-primary rounded-full p-2 flex-shrink-0'>
                                                        <User className='h-4 w-4 text-primary-foreground' />
                                                    </div>
                                                    <div className='flex-1 min-w-0'>
                                                        <p className='font-medium text-sm mb-1 truncate'>{item.client_full_name}</p>
                                                        <p className='text-xs text-muted-foreground mb-2'>{formatDate(item.date)}</p>
                                                        <p className='text-xs text-muted-foreground mb-1'>To'langan:</p>
                                                        <p className='text-base font-bold text-red-600'>
                                                            {formatCurrency(Math.abs(parseFloat(item.summa_total_dollar || '0')))} $
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            {/* Xarajatlar Section */}
            <div className='mb-6'>
                <div className='flex items-center gap-2 mb-4'>
                    <Receipt className='h-6 w-6 text-primary' />
                    <h2 className='text-xl font-bold'>Xarajatlar</h2>
                </div>

                {/* Xarajatlar Total Card */}
                <Card className='mb-4'>
                    <CardContent className='p-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div className='space-y-3'>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Jami summa ($):</span>
                                    <span className='text-base font-bold text-orange-600'>
                                        {formatCurrency(expenses.total.summa_total_dollar)} $
                                    </span>
                                </div>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Dollar:</span>
                                    <span className='text-base font-semibold text-orange-600'>
                                        {formatCurrency(expenses.total.summa_dollar)} $
                                    </span>
                                </div>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>So'm:</span>
                                    <span className='text-base font-semibold text-orange-600'>
                                        {formatCurrency(expenses.total.summa_naqt)}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center'>
                                    <span className='text-sm text-muted-foreground'>Click:</span>
                                    <span className='text-base font-semibold text-orange-600'>
                                        {formatCurrency(expenses.total.summa_kilik)}
                                    </span>
                                </div>
                            </div>
                            <div className='space-y-3'>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Terminal:</span>
                                    <span className='text-base font-semibold text-blue-600'>
                                        {formatCurrency(expenses.total.summa_terminal)}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center border-b pb-2'>
                                    <span className='text-sm text-muted-foreground'>Transfer:</span>
                                    <span className='text-base font-semibold text-blue-600'>
                                        {formatCurrency(expenses.total.summa_transfer)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Accordion */}
                <Accordion type='single' collapsible className='w-full'>
                    <AccordionItem value='expenses-items' className='border rounded-lg px-4'>
                        <AccordionTrigger className='hover:no-underline py-3'>
                            <span className='text-sm font-medium text-muted-foreground'>
                                Xarajatlar ro'yxati ({expenses.items.length} ta)
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            {expenses.items.length === 0 ? (
                                <Card>
                                    <CardContent className='flex flex-col items-center justify-center py-10 text-center'>
                                        <p className='text-muted-foreground'>Xarajatlar topilmadi</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                                    {expenses.items.map((item, index) => (
                                        <Card key={index} className='bg-red-50 border-red-200 hover:shadow-md transition-shadow'>
                                            <CardContent className='p-4'>
                                                <div className='flex items-start gap-3'>
                                                    <div className='bg-primary rounded-full p-2 flex-shrink-0'>
                                                        <Receipt className='h-4 w-4 text-primary-foreground' />
                                                    </div>
                                                    <div className='flex-1 min-w-0'>
                                                        <p className='font-medium text-sm mb-1 truncate'>{item.category_name}</p>
                                                        <p className='text-xs text-muted-foreground mb-2'>{formatDate(item.date)}</p>
                                                        <p className='text-xs text-muted-foreground mb-1'>Jami summa:</p>
                                                        <p className='text-base font-bold text-red-600'>
                                                            {formatCurrency(parseFloat(item.summa_total_dollar || '0'))} $
                                                        </p>
                                                        <div className='flex gap-2 text-xs text-muted-foreground mt-1'>
                                                            <span>D: {formatCurrency(parseFloat(item.summa_dollar || '0'))} $</span>
                                                            <span>S: {formatCurrency(parseFloat(item.summa_naqt || '0'))}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    );
}
