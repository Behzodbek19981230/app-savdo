/**
 * Product Models Page
 * Mahsulot modellari sahifasi
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
	Search,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Plus,
	Edit,
	Trash2,
	Loader2,
	Box,
	Check,
	ChevronsUpDown,
	X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
	useProductModels,
	useCreateProductModel,
	useUpdateProductModel,
	useDeleteProductModel,
} from '@/hooks/api/useProductModels';
import { useProductCategories } from '@/hooks/api/useProductCategories';
import { useProductBranchCategories } from '@/hooks/api/useProductBranchCategories';
import { productModelSchema, type ProductModelFormData } from '@/lib/validations/productModel';
import type { ProductModel } from '@/services/productModel.service';

const ITEMS_PER_PAGE = 10;

type SortField = 'name' | 'sorting' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function ProductModels() {
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortField, setSortField] = useState<SortField>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
	const [branchCategoryId, setBranchCategoryId] = useState<number | null>(null);

	// Form
	const form = useForm<ProductModelFormData>({
		resolver: zodResolver(productModelSchema),
		defaultValues: {
			name: '',
			branch_category: 0,
			sorting: null,
		},
	});

	// Build ordering string for API
	const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;

	// Queries
	const { data, isLoading } = useProductModels({
		page: currentPage,
		limit: ITEMS_PER_PAGE,
		search: searchQuery || undefined,
		ordering,
		is_delete: false,
		branch_category: branchCategoryId || undefined,
	});

	const { data: categoriesData } = useProductCategories({
		limit: 1000,
		is_delete: false,
	});

	const { data: branchCategoriesData } = useProductBranchCategories({
		limit: 1000,
		is_delete: false,
	});

	// Mutations
	const createModel = useCreateProductModel();
	const updateModel = useUpdateProductModel();
	const deleteModel = useDeleteProductModel();

	const models = data?.results || [];
	const pagination = data?.pagination;
	const totalPages = pagination?.lastPage || 1;
	const categories = categoriesData?.results || [];
	const branchCategories = branchCategoriesData?.results || [];

	const isMutating = createModel.isPending || updateModel.isPending || deleteModel.isPending;

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

	const handleOpenDialog = (item?: ProductModel) => {
		if (item) {
			setEditingId(item.id);
			form.reset({
				name: item.name || '',
				branch_category: item.branch_category || 0,
				sorting: item.sorting,
			});
		} else {
			setEditingId(null);
			form.reset({
				name: '',
				sorting: null,
				branch_category: 0,
			});
		}
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingId(null);
		form.reset();
	};

	const onSubmit = async (data: ProductModelFormData) => {
		try {
			const submitData = {
				name: data.name,
				branch_category: data.branch_category,
				sorting: data.sorting === '' ? null : data.sorting,
			};

			if (editingId) {
				await updateModel.mutateAsync({ id: editingId, data: submitData });
			} else {
				await createModel.mutateAsync(submitData);
			}
			handleCloseDialog();
		} catch (error) {
			console.error('Error saving model:', error);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;

		try {
			await deleteModel.mutateAsync(deletingId);
			setIsDeleteDialogOpen(false);
			setDeletingId(null);
		} catch (error) {
			console.error('Error deleting model:', error);
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

	// Close dialog after successful mutation
	useEffect(() => {
		if (createModel.isSuccess || updateModel.isSuccess) {
			setIsDialogOpen(false);
			setEditingId(null);
			form.reset();
		}
	}, [createModel.isSuccess, updateModel.isSuccess, form]);

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
				</PaginationItem>,
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
				</PaginationItem>,
			);
		}

		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				items.push(<PaginationEllipsis key='ellipsis-end' />);
			}
			items.push(
				<PaginationItem key={totalPages}>
					<PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
						{totalPages}
					</PaginationLink>
				</PaginationItem>,
			);
		}

		return items;
	};

	return (
		<div className='space-y-6'>
			{/* Main Card */}
			<Card>
				<CardHeader className='pb-4 flex flex-row items-center justify-between'>
					<div>
						<div className='flex items-center gap-2'>
							<Box className='h-5 w-5 text-primary' />
							<CardTitle className='text-lg'>Mahsulot modellari</CardTitle>
						</div>
						<CardDescription>Jami {pagination?.total || 0} ta mahsulot modeli</CardDescription>
					</div>
					<Button onClick={() => handleOpenDialog()}>
						<Plus className='mr-2 h-4 w-4' />
						Yangi model qo'shish
					</Button>
				</CardHeader>
				<CardContent>
					<div className='mb-4 flex flex-col sm:flex-row gap-3'>
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
						<Select
							value={branchCategoryId?.toString() ?? 'all'}
							onValueChange={(v) => {
								setBranchCategoryId(v === 'all' ? null : Number(v));
								setCurrentPage(1);
							}}
						>
							<SelectTrigger className='w-full sm:w-[220px]'>
								<SelectValue placeholder='Barcha filial kategoriyalari' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>Barcha filial kategoriyalari</SelectItem>
								{branchCategories.map((cat) => (
									<SelectItem key={cat.id} value={String(cat.id)}>
										{cat.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Table */}
					{isLoading ? (
						<div className='flex items-center justify-center py-8'>
							<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
						</div>
					) : models.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-8 text-center'>
							<Box className='h-12 w-12 text-muted-foreground/50 mb-3' />
							<p className='text-muted-foreground'>Ma'lumot topilmadi</p>
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
											<TableHead>Kategoriyalar</TableHead>

											<TableHead className='text-right'>Amallar</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{models.map((model, index) => (
											<TableRow key={model.id}>
												<TableCell>{index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</TableCell>
												<TableCell className='font-medium'>{model.name}</TableCell>
												<TableCell>
													<div className='flex flex-wrap gap-1'>
														{model.branch_category_detail && (
															<Badge variant='secondary'>
																{model.branch_category_detail?.name}
															</Badge>
														)}
													</div>
												</TableCell>

												<TableCell className='text-right'>
													<div className='flex items-center justify-end gap-2'>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => handleOpenDialog(model)}
														>
															<Edit className='h-4 w-4' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => openDeleteDialog(model.id)}
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

							{/* Pagination */}
							{totalPages > 1 && (
								<div className='mt-4'>
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
													className={cn(
														currentPage === 1 && 'pointer-events-none opacity-50',
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

			{/* Create/Edit Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className='sm:max-w-[525px]'>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<DialogHeader>
								<DialogTitle>{editingId ? 'Tahrirlash' : "Yangi model qo'shish"}</DialogTitle>
								<DialogDescription>Mahsulot modeli ma'lumotlarini kiriting</DialogDescription>
							</DialogHeader>
							<div className='grid gap-4 py-4'>
								<FormField
									control={form.control}
									name='name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nomi *</FormLabel>
											<FormControl>
												<Input placeholder='Masalan: iPhone 15 Pro' {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='branch_category'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Kategoriya turi *</FormLabel>
											<Select
												value={field.value?.toString() ?? '0'}
												onValueChange={(v) => field.onChange(Number(v))}
											>
												<SelectTrigger className='w-full sm:w-[220px]'>
													<SelectValue placeholder='Kategoriya turini tanlang' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='0'>Kategoriya turini tanlang</SelectItem>
													{branchCategories.map((cat) => (
														<SelectItem key={cat.id} value={String(cat.id)}>
															{cat.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
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

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
						<AlertDialogDescription>
							Bu amalni qaytarib bo'lmaydi. Mahsulot modeli butunlay o'chiriladi.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Bekor qilish</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} disabled={isMutating}>
							{isMutating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							O'chirish
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
