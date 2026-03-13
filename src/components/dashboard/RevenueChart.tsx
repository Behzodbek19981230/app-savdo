import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { FilialDashboardMonthlyItem } from '@/services/filialDashboard.service';
import { formatNumber } from '@/lib/utils';

interface RevenueChartProps {
    data?: FilialDashboardMonthlyItem[];
    isLoading?: boolean;
}

const formatMonth = (month: string) => {
    const monthNames = [
        'Yanvar',
        'Fevral',
        'Mart',
        'Aprel',
        'May',
        'Iyun',
        'Iyul',
        'Avgust',
        'Sentyabr',
        'Oktyabr',
        'Noyabr',
        'Dekabr',
    ];

    // Agar "2025-04-01" yoki "2025-4-01" formatida bo'lsa (YYYY-MM-DD)
    if (month.includes('-')) {
        const parts = month.split('-');
        // Ikkinchi qism oy raqami (MM)
        if (parts.length >= 2) {
            const monthNum = parseInt(parts[1], 10);
            if (monthNum >= 1 && monthNum <= 12) {
                return monthNames[monthNum - 1];
            }
        }
    }

    // Agar "2024/01" yoki "2024/1" formatida bo'lsa
    if (month.includes('/')) {
        const parts = month.split('/');
        const monthNum = parseInt(parts[parts.length - 1], 10);
        if (monthNum >= 1 && monthNum <= 12) {
            return monthNames[monthNum - 1];
        }
    }

    // Agar faqat raqam bo'lsa "1", "01", "12" kabi
    const monthNum = parseInt(month, 10);
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        return monthNames[monthNum - 1];
    }

    // Inglizcha oy nomlari
    const englishMonths: Record<string, string> = {
        January: 'Yanvar',
        February: 'Fevral',
        March: 'Mart',
        April: 'Aprel',
        May: 'May',
        June: 'Iyun',
        July: 'Iyul',
        August: 'Avgust',
        September: 'Sentyabr',
        October: 'Oktyabr',
        November: 'Noyabr',
        December: 'Dekabr',
    };

    if (englishMonths[month]) {
        return englishMonths[month];
    }

    // Agar allaqachon o'zbekcha bo'lsa
    const uzbekMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
    if (uzbekMonths.includes(month)) {
        return month;
    }

    // Agar topilmasa, o'zini qaytaradi
    return month;
};

const toNumber = (value: string) => Number.parseFloat(value) || 0;

export function RevenueChart({ data = [], isLoading = false }: RevenueChartProps) {
    const chartData = data.map((item) => ({
        month: formatMonth(item.month),
        orderSumUsd: toNumber(item.order_sum_usd),
        debtSumUsd: toNumber(item.debt_sum_usd),
        profitSumUsd: toNumber(item.profit_sum_usd),
    }));

    return (
        <div className='rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-5 shadow-sm'>
            <style>{`
                .recharts-bar-rectangle {
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .recharts-bar-rectangle:hover {
                    filter: brightness(1.2);
                    opacity: 0.9;
                }
                .dark .recharts-bar-rectangle:hover {
                    filter: brightness(1.3);
                    opacity: 0.95;
                }
            `}</style>
            <h3 className='text-base lg:text-lg font-bold text-foreground mb-4'>Oylik statistika (USD)</h3>
            <div className='w-full' style={{ height: '240px' }}>
                {isLoading ? (
                    <div className='h-full w-full flex items-center justify-center text-xs text-muted-foreground'>
                        Yuklanmoqda...
                    </div>
                ) : chartData.length === 0 ? (
                    <div className='h-full w-full flex items-center justify-center text-xs text-muted-foreground'>
                        Statistika topilmadi
                    </div>
                ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                            <CartesianGrid
                                strokeDasharray='3 3'
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
                                tickFormatter={(value) => `$${formatNumber(value as number)}`}
                                width={100}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    padding: '8px 12px',
                                    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
                                    color: 'hsl(var(--foreground))',
                                }}
                                itemStyle={{
                                    color: 'hsl(var(--foreground))',
                                }}
                                labelStyle={{
                                    color: 'hsl(var(--foreground))',
                                }}
                                formatter={(value: number, name: string) => [`$${formatNumber(value)}`, name]}
                            />
                            <Legend
                                verticalAlign='top'
                                align='right'
                                iconType='circle'
                                wrapperStyle={{ paddingBottom: 8, fontSize: 12 }}
                            />
                            <Bar
                                dataKey='orderSumUsd'
                                fill='hsl(221, 83%, 53%)'
                                name='Buyurtma summasi'
                                radius={[4, 4, 0, 0]}
                                activeBar={{
                                    fill: 'hsl(221, 83%, 60%)',
                                    stroke: 'hsl(221, 83%, 53%)',
                                    strokeWidth: 2,
                                    opacity: 0.9,
                                }}
                            />
                            <Bar
                                dataKey='debtSumUsd'
                                fill='hsl(0, 84%, 60%)'
                                name="To'langan qarzlar"
                                radius={[4, 4, 0, 0]}
                                activeBar={{
                                    fill: 'hsl(0, 84%, 70%)',
                                    stroke: 'hsl(0, 84%, 60%)',
                                    strokeWidth: 2,
                                    opacity: 0.9,
                                }}
                            />
                            <Bar
                                dataKey='profitSumUsd'
                                fill='hsl(142, 76%, 36%)'
                                name='Jami foyda'
                                radius={[4, 4, 0, 0]}
                                activeBar={{
                                    fill: 'hsl(142, 76%, 45%)',
                                    stroke: 'hsl(142, 76%, 36%)',
                                    strokeWidth: 2,
                                    opacity: 0.9,
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
