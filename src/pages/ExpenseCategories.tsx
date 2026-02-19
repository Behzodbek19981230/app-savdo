/**
 * Expense Categories Page (Xarajat kategoriyalari)
 * Xarajat kategoriyalari - expense-category API
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	PaginationEllipsis,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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
import {
	Search,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Plus,
	Edit,
	Trash2,
	Loader2,
	Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
	useExpenseCategories,
	useCreateExpenseCategory,
	useUpdateExpenseCategory,
	useDeleteExpenseCategory,
} from '@/hooks/api/useExpenseCategories';
import { expenseCategorySchema, type ExpenseCategoryFormData } from '@/lib/validations/expenseCategory';
import type { ExpenseCategory } from '@/services/expenseCategory.service';

const ITEMS_PER_PAGE = 10;

type SortField = 'name' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function ExpenseCategories() {
	const queryClient = useQueryClient();
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortField, setSortField] = useState<SortField>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const form = useForm<ExpenseCategoryFormData>({
		resolver: zodResolver(expenseCategorySchema),
		defaultValues: {
			name: '',
		},
	});

	const ordering =
		sortField && sortDirection
			? `${sortDirection === 'desc' ? '-' : ''}${sortField}`
			: undefined;

	const { data, isLoading } = useExpenseCategories({
		page: currentPage,
		limit: ITEMS_PER_PAGE,
		search: searchQuery || undefined,
		ordering,
		is_delete: false,
	});

	const createCategory = useCreateExpenseCategory();
	const updateCategory = useUpdateExpenseCategory();
	const deleteCategory = useDeleteExpenseCategory();

	const categories = data?.results || [];
	const pagination = data?.pagination;
	const totalPages = pagination?.lastPage || 1;

	const isMutating =
		createCategory.isPending || updateCategory.isPending || deleteCategory.isPending;

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			if (sortDirection === 'asc') {
				setSortDirection('desc');
			} else if (sortDirection === 'desc') {
				setSortField(null);
				setSortDirection(null);
			} else {
				setSortDirection('asc');
			}
		} else {
			setSortField(field);
			setSortDirection('asc');
		}
		setCurrentPage(1);
	};

	const getSortIcon = (field: SortField) => {
		if (sortField !== field) {
			return <ArrowUpDown className='h-4 w-4 ml-2 text-muted-foreground' />;
		}
		if (sortDirection === 'asc') {
			return <ArrowUp className='h-4 w-4 ml-2' />;
		}
		return <ArrowDown className='h-4 w-4 ml-2' />;
	};

	const handleOpenDialog = (item?: ExpenseCategory) => {
		if (item) {
			setEditingId(item.id);
			form.reset({
				name: item.name || '',
			});
		} else {
			setEditingId(null);
			form.reset({
				name: '',
			});
		}
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingId(null);
		form.reset();
		// Modal yopilganda list'ni yangilash
		queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
	};

	const onSubmit = async (data: ExpenseCategoryFormData) => {
		try {
			const submitData = {
				name: data.name,
			};

			if (editingId) {
				await updateCategory.mutateAsync({ id: editingId, data: submitData });
			} else {
				await createCategory.mutateAsync(submitData);
			}
			handleCloseDialog();
		} catch (error) {
			console.error('Error saving category:', error);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			await deleteCategory.mutateAsync(deletingId);
			setIsDeleteDialogOpen(false);
			setDeletingId(null);
			// O'chirilganda list'ni yangilash
			queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
		} catch (error) {
			console.error('Error deleting category:', error);
		}
	};

	const openDeleteDialog = (id: number) => {
		setDeletingId(id);
		setIsDeleteDialogOpen(true);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const renderPaginationItems = () => {
		const items = [];
		const maxVisible = 5;
		let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
		const endPage = Math.min(totalPages, startPage + maxVisible - 1);

		if (endPage - startPage < maxVisible - 1) {
			startPage = Math.max(1, endPage - maxVisible + 1);
		}

		if (startPage > 1) {
			items.push(
				<PaginationItem key='1'>
					<PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
						1
					</PaginationLink>
				</PaginationItem>
			);
			if (startPage > 2) {
				items.push(<PaginationEllipsis key='ellipsis-start' />);
			}
		}

		for (let i = startPage; i <= endPage; i++) {
			items.push(
				<PaginationItem key={i}>
					<PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
						{i}
					</PaginationLink>
				</PaginationItem>
			);
		}

		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				items.push(<PaginationEllipsis key='ellipsis-end' />);
			}
			items.push(
				<PaginationItem key={totalPages}>
					<PaginationLink
						onClick={() => handlePageChange(totalPages)}
						isActive={currentPage === totalPages}
					>
						{totalPages}
					</PaginationLink>
				</PaginationItem>
			);
		}

		return items;
	};

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader className='pb-4 flex flex-row items-center justify-between'>
					<div>
						<div className='flex items-center gap-2'>
							<Receipt className='h-5 w-5 text-primary' />
							<CardTitle className='text-lg'>Xarajat kategoriyalari</CardTitle>
						</div>
						<CardDescription>
							Jami {pagination?.total || 0} ta xarajat kategoriyasi
						</CardDescription>
					</div>
					<Button onClick={() => handleOpenDialog()}>
						<Plus className='mr-2 h-4 w-4' />
						Yangi kategoriya qo&apos;shish
					</Button>
				</CardHeader>
				<CardContent>
					<div className='mb-4'>
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
							<Input
								placeholder='Qidirish...'
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setCurrentPage(1);
								}}
								className='pl-9'
							/>
						</div>
					</div>

					{isLoading ? (
						<div className='flex items-center justify-center py-8'>
							<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
						</div>
					) : categories.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-8 text-center'>
							<Receipt className='h-12 w-12 text-muted-foreground/50 mb-3' />
							<p className='text-muted-foreground'>Ma&apos;lumot topilmadi</p>
						</div>
					) : (
						<>
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='w-[100px]'>#</TableHead>
											<TableHead>
												<button
													className='flex items-center hover:text-foreground transition-colors'
													onClick={() => handleSort('name')}
												>
													Nomi
													{getSortIcon('name')}
												</button>
											</TableHead>
											<TableHead className='text-right'>Amallar</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{categories.map((category, index) => (
											<TableRow key={category.id}>
												<TableCell>
													{index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}
												</TableCell>
												<TableCell className='font-medium'>{category.name}</TableCell>
												<TableCell className='text-right'>
													<div className='flex items-center justify-end gap-2'>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => handleOpenDialog(category)}
														>
															<Edit className='h-4 w-4' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => openDeleteDialog(category.id)}
														>
															<Trash2 className='h-4 w-4 text-destructive' />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{totalPages > 1 && (
								<div className='mt-4'>
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
													className={cn(
														currentPage === 1 && 'pointer-events-none opacity-50'
													)}
												/>
											</PaginationItem>
											{renderPaginationItems()}
											<PaginationItem>
												<PaginationNext
													onClick={() =>
														handlePageChange(Math.min(totalPages, currentPage + 1))
													}
													className={cn(
														currentPage === totalPages && 'pointer-events-none opacity-50'
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

			<Dialog
				open={isDialogOpen}
				onOpenChange={(open) => {
					setIsDialogOpen(open);
					if (!open) {
						handleCloseDialog();
					}
				}}
			>
				<DialogContent className='sm:max-w-[525px]'>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<DialogHeader>
								<DialogTitle>
									{editingId ? 'Tahrirlash' : "Yangi kategoriya qo'shish"}
								</DialogTitle>
								<DialogDescription>
									Xarajat kategoriyasi ma&apos;lumotlarini kiriting
								</DialogDescription>
							</DialogHeader>
							<div className='grid gap-4 py-4'>
								<FormField
									control={form.control}
									name='name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nomi *</FormLabel>
											<FormControl>
												<Input placeholder='Masalan: Ijara, Oylik, Reklama...' {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<DialogFooter>
								<Button type='button' variant='outline' onClick={handleCloseDialog}>
									Bekor qilish
								</Button>
								<Button type='submit' disabled={isMutating}>
									{isMutating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
									Saqlash
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={(open) => {
					setIsDeleteDialogOpen(open);
					if (!open) {
						// Delete dialog yopilganda list'ni yangilash
						queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
						<AlertDialogDescription>
							Bu amalni qaytarib bo&apos;lmaydi. Xarajat kategoriyasi butunlay o&apos;chiriladi.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Bekor qilish</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} disabled={isMutating}>
							{isMutating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							O&apos;chirish
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
