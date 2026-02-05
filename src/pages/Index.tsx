import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { DollarSign, Users, ShoppingCart, TrendingUp } from 'lucide-react';

// Demo data from dashboard.html
const kpiData = [
	{
		title: 'Jami daromad',
		value: '$18,210',
		change: 10.4,
		icon: DollarSign,
		iconColor: 'primary',
	},
	{
		title: 'Mijozlar soni',
		value: '780',
		change: 6.1,
		icon: Users,
		iconColor: 'success',
	},
	{
		title: 'Buyurtmalar',
		value: '401',
		change: -1.9,
		icon: ShoppingCart,
		iconColor: 'warning',
	},
	{
		title: 'O‘sish darajasi',
		value: '18.2%',
		change: 2.6,
		icon: TrendingUp,
		iconColor: 'info',
	},
];

const Index = () => {
	return (
		<div>
			{/* KPIs */}
			<div className='grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
				{kpiData.map((kpi) => (
					<StatCard key={kpi.title} {...kpi} />
				))}
			</div>

			{/* Chart + Top Products */}
			<div className='grid gap-3 lg:gap-4 grid-cols-1 lg:grid-cols-3 mt-4'>
				<div className='lg:col-span-2'>
					<RevenueChart />
				</div>
				<TopProducts />
			</div>

			{/* Recent Orders */}
			<div className='mt-4'>
				<RecentOrders />
			</div>
		</div>
	);
};

export default Index;
