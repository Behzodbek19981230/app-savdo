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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Plus, Edit, Trash2, Loader2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModelTypes, useCreateModelType, useUpdateModelType, useDeleteModelType } from '@/hooks/api/useModelTypes';
import { useProductModels } from '@/hooks/api/useProductModels';
import { type ModelType } from '@/services/modelType.service';
import { modelTypeSchema, type ModelTypeFormData } from '@/lib/validations/modelType';
import { useCreateModelSize, useDeleteModelSize, useModelSize, useModelSizes, useUpdateModelSize } from '@/hooks/api';
import { ModelSizeType, ModelSizeTypeLabels, type ModelSize } from '@/services/modelSize.service';

const ITEMS_PER_PAGE = 10;

type SortField = 'name' | 'model' | 'sorting' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function ModelTypes() {
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
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
	});

	const { data: modelsData } = useProductModels({
		perPage: 1000,
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
	const { data: modelSizesData, isLoading: isModelSizesLoading } = useModelSizes();
	const createModelSize = useCreateModelSize();
	const deleteModelSize = useDeleteModelSize();
	const updateModelSize = useUpdateModelSize();

	const [existingSizes, setExistingSizes] = useState<ModelSize[]>([]);
	const [newSizes, setNewSizes] = useState<Array<{ size: number; type: ModelSizeType; sorting?: number | null }>>([]);
	const [editingSizeId, setEditingSizeId] = useState<number | null>(null);
	const [editingSizeValue, setEditingSizeValue] = useState<number>(0);
	const [editingSizeType, setEditingSizeType] = useState<ModelSizeType>(ModelSizeType.DONA);
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

			// load sizes for this model type
			const sizes = modelSizesData?.results?.filter((s) => s.model_type === item.id) || [];
			setExistingSizes(sizes);
			setNewSizes([]);
		} else {
			setEditingId(null);
			form.reset({
				name: '',
				model: 0,
				sorting: null,
			});

			setExistingSizes([]);
			setNewSizes([]);
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

			let modelTypeId: number | null = null;

			if (editingId) {
				await updateModelType.mutateAsync({ id: editingId, data: submitData });
				modelTypeId = editingId;
			} else {
				const res: any = await createModelType.mutateAsync(submitData);
				// attempt to read created id from response
				modelTypeId = res?.data?.id || res?.id || null;
			}

			// create any new sizes that were added in the dialog
			if (modelTypeId && newSizes.length > 0) {
				await Promise.all(
					newSizes.map((ns) =>
						createModelSize.mutateAsync({
							model_type: modelTypeId,
							size: ns.size,
							type: ns.type,
							sorting: ns.sorting,
						}),
					),
				);
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

	const getModelName = (modelId: number) => {
		const model = models.find((m) => m.id === modelId);
		return model?.name || '-';
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Model turlari</h1>
					<p className='text-muted-foreground'>Mahsulot model turlarini boshqaring</p>
				</div>
				<Button onClick={() => handleOpenDialog()}>
					<Plus className='mr-2 h-4 w-4' />
					Yangi tur qo'shish
				</Button>
			</div>

			{/* Main Card */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<Tag className='h-6 w-6 text-primary' />
							<div>
								<CardTitle>Barcha turlar</CardTitle>
								<CardDescription>Jami {pagination?.total || 0} ta model turi</CardDescription>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{/* Search */}
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
											<TableHead>
												<button
													className='flex items-center hover:text-foreground transition-colors'
													onClick={() => handleSort('created_at')}
												>
													Yaratilgan sana
													{getSortIcon('created_at')}
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
													<Badge variant='outline'>{getModelName(modelType.model)}</Badge>
												</TableCell>
												<TableCell>
													{modelType.created_at
														? new Date(modelType.created_at).toLocaleDateString('uz-UZ')
														: '-'}
												</TableCell>
												<TableCell className='text-right'>
													<div className='flex items-center justify-end gap-2'>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => handleOpenDialog(modelType)}
														>
															<Edit className='h-4 w-4' />
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
								<DialogDescription>Model turi ma'lumotlarini kiriting</DialogDescription>
							</DialogHeader>
							<div className='grid gap-4 py-4'>
								<FormField
									control={form.control}
									name='model'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Model *</FormLabel>
											<Select
												onValueChange={(value) => field.onChange(parseInt(value))}
												value={field.value?.toString()}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder='Model tanlang' />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{models.map((model) => (
														<SelectItem key={model.id} value={model.id.toString()}>
															{model.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
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
							<div className='grid gap-2 py-2'>
								<div className='flex items-center justify-between'>
									<label className='font-semibold'>O'lchamlar</label>
									<Button
										type='button'
										variant='outline'
										onClick={() =>
											setNewSizes((prev) => [
												{ size: 0, type: ModelSizeType.DONA, sorting: null },
												...prev,
											])
										}
									>
										<Plus className='mr-2 h-4 w-4 text-primary' />
									</Button>
								</div>
								{/* new sizes inputs (added before submit) */}
								<div className='space-y-2'>
									{newSizes.map((ns, idx) => (
										<div key={idx} className='grid grid-cols-6 gap-2 items-end'>
											<div className='col-span-2'>
												<Input
													type='number'
													value={ns.size}
													onChange={(e) => {
														const v = e.target.value;
														setNewSizes((prev) => {
															const cp = [...prev];
															cp[idx] = {
																...cp[idx],
																size: v === '' ? 0 : parseInt(v, 10),
															};
															return cp;
														});
													}}
												/>
											</div>
											<div className='col-span-2'>
												<Select
													value={ns.type}
													onValueChange={(v) =>
														setNewSizes((prev) => {
															const cp = [...prev];
															cp[idx] = { ...cp[idx], type: v as ModelSizeType };
															return cp;
														})
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder='Tur' />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{Object.entries(ModelSizeTypeLabels).map(([key, label]) => (
															<SelectItem key={key} value={key}>
																{label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											<div className='col-span-1'>
												<Button
													variant='ghost'
													size='icon'
													onClick={() =>
														setNewSizes((prev) => prev.filter((_, i) => i !== idx))
													}
												>
													<Trash2 className='h-4 w-4 text-destructive' />
												</Button>
											</div>
										</div>
									))}
								</div>

								{/* existing sizes for this model type (when editing) */}
								{existingSizes.length > 0 && (
									<div className='space-y-2'>
										{existingSizes.map((s) => (
											<div key={s.id} className='flex items-center gap-2'>
												{editingSizeId === s.id ? (
													<div className='w-full grid grid-cols-6 gap-2 items-end'>
														<div className='col-span-2'>
															<Input
																type='number'
																value={editingSizeValue}
																onChange={(e) =>
																	setEditingSizeValue(
																		e.target.value === ''
																			? 0
																			: parseInt(e.target.value, 10),
																	)
																}
															/>
														</div>
														<div className='col-span-2'>
															<Select
																value={editingSizeType}
																onValueChange={(v) =>
																	setEditingSizeType(v as ModelSizeType)
																}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder='Tur' />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{Object.entries(ModelSizeTypeLabels).map(
																		([key, label]) => (
																			<SelectItem key={key} value={key}>
																				{label}
																			</SelectItem>
																		),
																	)}
																</SelectContent>
															</Select>
														</div>

														<div className='col-span-2 flex items-center gap-2'>
															<Button
																type='button'
																onClick={async () => {
																	try {
																		await updateModelSize.mutateAsync({
																			id: s.id,
																			data: {
																				size: editingSizeValue,
																				type: editingSizeType,
																				sorting: s.sorting,
																			},
																		});
																		setExistingSizes((prev) =>
																			prev.map((x) =>
																				x.id === s.id
																					? {
																							...x,
																							size: editingSizeValue,
																							type: editingSizeType,
																						}
																					: x,
																			),
																		);
																		setEditingSizeId(null);
																	} catch (error) {
																		console.error(
																			'Error updating model size:',
																			error,
																		);
																	}
																}}
															>
																Saqlash
															</Button>
															<Button
																type='button'
																variant='ghost'
																onClick={() => setEditingSizeId(null)}
															>
																Bekor
															</Button>
														</div>
													</div>
												) : (
													<>
														<Badge variant='secondary'>
															{s.size} — {ModelSizeTypeLabels[s.type]}
														</Badge>

														<div className='ml-auto flex items-center gap-2'>
															<Button
																variant='ghost'
																size='icon'
																type='button'
																onClick={() => {
																	setEditingSizeId(s.id);
																	setEditingSizeValue(s.size);
																	setEditingSizeType(s.type as ModelSizeType);
																}}
															>
																<Edit className='h-4 w-4' />
															</Button>

															<Button
																variant='ghost'
																size='icon'
																type='button'
																onClick={async () => {
																	try {
																		await deleteModelSize.mutateAsync(s.id);
																		setExistingSizes((prev) =>
																			prev.filter((x) => x.id !== s.id),
																		);
																	} catch (error) {
																		console.error(
																			'Error deleting model size:',
																			error,
																		);
																	}
																}}
															>
																<Trash2 className='h-4 w-4 text-destructive' />
															</Button>
														</div>
													</>
												)}
											</div>
										))}
									</div>
								)}
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
