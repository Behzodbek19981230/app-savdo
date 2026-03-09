import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-picker';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, ShoppingBag, SearchIcon, X, Calendar, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { reportsService, SoldProductsHistoryItem } from '@/services/reports.service';
import { useQuery } from '@tanstack/react-query';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';

function DateCard({ item, filialId }: { item: SoldProductsHistoryItem; filialId: number }) {
	const [hovered, setHovered] = useState(false);
	const navigate = useNavigate();

	const fmt = (val: string | number) => {
		const num = typeof val === 'string' ? parseFloat(val) : val;
		return new Intl.NumberFormat('uz-UZ', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(num);
	};

	const profit = parseFloat(item.all_profit_dollar);
	const profitColor = profit >= 0 ? 'text-green-600' : 'text-red-500';

	return (
		<div className='relative' onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
			<div
				className='flex items-center gap-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg px-4 py-3 cursor-pointer transition-colors duration-150 select-none'
				onClick={() => navigate(`/reports/sold-products-history-detail/${item.date}?filial_id=${filialId}`)}
			>
				<Calendar className='h-4 w-4 text-orange-400 shrink-0' />
				<span className='text-sm font-medium text-gray-700'>{item.date_label}</span>
			</div>

			{hovered && (
				<div className='absolute z-50 left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 space-y-3 pointer-events-none'>
					<p className='text-xs font-bold text-gray-500 uppercase tracking-wide border-b pb-2'>
						{item.date_label}
					</p>
					<div className='space-y-2'>
						<div className='flex items-center justify-between gap-2'>
							<div className='flex items-center gap-1.5 text-gray-500'>
								<ShoppingCart className='h-3.5 w-3.5' />
								<span className='text-xs'>Buyurtmalar soni</span>
							</div>
							<span className='text-xs font-semibold text-gray-800'>{item.orders_count}</span>
						</div>
						<div className='flex items-center justify-between gap-2'>
							<div className='flex items-center gap-1.5 text-gray-500'>
								<ShoppingBag className='h-3.5 w-3.5' />
								<span className='text-xs'>Mahsulot summasi</span>
							</div>
							<span className='text-xs font-semibold text-blue-600'>${fmt(item.all_product_summa)}</span>
						</div>
						<div className='flex items-center justify-between gap-2'>
							<div className='flex items-center gap-1.5 text-gray-500'>
								<DollarSign className='h-3.5 w-3.5' />
								<span className='text-xs'>To&apos;langan summa</span>
							</div>
							<span className='text-xs font-semibold text-gray-800'>${fmt(item.summa_total_dollar)}</span>
						</div>
						<div className='flex items-center justify-between gap-2 pt-1 border-t'>
							<div className='flex items-center gap-1.5 text-gray-500'>
								<TrendingUp className='h-3.5 w-3.5' />
								<span className='text-xs'>Foyda</span>
							</div>
							<span className={`text-xs font-bold ${profitColor}`}>${fmt(item.all_profit_dollar)}</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default function SoldProductsHistoryPage() {
	const { selectedFilialId } = useAuthContext();

	const getDefaultDateRange = () => {
		const today = new Date();
		const oneMonthAgo = new Date();
		oneMonthAgo.setMonth(today.getMonth() - 1);
		return { from: oneMonthAgo, to: today };
	};

	const defaultDates = getDefaultDateRange();

	const [dateFrom, setDateFrom] = useState<Date>(defaultDates.from);
	const [dateTo, setDateTo] = useState<Date>(defaultDates.to);
	const [formDateFrom, setFormDateFrom] = useState<Date>(defaultDates.from);
	const [formDateTo, setFormDateTo] = useState<Date>(defaultDates.to);
	const [page, setPage] = useState(1);

	const LIMIT = 30;

	const params = {
		filial_id: selectedFilialId || 0,
		date_from: dateFrom ? dateFrom.toISOString().split('T')[0] : '',
		date_to: dateTo ? dateTo.toISOString().split('T')[0] : '',
		page,
		limit: LIMIT,
	};

	const { data, isLoading } = useQuery({
		queryKey: ['sold-products-history', params.filial_id, params.date_from, params.date_to, page],
		queryFn: () => reportsService.getSoldProductsHistory(params),
		enabled: !!selectedFilialId && !!params.date_from && !!params.date_to,
	});

	const items: SoldProductsHistoryItem[] = data?.results || [];
	const total = data?.pagination?.total ?? 0;
	const lastPage = data?.pagination?.lastPage ?? 1;

	const handleFilter = () => {
		setDateFrom(formDateFrom);
		setDateTo(formDateTo);
		setPage(1);
	};

	const handleClear = () => {
		const d = getDefaultDateRange();
		setFormDateFrom(d.from);
		setFormDateTo(d.to);
		setDateFrom(d.from);
		setDateTo(d.to);
		setPage(1);
	};

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
						<div className='flex items-center gap-3'>
							<CardTitle className='text-xl font-bold whitespace-nowrap'>
								Sotilgan tovarlar tarixi
							</CardTitle>
							{!isLoading && total > 0 && (
								<span className='text-sm text-muted-foreground'>({total} ta kun)</span>
							)}
						</div>
						<div className='flex flex-col sm:flex-row sm:items-center gap-2'>
							<DateRangePicker
								dateFrom={formDateFrom}
								dateTo={formDateTo}
								onDateFromChange={(d) => d && setFormDateFrom(d)}
								onDateToChange={(d) => d && setFormDateTo(d)}
							/>
							<div className='flex gap-2'>
								<Button
									onClick={handleFilter}
									className='bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs px-3'
								>
									<SearchIcon className='h-3.5 w-3.5 mr-1' />
									Qidirish
								</Button>
								<Button
									variant='outline'
									onClick={handleClear}
									className='border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-8 text-xs px-3'
								>
									<X className='h-3.5 w-3.5 mr-1' />
									Tozalash
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent>
					{isLoading ? (
						<div className='flex items-center justify-center py-14'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
						</div>
					) : items.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-14 text-center'>
							<ShoppingBag className='h-12 w-12 text-muted-foreground/40 mb-3' />
							<p className='text-muted-foreground text-sm'>Ma&apos;lumotlar topilmadi</p>
						</div>
					) : (
						<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
							{items.map((item) => (
								<DateCard key={item.date} item={item} filialId={params.filial_id} />
							))}
						</div>
					)}

					{!isLoading && lastPage > 1 && (
						<div className='mt-5 flex justify-center'>
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											onClick={() => setPage(Math.max(1, page - 1))}
											className={page === 1 ? 'pointer-events-none opacity-50' : ''}
										/>
									</PaginationItem>
									{[...Array(Math.min(5, lastPage))].map((_, i) => {
										let pageNum: number;
										if (lastPage <= 5) pageNum = i + 1;
										else if (page <= 3) pageNum = i + 1;
										else if (page >= lastPage - 2) pageNum = lastPage - 4 + i;
										else pageNum = page - 2 + i;
										return (
											<PaginationItem key={pageNum}>
												<PaginationLink
													onClick={() => setPage(pageNum)}
													isActive={pageNum === page}
												>
													{pageNum}
												</PaginationLink>
											</PaginationItem>
										);
									})}
									<PaginationItem>
										<PaginationNext
											onClick={() => setPage(Math.min(lastPage, page + 1))}
											className={page === lastPage ? 'pointer-events-none opacity-50' : ''}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
