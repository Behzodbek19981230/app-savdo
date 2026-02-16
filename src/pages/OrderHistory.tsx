import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-picker';
import { useOrderHistory } from '@/hooks/api/useOrderHistory';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/api/useUsers';
import { Loader2, Eye, Package } from 'lucide-react';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useClients } from '@/hooks/api/useClients';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 50;

export default function OrderHistoryPage() {
	const { selectedFilialId } = useAuthContext();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [employee, setEmployee] = useState<number | null>(null);
	const [status, setStatus] = useState<string>('all');
	const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
	const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

	const { data: usersData } = useUsers({ perPage: 1000, is_active: true });
	const users = usersData?.results || [];

	// Client autocomplete state
	const [clientId, setClientId] = useState<number | null>(null);
	const [clientSearch, setClientSearch] = useState('');
	const [clientPage, setClientPage] = useState(1);
	const [clientOptions, setClientOptions] = useState<Array<{ value: number; label: string }>>([]);

	const {
		data: clientsData,
		isLoading: isClientsLoading,
		isFetching: isClientsFetching,
	} = useClients({
		page: clientPage,
		perPage: 50,
		search: clientSearch || undefined,
		filial: selectedFilialId ?? undefined,
	});

	const clientsResults = clientsData?.results || [];
	const clientsPagination = clientsData?.pagination;
	const clientsHasMore = !!clientsPagination && clientsPagination.lastPage > (clientsPagination.currentPage || 1);

	useEffect(() => {
		if (clientPage === 1) {
			setClientOptions(
				clientsResults.map((c: any) => ({ value: c.id, label: c.full_name || c.phone_number || `#${c.id}` })),
			);
		} else if (clientsResults.length > 0) {
			setClientOptions((prev) => [
				...prev,
				...clientsResults.map((c: any) => ({
					value: c.id,
					label: c.full_name || c.phone_number || `#${c.id}`,
				})),
			]);
		}
	}, [clientsData]);

	useEffect(() => {
		// reset pages/options when search or filial changes
		setClientPage(1);
		setClientOptions([]);
	}, [clientSearch, selectedFilialId]);

	// Build params
	const params: Record<string, unknown> = {
		page,
		perPage: ITEMS_PER_PAGE,
		filial: selectedFilialId ?? undefined,
	};
	if (search) params.search = search;
	if (clientId) params.client = clientId;
	if (employee) params.employee = employee;
	if (status !== 'all') params.order_status = status === 'completed' ? true : false;
	if (dateFrom) params.date_from = moment(dateFrom).format('YYYY-MM-DD');
	if (dateTo) params.date_to = moment(dateTo).format('YYYY-MM-DD');

	const { data, isLoading } = useOrderHistory(params);

	const items = data?.results || [];
	const pagination = data?.pagination;
	const totalPages = pagination?.lastPage || 1;

	useEffect(() => {
		setPage(1);
	}, [search, employee, status, dateFrom, dateTo, selectedFilialId]);

	const navigate = useNavigate();

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
						<div>
							<CardTitle>Buyurtma tarixi</CardTitle>
							<CardDescription>Buyurtmalar ro'yxati</CardDescription>
						</div>
						<div className='flex items-center gap-2'>
							<Input
								placeholder='Mijoz nomi yoki telefon'
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className='min-w-[220px]'
							/>
							<div className='w-[260px]'>
								<Autocomplete
									options={clientOptions}
									value={clientId ?? undefined}
									onValueChange={(v) => setClientId(Number(v))}
									placeholder='Mijozni tanlang'
									searchPlaceholder='Mijoz qidirish...'
									emptyText='Mijoz topilmadi'
									onSearchChange={(q) => setClientSearch(q)}
									onScrollToBottom={() => {
										if (clientsHasMore) setClientPage((p) => p + 1);
									}}
									hasMore={clientsHasMore}
									isLoading={isClientsLoading}
									isLoadingMore={isClientsFetching}
								/>
							</div>
							<Select
								onValueChange={(v) => setEmployee(v && v !== '0' ? Number(v) : null)}
								value={employee ? String(employee) : '0'}
							>
								<SelectTrigger className='min-w-[180px]'>
									<SelectValue placeholder='Barcha xodimlar' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='0'>Barcha xodimlar</SelectItem>
									{users.map((u: any) => (
										<SelectItem key={u.id} value={String(u.id)}>
											{u.full_name || u.username}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select onValueChange={(v) => setStatus(v)} value={status}>
								<SelectTrigger className='min-w-[140px]'>
									<SelectValue placeholder='Barcha holatlar' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>Barchasi</SelectItem>
									<SelectItem value='completed'>Yakunlangan</SelectItem>
									<SelectItem value='pending'>Korzinkada</SelectItem>
								</SelectContent>
							</Select>
							<DateRangePicker
								dateFrom={dateFrom}
								dateTo={dateTo}
								onDateFromChange={(d) => setDateFrom(d)}
								onDateToChange={(d) => setDateTo(d)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='flex items-center justify-center py-10'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
						</div>
					) : items.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-10 text-center'>
							<Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
							<p className='text-muted-foreground'>Buyurtmalar topilmadi</p>
						</div>
					) : (
						<>
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='w-[60px]'>t/r</TableHead>
											<TableHead>Mijoz</TableHead>
											<TableHead>Xodim</TableHead>
											<TableHead>Zakaz (summa)</TableHead>
											<TableHead>To'langan</TableHead>
											<TableHead>Qarz</TableHead>
											<TableHead>Umumiy qarz</TableHead>
											<TableHead>Sanasi</TableHead>
											<TableHead>Holati</TableHead>
											<TableHead className='text-right'>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{items.map((it: any, idx: number) => (
											<TableRow key={it.id}>
												<TableCell className='font-medium'>
													{(page - 1) * ITEMS_PER_PAGE + idx + 1}
												</TableCell>
												<TableCell>{it.client_detail?.full_name || `#${it.client}`}</TableCell>
												<TableCell>{it.created_by_detail?.full_name || '-'}</TableCell>
												<TableCell className='text-blue-600 font-semibold'>
													<Link to={`/order-history/${it.id}`}>
														{it.all_product_summa || '0'}
													</Link>
												</TableCell>
												<TableCell>0</TableCell>
												<TableCell>0</TableCell>
												<TableCell>{it.total_debt_client || '0'}</TableCell>
												<TableCell>
													{it.created_time
														? moment(it.created_time).format('YYYY-MM-DD HH:mm')
														: '-'}
												</TableCell>
												<TableCell>
													{it.order_status ? (
														<span className='px-3 py-1 rounded-full bg-green-100 text-green-700'>
															Yakunlangan
														</span>
													) : (
														<span className='px-3 py-1 rounded-full bg-yellow-100 text-yellow-700'>
															Korzinkada
														</span>
													)}
												</TableCell>
												<TableCell className='text-right'>
													<div className='flex items-center justify-end gap-1'>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => navigate(`/order-history/${it.id}`)}
														>
															<Eye className='h-4 w-4' />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className='mt-4 flex justify-center'>
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} />
											</PaginationItem>
											{[...Array(Math.min(5, totalPages))].map((_, i) => {
												let pageNum: number;
												if (totalPages <= 5) pageNum = i + 1;
												else if (page <= 3) pageNum = i + 1;
												else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
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
													onClick={() => setPage(Math.min(totalPages, page + 1))}
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
