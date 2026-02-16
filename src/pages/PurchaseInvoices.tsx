/**
 * PurchaseInvoices Page
 * /purchase-invoices
 * Tovar kirimi (fakturalar) ro'yxati
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import { usePurchaseInvoices, useDeletePurchaseInvoice } from '@/hooks/api/usePurchaseInvoice';
import { useAuthContext } from '@/contexts/AuthContext';
import type { PurchaseInvoice } from '@/types/purchaseInvoice';
import { DateRangePicker } from '@/components/ui/date-picker';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Plus, Trash2, Eye, Package, ArrowDownCircle } from 'lucide-react';
import moment from 'moment';

const ITEMS_PER_PAGE = 10;

type SortField = 'date' | 'all_product_summa' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function PurchaseInvoices() {
	const navigate = useNavigate();
	const [currentPage, setCurrentPage] = useState(1);
	const [sortField, setSortField] = useState<SortField>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
	const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

	const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;

	const { selectedFilialId } = useAuthContext();

	const { data, isLoading } = usePurchaseInvoices({
		page: currentPage,
		perPage: ITEMS_PER_PAGE,
		ordering,
		date_from: dateFrom ? moment(dateFrom).format('YYYY-MM-DD') : undefined,
		date_to: dateTo ? moment(dateTo).format('YYYY-MM-DD') : undefined,
		filial: selectedFilialId ?? undefined,
	});

	const deletePurchaseInvoice = useDeletePurchaseInvoice();

	const invoices = data?.results || [];
	const pagination = data?.pagination;
	const totalPages = pagination?.lastPage || 1;

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			if (sortDirection === 'asc') setSortDirection('desc');
			else if (sortDirection === 'desc') {
				setSortField(null);
				setSortDirection(null);
			} else setSortDirection('asc');
		} else {
			setSortField(field);
			setSortDirection('asc');
		}
		setCurrentPage(1);
	};

	const getSortIcon = (field: SortField) => {
		if (sortField !== field) return <ArrowUpDown className='h-4 w-4 ml-2 text-muted-foreground' />;
		if (sortDirection === 'asc') return <ArrowUp className='h-4 w-4 ml-2' />;
		return <ArrowDown className='h-4 w-4 ml-2' />;
	};

	const openDeleteDialog = (id: number) => {
		setDeletingId(id);
		setIsDeleteDialogOpen(true);
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			await deletePurchaseInvoice.mutateAsync(deletingId);
			setIsDeleteDialogOpen(false);
			setDeletingId(null);
		} catch {
			// handled in hook toast
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('uz-UZ').format(value);
	};

	const formatDollar = (value: number) => {
		return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
	};

	const getInvoiceTypeBadge = (type: number) => {
		if (type === 0) {
			return (
				<Badge variant='default' className='bg-green-600'>
					Kirim
				</Badge>
			);
		}
		return <Badge variant='destructive'>Vozvrat</Badge>;
	};

	return (
		<div className='space-y-6'>
			{/* Header */}

			{/* Table Card */}
			<Card>
				<CardHeader className='pb-4'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
						<div>
							<CardTitle>Tovar kirimi</CardTitle>
							<CardDescription>Ta'minotchilardan tovar kirimi ro'yxati</CardDescription>
						</div>
						<div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
							<DateRangePicker
								dateFrom={dateFrom}
								dateTo={dateTo}
								onDateFromChange={(date) => {
									setDateFrom(date);
									setCurrentPage(1);
								}}
								onDateToChange={(date) => {
									setDateTo(date);
									setCurrentPage(1);
								}}
							/>
							<Button onClick={() => navigate('/purchase-invoices/add')} className='gap-2'>
								<Plus className='h-4 w-4' />
								Yangi kirim
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='flex items-center justify-center py-10'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
						</div>
					) : invoices.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-10 text-center'>
							<Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
							<p className='text-muted-foreground'>Hozircha fakturalar mavjud emas</p>
							<Button
								variant='outline'
								className='mt-4'
								onClick={() => navigate('/purchase-invoices/add')}
							>
								<Plus className='h-4 w-4 mr-2' />
								Birinchi fakturani qo'shing
							</Button>
						</div>
					) : (
						<>
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='w-[60px]'>#</TableHead>
											<TableHead
												className='cursor-pointer select-none'
												onClick={() => handleSort('date')}
											>
												<div className='flex items-center'>
													Sana
													{getSortIcon('date')}
												</div>
											</TableHead>
											<TableHead>Turi</TableHead>
											<TableHead>Ta'minotchi</TableHead>
											<TableHead>Filial</TableHead>
											<TableHead>Ombor</TableHead>
											<TableHead className='text-right'>Mahsulotlar</TableHead>
											<TableHead
												className='cursor-pointer select-none text-right'
												onClick={() => handleSort('all_product_summa')}
											>
												<div className='flex items-center justify-end'>
													Jami summa
													{getSortIcon('all_product_summa')}
												</div>
											</TableHead>
											<TableHead className='text-right w-[100px]'>Amallar</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{invoices.map((invoice, index) => (
											<TableRow key={invoice.id}>
												<TableCell className='font-medium'>
													{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
												</TableCell>
												<TableCell>{moment(invoice.date).format('DD.MM.YYYY')}</TableCell>
												<TableCell>{getInvoiceTypeBadge(invoice.type)}</TableCell>
												<TableCell>
													{invoice.supplier_detail?.name || `#${invoice.supplier}`}
												</TableCell>
												<TableCell>
													{invoice.filial_detail?.name || `#${invoice.filial}`}
												</TableCell>
												<TableCell>
													{invoice.sklad_detail?.name || `#${invoice.sklad}`}
												</TableCell>
												<TableCell className='text-right'>
													<Badge variant='outline'>{invoice.product_count} ta</Badge>
												</TableCell>
												<TableCell className='text-right font-semibold text-green-600'>
													${formatDollar(invoice.all_product_summa)}
												</TableCell>
												<TableCell className='text-right'>
													<div className='flex items-center justify-end gap-1'>
														<Button
															variant='ghost'
															size='icon'
															className='h-8 w-8'
															onClick={() => navigate(`/purchase-invoices/${invoice.id}`)}
														>
															<Eye className='h-4 w-4' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															className='h-8 w-8 text-destructive hover:text-destructive'
															onClick={() => openDeleteDialog(invoice.id)}
														>
															<Trash2 className='h-4 w-4' />
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
												<PaginationPrevious
													onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
													className={cn(
														currentPage === 1 && 'pointer-events-none opacity-50',
													)}
												/>
											</PaginationItem>
											{Array.from({ length: totalPages }, (_, i) => i + 1)
												.filter(
													(page) =>
														page === 1 ||
														page === totalPages ||
														Math.abs(page - currentPage) <= 1,
												)
												.map((page, idx, arr) => (
													<PaginationItem key={page}>
														{idx > 0 && arr[idx - 1] !== page - 1 && (
															<span className='px-2'>...</span>
														)}
														<PaginationLink
															onClick={() => setCurrentPage(page)}
															isActive={currentPage === page}
														>
															{page}
														</PaginationLink>
													</PaginationItem>
												))}
											<PaginationItem>
												<PaginationNext
													onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
													className={cn(
														currentPage === totalPages && 'pointer-events-none opacity-50',
													)}
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

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Fakturani o'chirish</AlertDialogTitle>
						<AlertDialogDescription>
							Haqiqatan ham bu fakturani o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Bekor qilish</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
							disabled={deletePurchaseInvoice.isPending}
						>
							{deletePurchaseInvoice.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							O'chirish
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
