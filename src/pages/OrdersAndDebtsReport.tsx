import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-picker';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, SearchIcon, X, FileText, Eye } from 'lucide-react';
import {
	ordersAndDebtsReportService,
	OrdersAndDebtsReportGroup,
	OrdersAndDebtsReportItem,
} from '@/services/reports.service';
import { useClients } from '@/hooks/api/useClients';
import { ClientListResponse } from '@/services/client.service';
import { useQuery } from '@tanstack/react-query';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';

const LIMIT = 50;

const fmtTime = (datetime: string) => {
	if (!datetime) return '';
	try {
		const d = new Date(datetime);
		return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	} catch {
		return '';
	}
};

const fmt = (val: string | number | null | undefined) => {
	if (val === null || val === undefined || val === '') return '';
	const num = typeof val === 'string' ? parseFloat(val) : val;
	if (isNaN(num) || num === 0) return '';
	return new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const fmtAlways = (val: string | number | null | undefined) => {
	if (val === null || val === undefined || val === '') return '0.00';
	const num = typeof val === 'string' ? parseFloat(val) : val;
	if (isNaN(num)) return '0.00';
	return new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

function TypeBadge({ type }: { type: string }) {
	if (type === 'order') {
		return <span className='text-xs font-semibold text-green-700 dark:text-green-400'>Buyurtma qilgan</span>;
	}
	return <span className='text-xs font-semibold text-red-600 dark:text-red-400'>Qarz to&apos;lagan</span>;
}

function DateGroupRow({
	group,
	navigate,
}: {
	group: OrdersAndDebtsReportGroup;
	navigate: ReturnType<typeof useNavigate>;
}) {
	return (
		<>
			{/* Date header row */}
			<TableRow className='bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-950/40'>
				<TableCell colSpan={11} className='py-1.5 px-4'>
					<span className='text-xs font-bold text-blue-700 dark:text-blue-300'>{group.date_label}</span>
				</TableCell>
			</TableRow>

			{/* Item rows */}
			{group.items.map((item, idx) => (
				<ItemRow key={item.id} item={item} idx={idx} navigate={navigate} />
			))}

			{/* Totals row */}
			<TotalsRow group={group} />
		</>
	);
}

function ItemRow({
	item,
	idx,
	navigate,
}: {
	item: OrdersAndDebtsReportItem;
	idx: number;
	navigate: ReturnType<typeof useNavigate>;
}) {
	const isOrder = item.type === 'order';

	return (
		<TableRow className='hover:bg-muted/50 text-sm'>
			<TableCell className='px-3 py-2 text-muted-foreground'>{idx + 1}</TableCell>
			<TableCell className='px-3 py-2 font-medium'>{item.client_name || '—'}</TableCell>
			<TableCell className='px-3 py-2 text-muted-foreground'>{item.employee_name}</TableCell>
			<TableCell className='px-3 py-2 text-right text-blue-600 dark:text-blue-400'>
				{fmt(item.all_product_summa)}
			</TableCell>
			<TableCell className='px-3 py-2 text-right'>{fmt(item.summa_total_dollar)}</TableCell>
			<TableCell className='px-3 py-2 text-right text-orange-600 dark:text-orange-400'>
				{fmt(item.summa_dollar)}
			</TableCell>
			<TableCell className='px-3 py-2 text-right text-green-600 dark:text-green-400'>
				{fmt(item.all_profit_dollar)}
			</TableCell>
			<TableCell className='px-3 py-2 text-right text-red-600 dark:text-red-400'>
				{fmt(item.remaining_debt)}
			</TableCell>
			<TableCell className='px-3 py-2 text-muted-foreground whitespace-nowrap'>
				{fmtTime(item.datetime)}
			</TableCell>
			<TableCell className='px-3 py-2'>
				<TypeBadge type={item.type} />
			</TableCell>
			<TableCell className='px-3 py-2'>
				{isOrder && (
					<Button
						size='icon'
						variant='ghost'
						className='h-7 w-7 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30'
						onClick={() => navigate(`/order-history/${item.id}`)}
					>
						<Eye className='h-4 w-4' />
					</Button>
				)}
			</TableCell>
		</TableRow>
	);
}

function TotalsRow({ group }: { group: OrdersAndDebtsReportGroup }) {
	const t = group.totals;

	const toNum = (v: string | number | null | undefined) => {
		if (!v) return 0;
		const n = typeof v === 'string' ? parseFloat(v) : v;
		return isNaN(n) ? 0 : n;
	};

	const orderItems = group.items.filter((i) => i.type === 'order');
	const debtItems = group.items.filter((i) => i.type === 'debt_repayment');

	const calcGroup = (items: OrdersAndDebtsReportItem[]) => ({
		jami: items.reduce((s, i) => s + toNum(i.summa_total_dollar), 0),
		dollar: items.reduce((s, i) => s + toNum(i.summa_dollar), 0),
		naqt: items.reduce((s, i) => s + toNum(i.summa_naqt), 0),
		karta: items.reduce((s, i) => s + toNum(i.summa_kilik) + toNum(i.summa_terminal) + toNum(i.summa_transfer), 0),
	});

	const orderT = calcGroup(orderItems);
	const debtT = calcGroup(debtItems);

	const MultiLine = ({ data }: { data: { jami: number; dollar: number; naqt: number; karta: number } }) => (
		<div className='space-y-0.5 text-right'>
			<div className='text-green-700 dark:text-green-400'>
				<span className='text-muted-foreground font-normal'>Jami ($): </span>
				{fmtAlways(data.jami)}
			</div>
			<div className='text-green-700 dark:text-green-400'>
				<span className='text-muted-foreground font-normal'>Dollar ($): </span>
				{fmtAlways(data.dollar)}
			</div>
			<div className='text-green-700 dark:text-green-400'>
				<span className='text-muted-foreground font-normal'>Naqt: </span>
				{fmtAlways(data.naqt)}
			</div>
			<div className='text-green-700 dark:text-green-400'>
				<span className='text-muted-foreground font-normal'>Karta: </span>
				{fmtAlways(data.karta)}
			</div>
		</div>
	);

	return (
		<TableRow className='bg-gray-50 dark:bg-gray-900/60 font-semibold text-xs border-t-2 border-gray-200 dark:border-gray-700'>
			<TableCell className='px-3 py-2' colSpan={3}>
				<span className='text-muted-foreground'>Umumiy summa:</span>
			</TableCell>
			<TableCell className='px-3 py-2 text-right text-blue-600 dark:text-blue-400'>
				{fmtAlways(t.all_product_summa)}
			</TableCell>
			<TableCell className='px-3 py-2'>
				<MultiLine data={orderT} />
			</TableCell>
			<TableCell className='px-3 py-2'>
				<MultiLine data={debtT} />
			</TableCell>
			<TableCell className='px-3 py-2 text-right text-green-600 dark:text-green-400'>
				{fmtAlways(t.all_profit_dollar)}
			</TableCell>
			<TableCell className='px-3 py-2 text-right text-red-600 dark:text-red-400'>
				{fmtAlways(t.remaining_debt)}
			</TableCell>
			<TableCell colSpan={3} />
		</TableRow>
	);
}

export default function OrdersAndDebtsReportPage() {
	const { selectedFilialId } = useAuthContext();
	const navigate = useNavigate();

	const getDefaultDates = () => {
		const today = new Date();
		const from = new Date();
		from.setDate(today.getDate() - 7);
		return { from, to: today };
	};

	const defaultDates = getDefaultDates();

	const [dateFrom, setDateFrom] = useState<Date>(defaultDates.from);
	const [dateTo, setDateTo] = useState<Date>(defaultDates.to);
	const [formDateFrom, setFormDateFrom] = useState<Date>(defaultDates.from);
	const [formDateTo, setFormDateTo] = useState<Date>(defaultDates.to);
	const [clientId, setClientId] = useState<number | null>(null);
	const [formClientId, setFormClientId] = useState<number | null>(null);
	const [page, setPage] = useState(1);

	const { data: clientsRaw } = useClients({ filial: selectedFilialId || undefined });
	const clientsData = clientsRaw as ClientListResponse | undefined;
	const clientOptions = (clientsData?.results ?? []).map((c) => ({
		value: String(c.id),
		label: c.full_name,
	}));

	const params = {
		filial_id: selectedFilialId || 0,
		date_from: dateFrom.toISOString().split('T')[0],
		date_to: dateTo.toISOString().split('T')[0],
		client_id: clientId ?? undefined,
		page,
		limit: LIMIT,
	};

	const { data, isLoading } = useQuery({
		queryKey: [
			'orders-and-debts-report',
			params.filial_id,
			params.date_from,
			params.date_to,
			params.client_id,
			page,
		],
		queryFn: () => ordersAndDebtsReportService.getReport(params),
		enabled: !!selectedFilialId,
	});

	const groups: OrdersAndDebtsReportGroup[] = data?.results ?? [];
	const total = data?.pagination?.total ?? 0;
	const lastPage = data?.pagination?.lastPage ?? 1;
	const summary = data?.summary;

	const handleFilter = () => {
		setDateFrom(formDateFrom);
		setDateTo(formDateTo);
		setClientId(formClientId);
		setPage(1);
	};

	const handleClear = () => {
		const d = getDefaultDates();
		setFormDateFrom(d.from);
		setFormDateTo(d.to);
		setDateFrom(d.from);
		setDateTo(d.to);
		setFormClientId(null);
		setClientId(null);
		setPage(1);
	};

	return (
		<div className='space-y-4'>
			<Card>
				<CardHeader className='pb-3'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
						<div className='flex items-center gap-3'>
							<CardTitle className='text-xl font-bold whitespace-nowrap'>
								Buyurtmalar va qarzlar
							</CardTitle>
							{!isLoading && total > 0 && (
								<span className='text-sm text-muted-foreground'>({total} ta yozuv)</span>
							)}
						</div>
						<div className='flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap'>
							<Autocomplete
								options={clientOptions}
								value={formClientId ? String(formClientId) : ''}
								onValueChange={(val) => setFormClientId(val ? Number(val) : null)}
								placeholder='Mijoz tanlang'
								className='w-full sm:w-52'
							/>
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
								<Button variant='outline' onClick={handleClear} className='h-8 text-xs px-3'>
									<X className='h-3.5 w-3.5 mr-1' />
									Tozalash
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className='p-0'>
					{isLoading ? (
						<div className='flex items-center justify-center py-16'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
						</div>
					) : groups.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-16 text-center'>
							<FileText className='h-12 w-12 text-muted-foreground/40 mb-3' />
							<p className='text-muted-foreground text-sm'>Ma&apos;lumotlar topilmadi</p>
						</div>
					) : (
						<>
							<div className='overflow-x-auto'>
								<Table>
									<TableHeader>
										<TableRow className='bg-muted/50'>
											<TableHead className='px-3 py-2 w-8'>#</TableHead>
											<TableHead className='px-3 py-2'>Mijoz</TableHead>
											<TableHead className='px-3 py-2'>Hodim</TableHead>
											<TableHead className='px-3 py-2 text-right whitespace-nowrap'>
												To&apos;lanadigan summa ($)
											</TableHead>
											<TableHead className='px-3 py-2 text-right whitespace-nowrap'>
												To&apos;langan summa ($)
											</TableHead>
											<TableHead className='px-3 py-2 text-right whitespace-nowrap'>
												To&apos;langan qarz ($)
											</TableHead>
											<TableHead className='px-3 py-2 text-right whitespace-nowrap'>
												Foyda ($)
											</TableHead>
											<TableHead className='px-3 py-2 text-right whitespace-nowrap'>
												Umumiy qolgan qarz ($)
											</TableHead>
											<TableHead className='px-3 py-2 whitespace-nowrap'>Vaqti</TableHead>
											<TableHead className='px-3 py-2'>Holati</TableHead>
											<TableHead className='px-3 py-2 w-10' />
										</TableRow>
									</TableHeader>
									<TableBody>
										{groups.map((group) => (
											<DateGroupRow key={group.date} group={group} navigate={navigate} />
										))}
									</TableBody>
								</Table>
							</div>

							{/* Grand summary */}
							{summary && (
								<div className='border-t-2 border-primary/20 bg-muted/30 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
									{[
										{
											label: "Jami to'lanadigan ($)",
											value: summary.all_product_summa,
											cls: 'text-blue-600 dark:text-blue-400',
										},
										{
											label: "Jami to'langan ($)",
											value: summary.summa_total_dollar,
											cls: 'text-gray-800 dark:text-gray-100',
										},
										{
											label: 'Jami dollar ($)',
											value: summary.summa_dollar,
											cls: 'text-orange-600 dark:text-orange-400',
										},
										{
											label: 'Jami naqt',
											value: summary.summa_naqt,
											cls: 'text-cyan-600 dark:text-cyan-400',
										},
										{
											label: 'Jami kilik',
											value: summary.summa_kilik,
											cls: 'text-purple-600 dark:text-purple-400',
										},
										{
											label: 'Jami terminal',
											value: summary.summa_terminal,
											cls: 'text-indigo-600 dark:text-indigo-400',
										},
										{
											label: 'Jami transfer',
											value: summary.summa_transfer,
											cls: 'text-teal-600 dark:text-teal-400',
										},
										{
											label: 'Jami foyda ($)',
											value: summary.all_profit_dollar,
											cls: 'text-green-600 dark:text-green-400',
										},
										{
											label: 'Jami qolgan qarz ($)',
											value: summary.remaining_debt,
											cls: 'text-red-600 dark:text-red-400',
										},
									].map(({ label, value, cls }) => (
										<div
											key={label}
											className='bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm'
										>
											<p className='text-xs text-muted-foreground'>{label}</p>
											<p className={`text-sm font-bold ${cls}`}>{fmtAlways(value)}</p>
										</div>
									))}
								</div>
							)}

							{lastPage > 1 && (
								<div className='py-4 flex justify-center'>
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
													className={
														page === lastPage ? 'pointer-events-none opacity-50' : ''
													}
												/>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
