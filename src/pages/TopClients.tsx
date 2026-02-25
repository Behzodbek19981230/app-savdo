import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-picker';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, Users, Filter, RotateCcw } from 'lucide-react';
import { reportsService, TopClient } from '@/services/reports.service';
import { useQuery } from '@tanstack/react-query';

export default function TopClientsPage() {
    const { selectedFilialId } = useAuthContext();

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

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['topClients', params.filial_id, params.date_from, params.date_to],
        queryFn: () => reportsService.getTopClients(params),
        enabled: !!selectedFilialId && !!params.date_from && !!params.date_to,
    });

    const clients = data?.items || [];

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

    const formatCurrency = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('uz-UZ', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    return (
        <div className='space-y-6'>
            <Card>
                <CardHeader>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                        <h5 className='text-2xl font-bold'>Top mijozlar</h5>
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
                                    <Filter className='h-4 w-4' />
                                    Filter
                                </Button>
                                <Button
                                    variant='outline'
                                    onClick={handleClear}
                                    className='border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                                >
                                    <RotateCcw className='h-4 w-4' />
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
                    ) : !dateFrom || !dateTo ? (
                        <div className='flex flex-col items-center justify-center py-10 text-center'>
                            <Users className='h-12 w-12 text-muted-foreground/50 mb-4' />
                            <p className='text-muted-foreground'>Sana oralig'ini tanlang</p>
                        </div>
                    ) : clients.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-10 text-center'>
                            <Users className='h-12 w-12 text-muted-foreground/50 mb-4' />
                            <p className='text-muted-foreground'>Mijozlar topilmadi</p>
                        </div>
                    ) : (
                        <div className='rounded-md border overflow-x-auto'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className='w-[60px]'>t/r</TableHead>
                                        <TableHead>Mijoz FIO</TableHead>
                                        <TableHead className='text-right'>Buyurtma soni</TableHead>
                                        <TableHead className='text-right'>Jami summa (USD)</TableHead>
                                        <TableHead className='text-right'>Mahsulot summa</TableHead>
                                        <TableHead className='text-right'>Foyda (USD)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clients.map((client: TopClient, index: number) => (
                                        <TableRow key={client.client_id}>
                                            <TableCell className='font-medium'>{index + 1}</TableCell>
                                            <TableCell className='font-medium'>{client.client_full_name || '—'}</TableCell>
                                            <TableCell className='text-right font-medium'>
                                                {client.order_count}
                                            </TableCell>
                                            <TableCell className='text-right font-semibold text-green-600'>
                                                ${formatCurrency(client.sum_summa_total_dollar)}
                                            </TableCell>
                                            <TableCell className='text-right'>
                                                ${formatCurrency(client.sum_all_product_summa)}
                                            </TableCell>
                                            <TableCell className='text-right font-semibold text-blue-600'>
                                                ${formatCurrency(client.sum_all_profit_dollar)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
