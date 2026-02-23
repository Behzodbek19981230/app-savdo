import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { NotesPanel } from '@/components/dashboard/NotesPanel';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFilialDashboard } from '@/hooks/api/useFilialDashboard';
import { UserRound, Users, ShoppingCart, UserCog } from 'lucide-react';

const Index = () => {
	const { selectedFilialId, user } = useAuthContext();
	const filialId = selectedFilialId ?? user?.filials_detail?.[0]?.id ?? user?.companies?.[0] ?? null;
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
				},
				{
					title: 'Qarzdor mijozlar',
					value: numberFormatter.format(cardCount.debtors_count),
					icon: UserRound,
					iconColor: 'warning' as const,
				},
				{
					title: 'Karzinka buyurtmalar',
					value: numberFormatter.format(cardCount.karzinka_orders_count),
					icon: ShoppingCart,
					iconColor: 'primary' as const,
				},
				{
					title: 'Foydalanuvchilar',
					value: numberFormatter.format(cardCount.users_count),
					icon: UserCog,
					iconColor: 'info' as const,
				},
			]
		: [];

	return (
		<div>
			<div className='grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
				{isLoading ? (
					<div className='col-span-full rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground'>
						Dashboard ma'lumotlari yuklanmoqda...
					</div>
				) : isError ? (
					<div className='col-span-full rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
						Dashboard ma'lumotlarini yuklab bo'lmadi.
					</div>
				) : (
					kpiData.map((kpi) => <StatCard key={kpi.title} {...kpi} />)
				)}
			</div>

			<div className='mt-4'>
				<div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
					<div className='lg:col-span-2'>
						<RevenueChart data={data?.monthly} isLoading={isLoading} />
					</div>
					<NotesPanel />
				</div>
			</div>
		</div>
	);
};

export default Index;
