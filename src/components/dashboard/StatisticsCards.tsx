import { useState, useMemo } from 'react';
import { Plus, ShoppingCart, RotateCcw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp, BarChart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../services/reports.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { FinancialSummary } from './FinancialSummary';
import { useAuthContext } from '@/contexts/AuthContext';

const baseCards = [
    {
        key: 'sales',
        title: 'Savdo',
        icon: ShoppingCart,
        trend: 'up' as const,
        bgGradient: 'from-blue-500 via-blue-400 to-cyan-400',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        iconColor: 'text-blue-600 dark:text-blue-400',
        href: '/order-history',
    },
    {
        key: 'returns',
        title: 'Qaytib olish',
        icon: RotateCcw,
        trend: 'down' as const,
        bgGradient: 'from-orange-500 via-amber-500 to-yellow-500',
        iconBg: 'bg-orange-100 dark:bg-orange-900/40',
        iconColor: 'text-orange-600 dark:text-orange-400',
        href: '/order-history/returns',
    },
    {
        key: 'income',
        title: "To'langan qarzlar",
        icon: TrendingUp,
        trend: 'up' as const,
        bgGradient: 'from-emerald-500 via-green-500 to-teal-500',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        href: '/debt-repayment',
    },
    {
        key: 'expense',
        title: 'Xarajatlar',
        icon: TrendingDown,
        trend: 'down' as const,
        bgGradient: 'from-rose-500 via-red-500 to-orange-500',
        iconBg: 'bg-rose-100 dark:bg-rose-900/40',
        iconColor: 'text-rose-600 dark:text-rose-400',
        href: '/expenses',
    },
];

function safeNum(v: string | number | undefined): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

export function StatisticsCards() {
    const { user, selectedFilialId } = useAuthContext();

    const now = new Date();
    const [year, setYear] = useState<number>(now.getFullYear());
    const [month, setMonth] = useState<number | null>(now.getMonth() + 1);
    const [showFullSummary, setShowFullSummary] = useState(false);
    const navigate = useNavigate();
    const filialId = selectedFilialId ?? user?.filials_detail?.[0]?.id ?? null;
    console.log(filialId);
    const { data, isLoading } = useQuery({
        queryKey: ['filial-statistics', filialId, year, month],
        queryFn: () => {
            if (!filialId) return Promise.resolve(null);
            return reportsService.getFilialStatistics({ filial_id: filialId, year, month: month ?? undefined });
        },
        enabled: !!filialId,
        staleTime: 60_000,
    });

    // Map API response into card values. API may have nested structure; we safely read expected keys.
    const cards = useMemo(() => {
        // Response example contains keys: orders, vozvrat, expenses, debt_repayments, summary
        const orders = data?.orders ?? {};
        const vozvrat = data?.vozvrat ?? {};
        const expenses = data?.expenses ?? {};
        const summary = data?.summary ?? {};

        return baseCards.map((c) => {
            let total = 0;
            let paid = 0;
            let balance = 0;
            let currency = 'UZS';

            if (c.key === 'sales') {
                total = safeNum(orders.all_product_summa ?? orders.total_paid_usd ?? 0);
                paid = safeNum(orders.total_paid_usd ?? orders.payments?.dollar ?? 0);
                balance = safeNum(orders.total_debt_client ?? total - paid);
                // if total looks like USD (contains decimal and small), prefer USD
                currency = orders.total_paid_usd ? 'USD' : 'UZS';
            }

            if (c.key === 'returns') {
                total = safeNum(vozvrat.total_refunded_usd ?? 0);
                paid = safeNum(vozvrat.payments?.dollar ?? 0);
                balance = 0;
                currency = vozvrat.total_refunded_usd ? 'USD' : 'UZS';
            }

            if (c.key === 'income') {
                total = safeNum(summary.net_revenue_usd ?? orders.profit_usd ?? 0);
                paid = safeNum(summary.net_cashflow_usd ?? 0);
                balance = total - paid;
                currency = summary.net_revenue_usd ? 'USD' : 'UZS';
            }

            if (c.key === 'expense') {
                total = safeNum(expenses.total_usd ?? 0);
                paid = safeNum(expenses.payments?.dollar ?? 0);
                balance = total;
                currency = expenses.total_usd ? 'USD' : 'UZS';
            }

            return { ...c, total, paid, balance, currency };
        });
    }, [data]);

    const years = useMemo(() => {
        const y = now.getFullYear();
        return [y, y - 1, y - 2];
    }, []);

    const months = [
        { id: 0, label: 'Barcha yil' },
        { id: 1, label: 'Yan' },
        { id: 2, label: 'Fev' },
        { id: 3, label: 'Mar' },
        { id: 4, label: 'Apr' },
        { id: 5, label: 'May' },
        { id: 6, label: 'Iyun' },
        { id: 7, label: 'Iyul' },
        { id: 8, label: 'Avg' },
        { id: 9, label: 'Sen' },
        { id: 10, label: 'Okt' },
        { id: 11, label: 'Noy' },
        { id: 12, label: 'Dek' },
    ];

    // Transform API data to match FinancialSummary interface
    const transformedData = useMemo(() => {
        if (!data || !filialId) return null;

        const currentMonth = month || now.getMonth() + 1;
        const daysInMonth = new Date(year, currentMonth, 0).getDate();

        return {
            filters: {
                filial_id: filialId,
                year: year,
                month: currentMonth,
                start_date: data.filters?.start_date || `${year}-${String(currentMonth).padStart(2, '0')}-01`,
                end_date: data.filters?.end_date || `${year}-${String(currentMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`,
            },
            summary: {
                net_revenue_usd: data.summary?.net_revenue_usd || '0.00',
                net_cashflow_usd: data.summary?.net_cashflow_usd || '0.00',
            },
            orders: {
                count: data.orders?.count || 0,
                all_product_summa: data.orders?.all_product_summa || '0.00',
                profit_usd: data.orders?.profit_usd || '0.00',
                total_paid_usd: data.orders?.total_paid_usd || '0.00',
                total_debt_client: data.orders?.total_debt_client || '0.00',
                total_debt_today_client: data.orders?.total_debt_today_client || '0.00',
                payments: {
                    dollar: data.orders?.payments?.dollar || '0.00',
                    cash: data.orders?.payments?.cash || '0.00',
                    click: data.orders?.payments?.click || '0.00',
                    terminal: data.orders?.payments?.terminal || '0.00',
                    transfer: data.orders?.payments?.transfer || '0.00',
                },
                discount: data.orders?.discount || '0.00',
                change: {
                    usd: data.orders?.change?.usd || '0.00',
                    uzs: data.orders?.change?.uzs || '0.00',
                },
            },
            vozvrat: {
                count: data.vozvrat?.count || 0,
                total_refunded_usd: data.vozvrat?.total_refunded_usd || '0.00',
                payments: {
                    dollar: data.vozvrat?.payments?.dollar || '0.00',
                    cash: data.vozvrat?.payments?.cash || '0.00',
                    click: data.vozvrat?.payments?.click || '0.00',
                    terminal: data.vozvrat?.payments?.terminal || '0.00',
                    transfer: data.vozvrat?.payments?.transfer || '0.00',
                },
                discount: data.vozvrat?.discount || '0.00',
            },
            expenses: {
                count: data.expenses?.count || 0,
                total_usd: data.expenses?.total_usd || '0.00',
                payments: {
                    dollar: data.expenses?.payments?.dollar || '0.00',
                    cash: data.expenses?.payments?.cash || '0.00',
                    click: data.expenses?.payments?.click || '0.00',
                    terminal: data.expenses?.payments?.terminal || '0.00',
                    transfer: data.expenses?.payments?.transfer || '0.00',
                },
            },
            debt_repayments: {
                count: data.debt_repayments?.count || 0,
                total_paid_usd: data.debt_repayments?.total_paid_usd || '0.00',
                payments: {
                    dollar: data.debt_repayments?.payments?.dollar || '0.00',
                    cash: data.debt_repayments?.payments?.cash || '0.00',
                    click: data.debt_repayments?.payments?.click || '0.00',
                    terminal: data.debt_repayments?.payments?.terminal || '0.00',
                    transfer: data.debt_repayments?.payments?.transfer || '0.00',
                },
                discount: data.debt_repayments?.discount || '0.00',
                change: {
                    usd: data.debt_repayments?.change?.usd || '0.00',
                    uzs: data.debt_repayments?.change?.uzs || '0.00',
                },
            },
        };
    }, [data, filialId, year, month, now]);

    return (
        <div className='space-y-4'>
            <div className='bg-card rounded-xl shadow-sm border border-border p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
                    <div className='flex items-center gap-2'>
                        <div className='p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg'>
                            <BarChart className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                        </div>
                        <h2 className='text-xl font-bold text-foreground'>Statistika</h2>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                            <SelectTrigger className='w-[100px] h-9 text-sm'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={String(y)}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={month ? String(month) : '0'}
                            onValueChange={(v) => setMonth(Number(v) === 0 ? null : Number(v))}
                        >
                            <SelectTrigger className='w-[130px] h-9 text-sm'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m) => (
                                    <SelectItem key={m.id} value={String(m.id)}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isLoading ? (
                    <div className='flex items-center justify-center py-8'>
                        <div className='animate-spin w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full' />
                    </div>
                ) : (
                    <>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                            {cards.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <div
                                        key={card.key}
                                        className='group relative bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-border'
                                    >
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-3 transition-opacity`}
                                        />
                                        <div className='relative p-4'>
                                            <div className='flex items-center justify-between mb-3'>
                                                <div className='flex items-center gap-2.5'>
                                                    <div className={`${card.iconBg} p-2 rounded-xl shadow-sm`}>
                                                        <Icon className={`w-5 h-5 ${card.iconColor}`} />
                                                    </div>
                                                    <h3 className='text-base font-bold text-foreground'>{card.title}</h3>
                                                </div>

                                                {card.key === 'sales' && data?.orders?.discount && (
                                                    <div className='flex items-center bg-yellow-50/80 dark:bg-yellow-950/40 px-2 py-0.5 rounded-md border border-yellow-200/50 dark:border-yellow-800/40'>
                                                        <span className='text-[10px] font-semibold text-yellow-700 dark:text-yellow-400'>
                                                            {safeNum(data.orders.discount).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                                {card.key === 'returns' && data?.vozvrat?.discount && (
                                                    <div className='flex items-center bg-yellow-50/80 dark:bg-yellow-950/40 px-2 py-0.5 rounded-md border border-yellow-200/50 dark:border-yellow-800/40'>
                                                        <span className='text-[10px] font-semibold text-yellow-700 dark:text-yellow-400'>
                                                            {safeNum(data.vozvrat.discount).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                                {card.key === 'income' && data?.debt_repayments?.discount && (
                                                    <div className='flex items-center bg-yellow-50/80 dark:bg-yellow-950/40 px-2 py-0.5 rounded-md border border-yellow-200/50 dark:border-yellow-800/40'>
                                                        <span className='text-[10px] font-semibold text-yellow-700 dark:text-yellow-400'>
                                                            {safeNum(data.debt_repayments.discount).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                                {card.key === 'expense' && (
                                                    <div className='flex items-center bg-rose-50/80 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/50 dark:border-rose-800/40'>
                                                        <span className='text-[10px] font-semibold text-rose-600 dark:text-rose-400'>
                                                            Chiqim
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className='relative px-4 pb-4 space-y-2'>
                                            {/* Sales Card */}
                                            {card.key === 'sales' && data?.orders?.payments && (
                                                <>
                                                    <div className='flex justify-between items-center p-2 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-blue-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Dollar</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.orders.payments.dollar).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}{' '}
                                                            $
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-green-50/60 dark:bg-green-950/30 rounded-lg border border-green-200/50 dark:border-green-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-green-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Naqd</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.orders.payments.cash).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-purple-50/60 dark:bg-purple-950/30 rounded-lg border border-purple-200/50 dark:border-purple-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-purple-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Click</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.orders.payments.click).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-orange-50/60 dark:bg-orange-950/30 rounded-lg border border-orange-200/50 dark:border-orange-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-orange-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Terminal</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.orders.payments.terminal).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-cyan-50/60 dark:bg-cyan-950/30 rounded-lg border border-cyan-200/50 dark:border-cyan-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-cyan-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Transfer</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.orders.payments.transfer).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 mt-2.5'>
                                                        <span className='font-semibold text-xs text-muted-foreground'>Jami (USD)</span>
                                                        <span className='font-bold text-base text-emerald-700 dark:text-emerald-400'>
                                                            {safeNum(data.orders.total_paid_usd).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}{' '}
                                                            $
                                                        </span>
                                                    </div>
                                                </>
                                            )}

                                            {/* Returns Card */}
                                            {card.key === 'returns' && data?.vozvrat?.payments && (
                                                <>
                                                    <div className='flex justify-between items-center p-2 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-blue-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Dollar</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.vozvrat.payments.dollar).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}{' '}
                                                            $
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-green-50/60 dark:bg-green-950/30 rounded-lg border border-green-200/50 dark:border-green-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-green-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Naqd</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.vozvrat.payments.cash).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-purple-50/60 dark:bg-purple-950/30 rounded-lg border border-purple-200/50 dark:border-purple-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-purple-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Click</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.vozvrat.payments.click).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-orange-50/60 dark:bg-orange-950/30 rounded-lg border border-orange-200/50 dark:border-orange-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-orange-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Terminal</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.vozvrat.payments.terminal).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-cyan-50/60 dark:bg-cyan-950/30 rounded-lg border border-cyan-200/50 dark:border-cyan-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-cyan-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Transfer</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.vozvrat.payments.transfer).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg border border-orange-200/60 dark:border-orange-800/40 mt-2.5'>
                                                        <span className='font-semibold text-xs text-muted-foreground'>Jami (USD)</span>
                                                        <span className='font-bold text-base text-orange-700 dark:text-orange-400'>
                                                            {safeNum(data.vozvrat.total_refunded_usd).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}{' '}
                                                            $
                                                        </span>
                                                    </div>
                                                </>
                                            )}

                                            {/* Expense Card */}
                                            {card.key === 'expense' && data?.expenses?.payments && (
                                                <>
                                                    <div className='flex justify-between items-center p-2 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-blue-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Dollar</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.expenses.payments.dollar).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}{' '}
                                                            $
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-green-50/60 dark:bg-green-950/30 rounded-lg border border-green-200/50 dark:border-green-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-green-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Naqd</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.expenses.payments.cash).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-purple-50/60 dark:bg-purple-950/30 rounded-lg border border-purple-200/50 dark:border-purple-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-purple-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Click</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.expenses.payments.click).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-orange-50/60 dark:bg-orange-950/30 rounded-lg border border-orange-200/50 dark:border-orange-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-orange-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Terminal</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.expenses.payments.terminal).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-cyan-50/60 dark:bg-cyan-950/30 rounded-lg border border-cyan-200/50 dark:border-cyan-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-cyan-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Transfer</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.expenses.payments.transfer).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-3 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 rounded-lg border border-rose-200/60 dark:border-rose-800/40 mt-2.5'>
                                                        <span className='font-semibold text-xs text-muted-foreground'>Jami (USD)</span>
                                                        <span className='font-bold text-base text-rose-700 dark:text-rose-400'>
                                                            {safeNum(data.expenses.total_usd).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}{' '}
                                                            $
                                                        </span>
                                                    </div>
                                                </>
                                            )}

                                            {/* Income Card - Debt Repayments */}
                                            {card.key === 'income' && data?.debt_repayments?.payments && (
                                                <>
                                                    <div className='flex justify-between items-center p-2 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-blue-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Dollar</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.debt_repayments.payments.dollar).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}{' '}
                                                            $
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-green-50/60 dark:bg-green-950/30 rounded-lg border border-green-200/50 dark:border-green-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-green-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Naqd</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.debt_repayments.payments.cash).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-purple-50/60 dark:bg-purple-950/30 rounded-lg border border-purple-200/50 dark:border-purple-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-purple-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Click</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.debt_repayments.payments.click).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-orange-50/60 dark:bg-orange-950/30 rounded-lg border border-orange-200/50 dark:border-orange-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-orange-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Terminal</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.debt_repayments.payments.terminal).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-2 bg-cyan-50/60 dark:bg-cyan-950/30 rounded-lg border border-cyan-200/50 dark:border-cyan-800/30'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <div className='w-1.5 h-1.5 bg-cyan-500 rounded-full' />
                                                            <span className='text-xs text-muted-foreground font-medium'>Transfer</span>
                                                        </div>
                                                        <span className='font-semibold text-sm text-foreground'>
                                                            {safeNum(data.debt_repayments.payments.transfer).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className='flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 mt-2.5'>
                                                        <span className='font-semibold text-xs text-muted-foreground'>Jami (USD)</span>
                                                        <span className='font-bold text-base text-emerald-700 dark:text-emerald-400'>
                                                            {safeNum(data.debt_repayments.total_paid_usd).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}{' '}
                                                            $
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                    </div>
                                );
                            })}
                        </div>

                        {/* Toggle button for full summary */}
                        {/* <div className='mt-4 flex justify-center'>
                            <button
                                onClick={() => setShowFullSummary(!showFullSummary)}
                                className='flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm'
                            >
                                {showFullSummary ? (
                                    <>
                                        <ChevronUp size={18} />
                                        <span>Batafsil ma'lumotlarni yashirish</span>
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown size={18} />
                                        <span>Batafsil ma'lumotlarni ko'rish</span>
                                    </>
                                )}
                            </button>
                        </div> */}
                    </>
                )}
            </div>

            {/* Full Financial Summary */}
            {showFullSummary && transformedData && !isLoading && (
                <div className='mt-6'>
                    <FinancialSummary data={transformedData} />
                </div>
            )}
        </div>
    );
}
