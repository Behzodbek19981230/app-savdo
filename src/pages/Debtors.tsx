import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, User, AlertCircle, Calendar, Search, SearchIcon, X } from 'lucide-react';
import { reportsService, DebtorItem } from '@/services/reports.service';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

export default function DebtorsPage() {
    const { selectedFilialId } = useAuthContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['debtors', selectedFilialId, appliedSearch],
        queryFn: () => reportsService.getDebtors(selectedFilialId || 0, appliedSearch || undefined),
        enabled: !!selectedFilialId,
    });

    const handleFilter = () => {
        setAppliedSearch(searchQuery);
    };

    const handleClear = () => {
        setSearchQuery('');
        setAppliedSearch('');
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

    if (isLoading) {
        return (
            <div className='space-y-6'>
                <Card>
                    <CardContent className='flex items-center justify-center py-10'>
                        <Loader2 className='h-8 w-8 animate-spin text-primary' />
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
                        <AlertCircle className='h-12 w-12 text-muted-foreground/50 mb-4' />
                        <p className='text-muted-foreground'>Ma'lumotlar topilmadi</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { total_debt_summ, count, results } = data;

    return (
        <div className='space-y-6'>
            <Card>
                <CardHeader className='pb-4 flex flex-row items-center justify-between'>
                    <div>
                        <CardTitle className='text-lg'>Qarzdorlar ro'yxati</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters Row */}
                    <div className='mb-4 flex flex-col sm:flex-row gap-3'>
                        <div className='relative flex-1'>
                            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                            <Input
                                placeholder='Mijoz FIO boʻyicha qidirish...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='pl-9 h-9'
                            />
                        </div>
                        <div className='flex gap-2 sm:flex-shrink-0'>
                            <Button
                                onClick={handleFilter}
                                className='bg-blue-600 hover:bg-blue-700 text-white '
                            >
                                <SearchIcon className='h-4 w-4 mr-2' />
                                Qidirish
                            </Button>
                            <Button
                                variant='outline'
                                onClick={handleClear}
                                className='border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 '
                            >
                                <X className='h-4 w-4 mr-2' />
                                Tozalash
                            </Button>
                        </div>
                    </div>
                    {/* Total Debt Summary */}
                    <div className='mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200'>
                        <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium text-muted-foreground'>Jami qarz miqdori:</span>
                            <span className='text-xl font-bold text-red-600'>
                                {formatCurrency(total_debt_summ)} $
                            </span>
                        </div>
                    </div>

                    {/* Debtors Table */}
                    {results.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-10 text-center'>
                            <User className='h-12 w-12 text-muted-foreground/50 mb-4' />
                            <p className='text-muted-foreground'>Qarzdorlar topilmadi</p>
                        </div>
                    ) : (
                        <div className='rounded-md border overflow-x-auto'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className='w-[60px]'>t/r</TableHead>
                                        <TableHead>Mijoz FIO</TableHead>
                                        <TableHead>Telefon</TableHead>
                                        <TableHead className='text-right'>Qarz miqdori ($)</TableHead>
                                        <TableHead className='text-right'>Keshbek ($)</TableHead>
                                        <TableHead>Oxirgi buyurtma sanasi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((debtor: DebtorItem, index: number) => (
                                        <TableRow key={debtor.id}>
                                            <TableCell className='font-medium'>{index + 1}</TableCell>
                                            <TableCell className='font-medium'>
                                                {debtor.full_name || '—'}
                                            </TableCell>
                                            <TableCell>{debtor.phone_number || '—'}</TableCell>
                                            <TableCell className='text-right font-semibold text-red-600'>
                                                {formatCurrency(debtor.total_debt)} $
                                            </TableCell>
                                            <TableCell className='text-right'>
                                                {formatCurrency(debtor.keshbek)} $
                                            </TableCell>
                                            <TableCell>
                                                <div className='flex items-center gap-2'>
                                                    <Calendar className='h-4 w-4 text-muted-foreground' />
                                                    {formatDate(debtor.last_order_date)}
                                                </div>
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
