/**
 * Model Types Page
 * Mahsulot model turlari sahifasi
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Autocomplete } from '@/components/ui/autocomplete';
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
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Pencil, Plus, Search, Tag, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModelTypes, useCreateModelType, useUpdateModelType, useDeleteModelType } from '@/hooks/api/useModelTypes';
import { useProductModels } from '@/hooks/api/useProductModels';
import { type ModelType } from '@/services/modelType.service';
import { modelTypeSchema, type ModelTypeFormData } from '@/lib/validations/modelType';

const ITEMS_PER_PAGE = 10;

type SortField = 'name' | 'model' | 'sorting' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function ModelTypes() {
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [draftSearch, setDraftSearch] = useState('');
	const [filterModelId, setFilterModelId] = useState<number | undefined>(undefined);
	const [draftFilterModelId, setDraftFilterModelId] = useState<number | undefined>(undefined);
	const [sortField, setSortField] = useState<SortField>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	// Form
	const form = useForm<ModelTypeFormData>({
		resolver: zodResolver(modelTypeSchema),
		defaultValues: {
			name: '',
			model: 0,
			sorting: null,
		},
	});

	// Build ordering string for API
	const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;

	// Queries
	const { data, isLoading } = useModelTypes({
		page: currentPage,
		limit: ITEMS_PER_PAGE,
		search: searchQuery || undefined,
		ordering,
		is_delete: false,
		madel: filterModelId,
	});

	const { data: modelsData } = useProductModels({
		limit: 1000,
		is_delete: false,
	});

	// Mutations
	const createModelType = useCreateModelType();
	const updateModelType = useUpdateModelType();
	const deleteModelType = useDeleteModelType();

	const modelTypes = data?.results || [];
	const pagination = data?.pagination;
	const totalPages = pagination?.lastPage || 1;
	const models = modelsData?.results || [];

	const isMutating = createModelType.isPending || updateModelType.isPending || deleteModelType.isPending;
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

	const handleOpenDialog = (item?: ModelType) => {
		if (item) {
			setEditingId(item.id);
			form.reset({
				name: item.name || '',
				model: item.model || 0,
				sorting: item.sorting,
			});
		} else {
			setEditingId(null);
			form.reset({
				name: '',
				model: 0,
				sorting: null,
			});
		}
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingId(null);
		form.reset();
	};

	const onSubmit = async (data: ModelTypeFormData) => {
		try {
			const submitData = {
				name: data.name,
				model: data.model,
			};

			if (editingId) {
				await updateModelType.mutateAsync({ id: editingId, data: submitData });
			} else {
				await createModelType.mutateAsync(submitData);
			}
			handleCloseDialog();
		} catch (error) {
			console.error('Error saving model type:', error);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;

		try {
			await deleteModelType.mutateAsync(deletingId);
			setIsDeleteDialogOpen(false);
			setDeletingId(null);
		} catch (error) {
			console.error('Error deleting model type:', error);
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
		if (createModelType.isSuccess || updateModelType.isSuccess) {
			setIsDialogOpen(false);
			setEditingId(null);
			form.reset();
		}
	}, [createModelType.isSuccess, updateModelType.isSuccess, form]);

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
							<Tag className='h-5 w-5 text-primary' />
							<CardTitle className='text-lg'>Model turlari</CardTitle>
						</div>
						<CardDescription>Jami {pagination?.total || 0} ta model turi</CardDescription>
					</div>
					<Button onClick={() => handleOpenDialog()}>
						<Plus className='mr-2 h-4 w-4' />
						Qo'shish
					</Button>
				</CardHeader>
				<CardContent>
					{/* Search */}
					<div className='mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 flex-wrap'>
						<div className='w-full sm:w-auto'>
							<Input
								placeholder='Qidirish...'
								value={draftSearch}
								onChange={(e) => setDraftSearch(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										setSearchQuery(draftSearch);
										setFilterModelId(draftFilterModelId);
										setCurrentPage(1);
									}
								}}
								className='w-full sm:min-w-[220px]'
							/>
						</div>
						<div className='w-full sm:w-auto'>
							<Autocomplete
								options={[
									{ value: 'all', label: 'Barcha modellar' },
									...models.map((m) => ({ value: String(m.id), label: m.name })),
								]}
								value={draftFilterModelId ? String(draftFilterModelId) : 'all'}
								onValueChange={(v) => setDraftFilterModelId(v === 'all' ? undefined : Number(v))}
								placeholder='Model bo\'yicha filtrlash'
								className='w-full sm:w-[220px]'
							/>
						</div>
						<div className='w-full sm:w-auto flex gap-2 items-center'>
							<Button
								className='bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs px-3'
								onClick={() => {
									setSearchQuery(draftSearch);
									setFilterModelId(draftFilterModelId);
									setCurrentPage(1);
								}}
							>
								<Search className='h-3.5 w-3.5 mr-1' />
								Qidirish
							</Button>
							<Button
								variant='outline'
								className='border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-8 text-xs px-3'
								onClick={() => {
									setDraftSearch('');
									setDraftFilterModelId(undefined);
									setSearchQuery('');
									setFilterModelId(undefined);
									setCurrentPage(1);
								}}
							>
								<X className='h-3.5 w-3.5 mr-1' />
								Tozalash
							</Button>
						</div>
					</div>

					{/* Table */}
					{isLoading ? (
						<div className='flex items-center justify-center py-8'>
							<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
						</div>
					) : modelTypes.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-8 text-center'>
							<Tag className='h-12 w-12 text-muted-foreground/50 mb-3' />
							<p className='text-muted-foreground'>Ma'lumot topilmadi</p>
						</div>
					) : (
						<>
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='w-[100px]'>
												<button className='flex items-center hover:text-foreground transition-colors'>
													Tartib
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
											<TableHead>
												<button
													className='flex items-center hover:text-foreground transition-colors'
													onClick={() => handleSort('model')}
												>
													Model
													{getSortIcon('model')}
												</button>
											</TableHead>

											<TableHead className='text-right'>Amallar</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{modelTypes.map((modelType, index) => (
											<TableRow key={modelType.id}>
												<TableCell>{index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</TableCell>
												<TableCell className='font-medium'>{modelType.name}</TableCell>
												<TableCell>
													<Badge variant='outline'>{modelType.madel_detail?.name}</Badge>
												</TableCell>

												<TableCell className='text-right'>
													<div className='flex items-center justify-end '>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => handleOpenDialog(modelType)}
														>
															<Pencil className='h-4 w-4' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => openDeleteDialog(modelType.id)}
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
								<DialogTitle>{editingId ? 'Tahrirlash' : "Yangi tur qo'shish"}</DialogTitle>
							</DialogHeader>
							<div className='grid gap-4 py-4'>
								<FormField
									control={form.control}
									name='model'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Model *</FormLabel>
											<FormControl>
												<Autocomplete
													options={models.map((model) => ({
														value: model.id,
														label: model.name,
													}))}
													value={field.value || undefined}
													onValueChange={(v) => field.onChange(parseInt(String(v)))}
													placeholder='Model tanlang'
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
												<Input placeholder='Masalan: Premium' {...field} />
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

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
						<AlertDialogDescription>
							Bu amalni qaytarib bo'lmaydi. Model turi butunlay o'chiriladi.
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
