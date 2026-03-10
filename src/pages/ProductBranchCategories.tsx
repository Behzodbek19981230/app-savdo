/**
 * Product Branch Categories Page
 * Mahsulot turlari kategoriyasi - product-branch-category API
 */

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import { Autocomplete } from '@/components/ui/autocomplete';
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Filter,
	Layers,
	Loader2,
	Pencil,
	Plus,
	Search,
	Trash2,
	X,
	SearchIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
	useProductBranchCategories,
	useCreateProductBranchCategory,
	useUpdateProductBranchCategory,
	useDeleteProductBranchCategory,
} from '@/hooks/api/useProductBranchCategories';
import { useProductCategories } from '@/hooks/api/useProductCategories';
import {
	productBranchCategorySchema,
	type ProductBranchCategoryFormData,
} from '@/lib/validations/productBranchCategory';
import type { ProductBranchCategory } from '@/services/productBranchCategory.service';
import { productBranchCategoryService } from '@/services/productBranchCategory.service';
import { productCategoryService } from '@/services/productCategory.service';

const ITEMS_PER_PAGE = 10;
const AUTOCOMPLETE_PAGE_SIZE = 20;

type SortField = 'name' | 'sorting' | 'product_branch' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function ProductBranchCategories() {
	const queryClient = useQueryClient();
	const [currentPage, setCurrentPage] = useState(1);
	// Applied filters (used for querying)
	const [searchQuery, setSearchQuery] = useState('');
	const [filterBranchId, setFilterBranchId] = useState<number | undefined>(undefined);
	// Form-level filters (user edits these but they won't apply until user clicks "Filter")
	const [formSearch, setFormSearch] = useState<string>('');
	const [formBranchId, setFormBranchId] = useState<number | undefined>(undefined);
	const [sortField, setSortField] = useState<SortField>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [suggestedSorting, setSuggestedSorting] = useState<number | null>(null);
	const [isLoadingSuggestedSorting, setIsLoadingSuggestedSorting] = useState(false);
	// Autocomplete search states
	const [branchSearch, setBranchSearch] = useState('');
	const [formBranchSearch, setFormBranchSearch] = useState('');

	const form = useForm<ProductBranchCategoryFormData>({
		resolver: zodResolver(productBranchCategorySchema),
		defaultValues: {
			product_branch: 0,
			name: '',
			sorting: null,
		},
	});

	const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;

	const { data, isLoading } = useProductBranchCategories({
		page: currentPage,
		limit: ITEMS_PER_PAGE,
		search: searchQuery || undefined,
		ordering,
		is_delete: false,
		product_branch: filterBranchId,
	});

	// Infinite query for branches (filter and form)
	const branchesInfinite = useInfiniteQuery({
		queryKey: ['productCategories', 'list', { is_delete: false, search: branchSearch }],
		queryFn: ({ pageParam }) =>
			productCategoryService.getCategories({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				search: branchSearch || undefined,
				is_delete: false,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
	});

	// Form infinite query for branches
	const formBranchesInfinite = useInfiniteQuery({
		queryKey: ['productCategories', 'form', { is_delete: false, search: formBranchSearch }],
		queryFn: ({ pageParam }) =>
			productCategoryService.getCategories({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				search: formBranchSearch || undefined,
				is_delete: false,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
	});

	const createCategory = useCreateProductBranchCategory();
	const updateCategory = useUpdateProductBranchCategory();
	const deleteCategory = useDeleteProductBranchCategory();

	const categories = data?.results || [];
	const pagination = data?.pagination;
	const totalPages = pagination?.lastPage || 1;
	const branches = useMemo(
		() => branchesInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[branchesInfinite.data?.pages],
	);
	const formBranches = useMemo(
		() => formBranchesInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[formBranchesInfinite.data?.pages],
	);

	const branchMap = useMemo(
		() => Object.fromEntries(branches.map((b) => [b.id, b.name])),
		[branches],
	);

	const isMutating = createCategory.isPending || updateCategory.isPending || deleteCategory.isPending;

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

	const handleOpenDialog = async (item?: ProductBranchCategory) => {
		if (item) {
			setEditingId(item.id);
			setSuggestedSorting(null);
			form.reset({
				product_branch: item.product_branch,
				name: item.name || '',
				sorting: item.sorting,
			});
		} else {
			setEditingId(null);
			setSuggestedSorting(null);
			const defaultBranchId = branches[0]?.id ?? 0;
			form.reset({
				product_branch: defaultBranchId,
				name: '',
				sorting: null,
			});
			// Yangi qo'shishda va product_branch tanlangan bo'lsa, suggested sorting olish
			if (defaultBranchId) {
				setIsLoadingSuggestedSorting(true);
				try {
					const response = await productBranchCategoryService.getSuggestedSorting(defaultBranchId);
					setSuggestedSorting(response.suggested_sorting);
				} catch (error) {
					console.error('Error fetching suggested sorting:', error);
				} finally {
					setIsLoadingSuggestedSorting(false);
				}
			}
		}
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingId(null);
		setSuggestedSorting(null);
		form.reset();
		// Modal yopilganda list'ni yangilash
		queryClient.invalidateQueries({ queryKey: ['productBranchCategories'] });
	};

	const onSubmit = async (data: ProductBranchCategoryFormData) => {
		try {
			const submitData = {
				product_branch: data.product_branch,
				name: data.name,
				sorting: data.sorting === '' || data.sorting == null ? null : Number(data.sorting),
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

	useEffect(() => {
		if (createCategory.isSuccess || updateCategory.isSuccess) {
			setIsDialogOpen(false);
			setEditingId(null);
			setSuggestedSorting(null);
			form.reset();
		}
	}, [createCategory.isSuccess, updateCategory.isSuccess, form]);

	// product_branch o'zgarganda suggested sorting olish (faqat yangi qo'shishda)
	const selectedProductBranch = form.watch('product_branch');
	useEffect(() => {
		if (!editingId && isDialogOpen && selectedProductBranch) {
			setIsLoadingSuggestedSorting(true);
			productBranchCategoryService
				.getSuggestedSorting(selectedProductBranch)
				.then((response) => {
					setSuggestedSorting(response.suggested_sorting);
				})
				.catch((error) => {
					console.error('Error fetching suggested sorting:', error);
					setSuggestedSorting(null);
				})
				.finally(() => {
					setIsLoadingSuggestedSorting(false);
				});
		}
	}, [selectedProductBranch, editingId, isDialogOpen]);

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			await deleteCategory.mutateAsync(deletingId);
			setIsDeleteDialogOpen(false);
			setDeletingId(null);
			// O'chirilganda list'ni yangilash
			queryClient.invalidateQueries({ queryKey: ['productBranchCategories'] });
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

	const handleFilter = () => {
		setSearchQuery(formSearch);
		setFilterBranchId(formBranchId);
		setCurrentPage(1);
	};

	const handleClear = () => {
		setFormSearch('');
		setFormBranchId(undefined);
		setSearchQuery('');
		setFilterBranchId(undefined);
		setCurrentPage(1);
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
			<Card>
				<CardHeader className='pb-4 flex flex-row items-center justify-between'>
					<div>
						<div className='flex items-center gap-2'>
							<Layers className='h-5 w-5 text-primary' />
							<CardTitle className='text-lg'>Mahsulot turlari kategoriyasi</CardTitle>
						</div>
						<CardDescription>Jami {pagination?.total || 0} ta kategoriya</CardDescription>
					</div>
					<Button onClick={() => handleOpenDialog()} disabled={branches.length === 0}>
						<Plus className='mr-2 h-4 w-4' />
						Qo'shish
					</Button>
				</CardHeader>
				<CardContent>
					<div className='mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 flex-wrap'>
						<div className='w-full sm:w-auto'>
							<Input
								placeholder='Qidirish...'
								value={formSearch}
								onChange={(e) => setFormSearch(e.target.value)}
								className='w-full sm:min-w-[220px]'
							/>
						</div>
						<div className='w-full sm:w-auto'>
							<Autocomplete
								options={[
									{ value: 'all', label: 'Barcha turlar' },
									...branches.map((b) => ({ value: b.id, label: b.name })),
								]}
								value={formBranchId ?? 'all'}
								onValueChange={(v) => setFormBranchId(v === 'all' ? undefined : Number(v))}
								placeholder="Bo'lim bo'yicha filtrlash"
								className='w-full sm:w-[220px]'
								onSearchChange={setBranchSearch}
								onScrollToBottom={() => branchesInfinite.fetchNextPage()}
								hasMore={!!branchesInfinite.hasNextPage}
								isLoadingMore={branchesInfinite.isFetchingNextPage}
								isLoading={branchesInfinite.isLoading}
							/>
						</div>
						<div className='w-full sm:w-auto flex gap-2 items-center'>
							<Button onClick={handleFilter} className='bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs px-3'>
								<SearchIcon className='h-3.5 w-3.5 mr-1' />
								Qidirish
							</Button>
							<Button
								onClick={handleClear}
								variant='outline'
								className='border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-8 text-xs px-3'
							>
								<X className='h-3.5 w-3.5 mr-1' />
								Tozalash
							</Button>
						</div>
					</div>

					{isLoading ? (
						<div className='flex items-center justify-center py-8'>
							<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
						</div>
					) : categories.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-8 text-center'>
							<Layers className='h-12 w-12 text-muted-foreground/50 mb-3' />
							<p className='text-muted-foreground'>Ma&apos;lumot topilmadi</p>
							{branches.length === 0 && (
								<p className='text-xs text-muted-foreground mt-1'>
									Avval &quot;Mahsulot turlari&quot; (bo&apos;limlar) sahifasida bo&apos;lim
									qo&apos;shing
								</p>
							)}
						</div>
					) : (
						<>
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='w-[80px]'>#</TableHead>
											<TableHead>
												<button
													className='flex items-center hover:text-foreground transition-colors'
													onClick={() => handleSort('product_branch')}
												>
													Bo&apos;lim
													{getSortIcon('product_branch')}
												</button>
											</TableHead>
											<TableHead>
												<button
													className='flex items-center hover:text-foreground transition-colors'
													onClick={() => handleSort('name')}
												>
													Nomi
													{getSortIcon('name')}
												</button>
											</TableHead>

											<TableHead className='text-right w-[120px]'>Amallar</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{categories.map((category, index) => (
											<TableRow key={category.id}>
												<TableCell>{index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</TableCell>
												<TableCell>
													{branchMap[category.product_branch] ?? category.product_branch}
												</TableCell>
												<TableCell className='font-medium'>{category.name}</TableCell>
												<TableCell className='text-right'>
													<div className='flex items-center justify-end '>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => handleOpenDialog(category)}
														>
															<Pencil className='h-4 w-4' />
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
								<DialogTitle>{editingId ? 'Tahrirlash' : "Yangi kategoriya qo'shish"}</DialogTitle>
							</DialogHeader>
							<div className='grid gap-4 py-4'>
								<FormField
									control={form.control}
									name='product_branch'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Bo&apos;lim (product branch) *</FormLabel>
											<FormControl>
												<Autocomplete
													options={formBranches.map((b) => ({ value: b.id, label: b.name }))}
													value={field.value || undefined}
													onValueChange={(v) => field.onChange(Number(v))}
													placeholder="Bo'limni tanlang"
													searchPlaceholder="Bo'lim qidirish..."
													onSearchChange={setFormBranchSearch}
													onScrollToBottom={() => formBranchesInfinite.fetchNextPage()}
													hasMore={!!formBranchesInfinite.hasNextPage}
													isLoadingMore={formBranchesInfinite.isFetchingNextPage}
													isLoading={formBranchesInfinite.isLoading}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nomi *</FormLabel>
											<FormControl>
												<Input placeholder='Masalan: Elektronika' {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='sorting'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tartib raqami</FormLabel>
											<FormControl>
												<Input
													type='number'
													placeholder='Masalan: 1'
													{...field}
													value={field.value ?? ''}
													onChange={(e) => {
														const value = e.target.value;
														field.onChange(value === '' ? null : parseInt(value, 10));
													}}
												/>
											</FormControl>
											{!editingId && suggestedSorting !== null && (
												<p className='text-xs text-red-500 font-medium'>
													Tavsiya etilgan tartib raqami: {suggestedSorting}
												</p>
											)}
											{!editingId && suggestedSorting === null && isLoadingSuggestedSorting && (
												<p className='text-xs text-muted-foreground'>
													Tavsiya etilgan tartib raqami yuklanmoqda...
												</p>
											)}
											{editingId && (
												<p className='text-xs text-muted-foreground'>
													Tartib raqami bo&apos;yicha saralanadi
												</p>
											)}
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
						queryClient.invalidateQueries({ queryKey: ['productBranchCategories'] });
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
						<AlertDialogDescription>
							Bu amalni qaytarib bo&apos;lmaydi. Kategoriya o&apos;chiriladi.
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
