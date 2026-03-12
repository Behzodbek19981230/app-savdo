import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFilialDashboard } from '@/hooks/api/useFilialDashboard';
import { UserRound, Users, ShoppingCart, UserCog } from 'lucide-react';
import { StatisticsCards } from '@/components/dashboard/StatisticsCards';

const Index = () => {
    const { selectedFilialId, user } = useAuthContext();
    const normalizeFilialId = (value: unknown): number | null => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    };
    const filialId =
        normalizeFilialId(selectedFilialId) ??
        normalizeFilialId(user?.filials_detail?.[0]?.id) ??
        normalizeFilialId(user?.companies?.[0]);
    const { data, isLoading, isError } = useFilialDashboard(filialId);

    const cardCount = data?.card_count;
    const numberFormatter = new Intl.NumberFormat('uz-UZ');
    const kpiData = cardCount
        ? [
            {
                title: 'Mijozlar soni',
                value: numberFormatter.format(cardCount.clients_count),
                icon: Users,
                iconColor: 'success' as const,
                link: '/customers',
            },
            {
                title: 'Qarzdor mijozlar',
                value: numberFormatter.format(cardCount.debtors_count),
                icon: UserRound,
                iconColor: 'warning' as const,
                link: '/reports/debtors',
            },
            {
                title: 'Buyurtmalar',
                value: numberFormatter.format(cardCount.karzinka_orders_count),
                icon: ShoppingCart,
                iconColor: 'primary' as const,
                link: '/order-history',
            },
            {
                title: 'Foydalanuvchilar',
                value: numberFormatter.format(cardCount.users_count),
                icon: UserCog,
                iconColor: 'info' as const,
                link: '/user',
            },
        ]
        : [];

    return (
        <div className='space-y-4'>
            {/* KPI Cards */}
            <div className='grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                {isLoading ? (
                    <div className='col-span-full rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground'>
                        Boshqaruv paneli ma'lumotlari yuklanmoqda...
                    </div>
                ) : isError ? (
                    <div className='col-span-full rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive'>
                        Boshqaruv paneli ma'lumotlarini yuklab bo'lmadi.
                    </div>
                ) : (
                    kpiData.map((kpi) => <StatCard key={kpi.title} {...kpi} />)
                )}
            </div>

            {/* Statistika */}
            <RevenueChart data={data?.monthly} isLoading={isLoading} />
            <StatisticsCards />
        </div>
    );
};

export default Index;
