import { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import {
	Loader2,
	ArrowLeft,
	ShoppingBag,
	CreditCard,
	User,
	DollarSign,
	TrendingUp,
	Banknote,
	CreditCard as CardIcon,
	ArrowRightLeft,
} from 'lucide-react';
import {
	reportsService,
	SoldProductsHistoryDetailOrder,
	SoldProductsHistoryDetailTotals,
} from '@/services/reports.service';
import { useQuery } from '@tanstack/react-query';

const fmt = (val: string | number) => {
	const num = typeof val === 'string' ? parseFloat(val) : val;
	if (isNaN(num)) return '—';
	return new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

function PopupRow({
	icon,
	label,
	value,
	valueClass = 'text-gray-800',
	bold = false,
}: {
	icon?: React.ReactNode;
	label: string;
	value: string;
	valueClass?: string;
	bold?: boolean;
}) {
	return (
		<div className='flex items-center justify-between gap-2'>
			<div className='flex items-center gap-1.5 text-gray-500 dark:text-gray-400'>
				{icon}
				<span className='text-xs'>{label}</span>
			</div>
			<span className={`text-xs ${bold ? 'font-bold' : 'font-semibold'} ${valueClass}`}>{value}</span>
		</div>
	);
}

function OrderCard({
	order,
	idx,
	variant = 'blue',
	clickable = false,
}: {
	order: SoldProductsHistoryDetailOrder;
	idx: number;
	variant?: 'blue' | 'red';
	clickable?: boolean;
}) {
	const [hovered, setHovered] = useState(false);
	const navigate = useNavigate();
	const profit = parseFloat(order.all_profit_dollar);
	const profitColor = profit >= 0 ? 'text-green-500' : 'text-red-400';

	const bg = variant === 'red' ? 'bg-red-400 hover:bg-red-600' : 'bg-sky-400 hover:bg-sky-600';
	const subText = variant === 'red' ? 'text-red-200' : 'text-sky-200';
	const iconText = variant === 'red' ? 'text-red-200' : 'text-sky-300';
	const cursor = clickable ? 'cursor-pointer' : 'cursor-default';

	return (
		<div className='relative' onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
			<div
				className={`flex items-center gap-2 ${bg} ${cursor} rounded-lg px-3 py-2.5 transition-colors duration-150 select-none`}
				onClick={() => clickable && navigate(`/order-history/${order.id}`)}
			>
				<span className='text-xs font-bold w-5 shrink-0'>{idx + 1}</span>
				<User className={`h-3.5 w-3.5 ${iconText} shrink-0`} />
				<span className='text-sm font-medium text-white flex-1 min-w-0 truncate'>
					{order.client_name || '—'}
				</span>
				<span className={`text-xs ${subText} shrink-0`}>{order.time}</span>
			</div>

			{hovered && (
				<div className='absolute z-50 left-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 space-y-2.5 pointer-events-none'>
					<p className='text-xs font-bold text-gray-600 dark:text-gray-300 border-b dark:border-gray-600 pb-2'>
						{order.client_name || '—'} • {order.time}
					</p>
					<p className='text-xs text-gray-400 dark:text-gray-500'>
						Xodim:{' '}
						<span className='font-medium text-gray-700 dark:text-gray-200'>{order.employee_name}</span>
					</p>
					<div className='space-y-1.5'>
						<PopupRow
							icon={<ShoppingBag className='h-3.5 w-3.5' />}
							label='Summa'
							value={`$${fmt(order.all_product_summa)}`}
							valueClass='text-blue-600'
						/>
						<PopupRow
							icon={<DollarSign className='h-3.5 w-3.5' />}
							label="To'langan"
							value={`$${fmt(order.summa_total_dollar)}`}
						/>
						<PopupRow
							icon={<Banknote className='h-3.5 w-3.5' />}
							label='Naqt'
							value={`$${fmt(order.summa_naqt)}`}
						/>
						<PopupRow
							icon={<CardIcon className='h-3.5 w-3.5' />}
							label='Kilik'
							value={`$${fmt(order.summa_kilik)}`}
						/>
						<PopupRow
							icon={<CardIcon className='h-3.5 w-3.5' />}
							label='Terminal'
							value={`$${fmt(order.summa_terminal)}`}
						/>
						<PopupRow
							icon={<ArrowRightLeft className='h-3.5 w-3.5' />}
							label='Transfer'
							value={`$${fmt(order.summa_transfer)}`}
						/>
						<div className='pt-1 border-t dark:border-gray-600'>
							<PopupRow
								icon={<TrendingUp className='h-3.5 w-3.5' />}
								label='Foyda'
								value={`$${fmt(order.all_profit_dollar)}`}
								valueClass={profitColor}
								bold
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function OrdersGrid({
	rows,
	variant = 'blue',
	clickable = false,
}: {
	rows: SoldProductsHistoryDetailOrder[];
	variant?: 'blue' | 'red';
	clickable?: boolean;
}) {
	if (rows.length === 0) return <p className='text-sm text-muted-foreground py-4 text-center'>Yozuvlar topilmadi</p>;
	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2'>
			{rows.map((row, idx) => (
				<OrderCard key={row.id} order={row} idx={idx} variant={variant} clickable={clickable} />
			))}
		</div>
	);
}

function TotalsRow({ totals }: { totals: SoldProductsHistoryDetailTotals }) {
	return (
		<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4 border-t dark:border-gray-700 pt-4'>
			{[
				{ label: "To'langan ($)", value: totals.summa_total_dollar },
				{ label: 'Dollar ($)', value: totals.summa_dollar },
				{ label: 'Naqt ($)', value: totals.summa_naqt },
				{ label: 'Kilik ($)', value: totals.summa_kilik },
				{ label: 'Terminal ($)', value: totals.summa_terminal },
				{ label: 'Transfer ($)', value: totals.summa_transfer },
			].map(({ label, value }) => (
				<div key={label} className='bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2'>
					<p className='text-xs text-muted-foreground'>{label}</p>
					<p className='text-sm font-semibold text-gray-800 dark:text-gray-100'>${fmt(value)}</p>
				</div>
			))}
		</div>
	);
}

export default function SoldProductsHistoryDetailPage() {
	const { date } = useParams<{ date: string }>();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { selectedFilialId } = useAuthContext();
	const [clientFilter, setClientFilter] = useState('');

	const filialId = Number(searchParams.get('filial_id')) || selectedFilialId || 0;

	const { data, isLoading } = useQuery({
		queryKey: ['sold-products-history-detail', filialId, date],
		queryFn: () =>
			reportsService.getSoldProductsHistoryDetail({
				filial_id: filialId,
				date: date!,
			}),
		enabled: !!filialId && !!date,
	});

	const allOrders = useMemo(() => data?.orders.results ?? [], [data]);
	const allDebts = useMemo(() => data?.debt_repayments.results ?? [], [data]);

	const clientOptions = useMemo(() => {
		const names = [...allOrders, ...allDebts].map((r) => r.client_name).filter(Boolean);
		return [...new Set(names)];
	}, [allOrders, allDebts]);

	const filteredOrders = clientFilter ? allOrders.filter((r) => r.client_name === clientFilter) : allOrders;
	const filteredDebts = clientFilter ? allDebts.filter((r) => r.client_name === clientFilter) : allDebts;

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center gap-3'>
				<Button variant='outline' size='sm' onClick={() => navigate(-1)} className='h-8 px-3 w-fit'>
					<ArrowLeft className='h-4 w-4 mr-1' />
					Orqaga
				</Button>
				<h1 className='text-xl font-bold'>{data?.date_label ?? date} — Sotilgan tovarlar</h1>
			</div>

			{/* Client filter */}
			{!isLoading && clientOptions.length > 0 && (
				<select
					value={clientFilter}
					onChange={(e) => setClientFilter(e.target.value)}
					className='border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 w-full sm:w-64'
				>
					<option value=''>Mijoz tanlang</option>
					{clientOptions.map((name) => (
						<option key={name} value={name}>
							{name}
						</option>
					))}
				</select>
			)}

			{isLoading ? (
				<div className='flex items-center justify-center py-20'>
					<Loader2 className='h-8 w-8 animate-spin text-primary' />
				</div>
			) : (
				<>
					{/* Orders */}
					<Card>
						<CardHeader className='pb-3'>
							<CardTitle className='flex items-center gap-2 text-base'>
								<ShoppingBag className='h-4 w-4 text-orange-500' />
								Buyurtmalar
								<span className='text-sm font-normal text-muted-foreground'>
									({filteredOrders.length} ta)
								</span>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<OrdersGrid rows={filteredOrders} clickable />
							{allOrders.length > 0 && !clientFilter && <TotalsRow totals={data!.orders.totals} />}
						</CardContent>
					</Card>

					{/* Debt Repayments */}
					<Card>
						<CardHeader className='pb-3'>
							<CardTitle className='flex items-center gap-2 text-base'>
								<CreditCard className='h-4 w-4 text-blue-500' />
								Qarz to&apos;lovlari
								<span className='text-sm font-normal text-muted-foreground'>
									({filteredDebts.length} ta)
								</span>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<OrdersGrid rows={filteredDebts} variant='red' />
							{allDebts.length > 0 && !clientFilter && (
								<TotalsRow totals={data!.debt_repayments.totals} />
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
