import { Fragment, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, Plus, Pencil, Trash2, SearchIcon, X } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Autocomplete } from '@/components/ui/autocomplete';
import { DateRangePicker } from '@/components/ui/date-picker';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';
import { ExpenseModal } from '@/components/expenses/ExpenseModal';
import { useExpenseCategories } from '@/hooks/api/useExpenseCategories';
import { Expense } from '@/services/expenseService';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 50;

interface ExpenseItem {
	id: number;
	date: string;
	summa_total_dollar: string;
	summa_dollar?: string;
	summa_naqt?: string;
	summa_kilik?: string;
	summa_terminal?: string;
	summa_transfer?: string;
	note?: string;
	category?: number;
	category_detail?: { id: number; name?: string };
	employee_detail?: { full_name?: string };
	filial?: number;
	created_time?: string;
}

interface ExpenseGroup {
	date: string;
	items: ExpenseItem[];
	totals?: {
		summa_total_dollar?: string;
		summa_dollar?: string;
		summa_naqt?: string;
		summa_kilik?: string;
		summa_terminal?: string;
		summa_transfer?: string;
	};
}

interface ExpensesGroupResponse {
	results: ExpenseGroup[];
	pagination?: {
		currentPage?: number;
		lastPage?: number;
		perPage?: number;
		total?: number;
	};
}

export default function ExpensesPage() {
	const { selectedFilialId } = useAuthContext();
	const roles = useRole();
	const today = format(new Date(), 'yyyy-MM-dd');
	const [page, setPage] = useState(1);
	const [data, setData] = useState<ExpensesGroupResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [editingItem, setEditingItem] = useState<Expense | null>(null);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);

	// Applied filters (used for querying)
	const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
	const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
	const [category, setCategory] = useState<number | null>(null);

	// Form-level filters (user edits these but they won't apply until user clicks "Filter")
	const [formDateFrom, setFormDateFrom] = useState<Date | undefined>(undefined);
	const [formDateTo, setFormDateTo] = useState<Date | undefined>(undefined);
	const [formCategory, setFormCategory] = useState<number | null>(null);

	// Get categories for filter
	const { data: categoriesData } = useExpenseCategories({
		limit: 1000,
		is_delete: false,
	});
	const categories = categoriesData?.results || [];

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const params: Record<string, unknown> = { page, perPage: ITEMS_PER_PAGE };
			if (selectedFilialId) params.filial = selectedFilialId;
			if (dateFrom) params.date_from = moment(dateFrom).format('YYYY-MM-DD');
			if (dateTo) params.date_to = moment(dateTo).format('YYYY-MM-DD');
			if (category) params.category = category;
			const res = await api.get<ExpensesGroupResponse>('/expense/group-by-date', { params });
			setData(res);
		} catch (err) {
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	}, [page, selectedFilialId, dateFrom, dateTo, category]);

	useEffect(() => {
		void fetchData();
	}, [fetchData]);

	const groups = data?.results || [];
	const pagination = data?.pagination;
	const lastPage = pagination?.lastPage || 1;

	const formatCurrency = (value: string | number | undefined) => {
		if (!value) return '0.00';
		const num = typeof value === 'string' ? parseFloat(value) : value;
		return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
	};

	const openCreate = () => {
		setEditingItem(null);
		setIsDialogOpen(true);
	};

	const openEdit = (item: ExpenseItem) => {
		// Convert ExpenseItem to Expense format for ExpenseModal
		const expenseData: Expense = {
			...item,
			summa_total_dollar: Number(item.summa_total_dollar) || 0,
			summa_dollar: Number(item.summa_dollar) || 0,
			summa_naqt: Number(item.summa_naqt) || 0,
			summa_kilik: Number(item.summa_kilik) || 0,
			summa_terminal: Number(item.summa_terminal) || 0,
			summa_transfer: Number(item.summa_transfer) || 0,
		};
		setEditingItem(expenseData);
		setIsDialogOpen(true);
	};

	const handleModalSuccess = () => {
		setIsDialogOpen(false);
		setEditingItem(null);
		fetchData();
	};

	const handleModalClose = () => {
		setIsDialogOpen(false);
		setEditingItem(null);
	};

	const onDelete = async () => {
		if (!deletingId) return;
		setIsSubmitting(true);
		try {
			await api.delete(`/expense/${deletingId}`);
			toast.success("Xarajat o'chirildi");
			setIsDeleteDialogOpen(false);
			setDeletingId(null);
			await fetchData();
		} catch (error) {
			console.error(error);
			toast.error("Xarajatni o'chirishda xatolik");
		} finally {
			setIsSubmitting(false);
		}
	};

	const openDetail = (item: ExpenseItem) => {
		setSelectedExpense(item);
		setIsDetailDialogOpen(true);
	};

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
						<CardTitle>Xarajatlar</CardTitle>
						<div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-end gap-2 w-full'>
							<div className='w-full sm:w-auto'>
								<Autocomplete
									options={[
										{ value: 0, label: 'Barcha kategoriyalar' },
										...categories.map((cat) => ({ value: cat.id, label: cat.name })),
									]}
									value={formCategory ?? 0}
									onValueChange={(v) => setFormCategory(Number(v) === 0 ? null : Number(v))}
									placeholder='Barcha kategoriyalar'
									className='w-full sm:min-w-[200px] h-7'
								/>
							</div>

							<div className='w-full sm:w-auto'>
								<DateRangePicker
									dateFrom={formDateFrom}
									dateTo={formDateTo}
									onDateFromChange={(d) => setFormDateFrom(d)}
									onDateToChange={(d) => setFormDateTo(d)}
									className='[&>div>button]:h-7'
								/>
							</div>

							<div className='w-full sm:w-auto flex gap-2 items-center'>
								<Button
									onClick={() => {
										// apply form filters
										setDateFrom(formDateFrom);
										setDateTo(formDateTo);
										setCategory(formCategory);
										setPage(1);
									}}
									className='bg-blue-600 hover:bg-blue-700 text-white '
								>
									<SearchIcon className='h-4 w-4' />
									Qidirish
								</Button>
								<Button
									variant='outline'
									onClick={() => {
										// clear both form and applied filters
										setFormDateFrom(undefined);
										setFormDateTo(undefined);
										setFormCategory(null);

										setDateFrom(undefined);
										setDateTo(undefined);
										setCategory(null);
										setPage(1);
									}}
									className='border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 '
								>
									<X className='h-4 w-4' />
									Tozalash
								</Button>
								<Button onClick={openCreate} className='bg-green-600 hover:bg-green-700 text-white '>
									<Plus className='h-4 w-4' />
									Qo'shish
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='flex items-center justify-center py-10'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
						</div>
					) : groups.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-10 text-center'>
							<Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
							<p className='text-muted-foreground'>Xarajatlar topilmadi</p>
						</div>
					) : (
						<div className='rounded-md border overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-[60px]'>t/r</TableHead>

										<TableHead className='w-[110px]'>Sana</TableHead>
										<TableHead>Kategoriya</TableHead>
										<TableHead>Xodim</TableHead>
										<TableHead className='text-right'>Jami ($)</TableHead>
										<TableHead className='text-right'>Dollar ($)</TableHead>
										<TableHead className='text-right'>So'm</TableHead>
										<TableHead className='text-right'>Kilik</TableHead>
										<TableHead className='text-right'>Terminal</TableHead>
										<TableHead className='text-right'>Transfer</TableHead>
										<TableHead className='text-right'>Amallar</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{groups.map((group: ExpenseGroup) => {
										return (
											<Fragment key={`group-${group.date}`}>
												{group.items.map((it: ExpenseItem, idx: number) => (
													<TableRow key={it.id}>
														<TableCell className='font-medium'>
															{group.items.length - idx}
														</TableCell>
														{idx === 0 && (
															<TableCell
																rowSpan={group.items.length}
																className='font-medium align-top'
															>
																<div className='flex items-start gap-2'>
																	<span>
																		{moment(group.date).format('DD.MM.YYYY')}
																	</span>
																</div>
															</TableCell>
														)}

														<TableCell>{it.category_detail?.name || '-'}</TableCell>
														<TableCell>{it.employee_detail?.full_name || '-'}</TableCell>
														<TableCell className='text-right text-blue-600 font-semibold'>
															<button
																onClick={() => openDetail(it)}
																className='hover:underline cursor-pointer'
																title="Batafsil ko'rish"
															>
																{formatCurrency(it.summa_total_dollar)}
															</button>
														</TableCell>
														<TableCell className='text-right'>
															{formatCurrency(it.summa_dollar)}
														</TableCell>
														<TableCell className='text-right'>
															{formatCurrency(it.summa_naqt)}
														</TableCell>
														<TableCell className='text-right'>
															{formatCurrency(it.summa_kilik)}
														</TableCell>
														<TableCell className='text-right'>
															{formatCurrency(it.summa_terminal)}
														</TableCell>
														<TableCell className='text-right'>
															{formatCurrency(it.summa_transfer)}
														</TableCell>
														<TableCell className='text-right'>
															{format(it.created_time, 'yyyy-MM-dd') === today ||
															roles.isAdmin ||
															roles.isSuperAdmin ? (
																<div className='flex items-center justify-end '>
																	<Button
																		size='icon'
																		variant='ghost'
																		className=' text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-950/30'
																		onClick={() => openEdit(it)}
																	>
																		<Pencil className='h-4 w-4' />
																	</Button>
																	<Button
																		size='icon'
																		variant='ghost'
																		className=' text-destructive hover:text-destructive hover:bg-destructive/10'
																		onClick={() => {
																			setDeletingId(it.id);
																			setIsDeleteDialogOpen(true);
																		}}
																	>
																		<Trash2 className='h-4 w-4' />
																	</Button>
																</div>
															) : (
																''
															)}
														</TableCell>
													</TableRow>
												))}
											</Fragment>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}

					{/* Pagination */}
					{!isLoading && groups.length > 0 && lastPage > 1 && (
						<div className='mt-4 flex justify-center'>
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

			<ExpenseModal
				isOpen={isDialogOpen}
				onClose={handleModalClose}
				onSuccess={handleModalSuccess}
				initialData={editingItem}
			/>

			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={(open) => {
					setIsDeleteDialogOpen(open);
					if (!open) setDeletingId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
						<AlertDialogDescription>Bu amal orqali xarajat o'chiriladi.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmitting}>Bekor qilish</AlertDialogCancel>
						<AlertDialogAction onClick={onDelete} disabled={isSubmitting}>
							{isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							O'chirish
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Detail Dialog */}
			<Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
				<DialogContent className='sm:max-w-[500px]'>
					<DialogHeader>
						<DialogTitle>Xarajat tafsilotlari</DialogTitle>
					</DialogHeader>
					<div className='mt-4 space-y-2 text-xs'>
						<div className='flex justify-between gap-3'>
							<span className='text-muted-foreground'>Sana:</span>
							<span>{selectedExpense?.date || '-'}</span>
						</div>
						<div className='flex justify-between gap-3'>
							<span className='text-muted-foreground'>Kategoriya:</span>
							<span>{selectedExpense?.category_detail?.name || '-'}</span>
						</div>
						<div className='flex justify-between gap-3'>
							<span className='text-muted-foreground'>Xodim:</span>
							<span>{selectedExpense?.employee_detail?.full_name || '-'}</span>
						</div>
						<div className='flex justify-between gap-3'>
							<span className='text-muted-foreground'>Jami ($):</span>
							<span>{formatCurrency(selectedExpense?.summa_total_dollar)}</span>
						</div>
						<div className='flex justify-between gap-3'>
							<span className='text-muted-foreground'>Dollar ($):</span>
							<span>{formatCurrency(selectedExpense?.summa_dollar)}</span>
						</div>
						<div className='flex justify-between gap-3'>
							<span className='text-muted-foreground'>So'm:</span>
							<span>{formatCurrency(selectedExpense?.summa_naqt)}</span>
						</div>
						<div className='flex justify-between gap-3'>
							<span className='text-muted-foreground'>Kilik:</span>
							<span>{formatCurrency(selectedExpense?.summa_kilik)}</span>
						</div>
						<div className='flex justify-between gap-3'>
							<span className='text-muted-foreground'>Terminal:</span>
							<span>{formatCurrency(selectedExpense?.summa_terminal)}</span>
						</div>
						<div className='flex justify-between gap-3'>
							<span className='text-muted-foreground'>Transfer:</span>
							<span>{formatCurrency(selectedExpense?.summa_transfer)}</span>
						</div>
						<div className='pt-2 border-t'>
							<p className='text-muted-foreground mb-1'>Izoh:</p>
							<p className='whitespace-pre-wrap break-words'>{selectedExpense?.note || "Izoh yo'q"}</p>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
