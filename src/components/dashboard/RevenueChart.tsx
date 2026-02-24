import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { FilialDashboardMonthlyItem } from '@/services/filialDashboard.service';

interface RevenueChartProps {
    data?: FilialDashboardMonthlyItem[];
    isLoading?: boolean;
}

const formatMonth = (month: string) => {
    return month;
};

const toNumber = (value: string) => Number.parseFloat(value) || 0;

export function RevenueChart({ data = [], isLoading = false }: RevenueChartProps) {
    const chartData = data.map((item) => ({
        month: formatMonth(item.month),
        orderSumUsd: toNumber(item.order_sum_usd),
        debtSumUsd: toNumber(item.debt_sum_usd),
        totalSumUsd: toNumber(item.total_sum_usd),
    }));

    return (
        <div className='rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-5 shadow-sm'>
            <h3 className='text-base lg:text-lg font-bold text-foreground mb-4'>Oylik statistika (USD)</h3>
            <div className='w-full' style={{ height: '240px' }}>
                {isLoading ? (
                    <div className='h-full w-full flex items-center justify-center text-sm text-muted-foreground'>
                        Yuklanmoqda...
                    </div>
                ) : chartData.length === 0 ? (
                    <div className='h-full w-full flex items-center justify-center text-sm text-muted-foreground'>
                        Statistika topilmadi
                    </div>
                ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                            <defs>
                                <linearGradient id='colorTotal' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='5%' stopColor='hsl(221, 83%, 53%)' stopOpacity={0.2} />
                                    <stop offset='95%' stopColor='hsl(221, 83%, 53%)' stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id='colorOrder' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='5%' stopColor='hsl(142, 76%, 36%)' stopOpacity={0.1} />
                                    <stop offset='95%' stopColor='hsl(142, 76%, 36%)' stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id='colorDebt' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='5%' stopColor='hsl(36, 100%, 50%)' stopOpacity={0.1} />
                                    <stop offset='95%' stopColor='hsl(36, 100%, 50%)' stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray='0'
                                stroke='hsl(var(--border))'
                                strokeOpacity={0.5}
                                vertical={false}
                            />
                            <XAxis
                                dataKey='month'
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                tickFormatter={(value) => `$${value}`}
                                width={55}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    padding: '8px 12px',
                                    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
                                }}
                                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                            />
                            <Legend
                                verticalAlign='top'
                                align='right'
                                iconType='circle'
                                wrapperStyle={{ paddingBottom: 8, fontSize: 12 }}
                            />
                            <Area
                                type='monotone'
                                dataKey='totalSumUsd'
                                stroke='hsl(221, 83%, 53%)'
                                strokeWidth={2}
                                fillOpacity={1}
                                fill='url(#colorTotal)'
                                name='Jami summa'
                            />
                            <Area
                                type='monotone'
                                dataKey='orderSumUsd'
                                stroke='hsl(142, 76%, 36%)'
                                strokeWidth={2}
                                fillOpacity={1}
                                fill='url(#colorOrder)'
                                name='Buyurtma summasi'
                            />
                            <Area
                                type='monotone'
                                dataKey='debtSumUsd'
                                stroke='hsl(36, 100%, 50%)'
                                strokeWidth={2}
                                fillOpacity={1}
                                fill='url(#colorDebt)'
                                name="Qarz to'lovi"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
