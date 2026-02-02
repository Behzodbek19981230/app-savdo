import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Loader2, Edit } from 'lucide-react';
import { useProductCategories } from '@/hooks/api/useProductCategories';
import { useProductModels } from '@/hooks/api/useProductModels';
import { useModelTypes } from '@/hooks/api/useModelTypes';
import { useModelSizes } from '@/hooks/api/useModelSizes';
import { useCreateProduct } from '@/hooks/api/useProducts';
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
import { ModelSizeTypeLabels } from '@/services';

// Product item schema
const productItemSchema = z.object({
	model: z.number({ required_error: 'Model majburiy' }).int().positive(),
	model_type: z.number({ required_error: 'Model turi majburiy' }).int().positive(),
	model_size: z.number({ required_error: "Model o'lchami majburiy" }).int().positive(),
	count: z.number({ required_error: 'Soni majburiy' }).int().min(0),
	real_price: z.number({ required_error: 'Haqiqiy narx majburiy' }).min(0),
	price: z.number({ required_error: 'Sotuv narxi majburiy' }).min(0),
	sorting: z.number().int().nullable().optional(),
});

type ProductItemFormData = z.infer<typeof productItemSchema>;

interface ProductItem extends ProductItemFormData {
	id: string;
}

export default function ProductAdd() {
	const navigate = useNavigate();
	const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
	const [products, setProducts] = useState<ProductItem[]>([]);
	const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
	const [isAddingNew, setIsAddingNew] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Queries (moved below after form so we can pass watched values)

	// We do not fetch existing products on this page — only show newly added ones
	const isLoadingProducts = false;
	const createProduct = useCreateProduct();

	const form = useForm<ProductItemFormData>({
		resolver: zodResolver(productItemSchema),
		defaultValues: { model: 0, model_type: 0, model_size: 0, count: 0, real_price: 0, price: 0, sorting: null },
	});

	const watchedModel = form.watch('model');
	const watchedModelType = form.watch('model_type');

	// Queries (backend-filtered)
	const { data: categoriesData } = useProductCategories({ perPage: 1000, is_delete: false });
	const { data: modelsData } = useProductModels({
		perPage: 1000,
		is_delete: false,
		category: selectedCategory || undefined,
	});
	const { data: modelTypesData } = useModelTypes({
		perPage: 1000,
		is_delete: false,
		model: watchedModel || undefined,
	});
	const { data: modelSizesData } = useModelSizes({
		perPage: 1000,
		is_delete: false,
		model_type: watchedModelType || undefined,
	});

	const categories = categoriesData?.results || [];
	const models = modelsData?.results || [];
	const modelTypes = modelTypesData?.results || [];
	const modelSizes = modelSizesData?.results || [];
	const existingProducts: any[] = [];

	useEffect(() => {
		if (categoriesData?.results && categoriesData.results.length > 0 && !selectedCategory) {
			setSelectedCategory(categoriesData.results[0].id);
		}
	}, [categoriesData?.results, selectedCategory]);

	const handleCategoryChange = (categoryId: string) => {
		const id = parseInt(categoryId);
		setSelectedCategory(id);
		setProducts([]);
		setIsAddingNew(false);
		setEditingProduct(null);
		// reset dependent selects
		form.setValue('model', 0);
		form.setValue('model_type', 0);
		form.setValue('model_size', 0);
	};

	const handleAddNew = () => {
		setIsAddingNew(true);
		setEditingProduct(null);
		form.reset({ model: 0, model_type: 0, model_size: 0, count: 0, real_price: 0, price: 0, sorting: null });
	};

	const handleEditItem = (item: ProductItem) => {
		setIsAddingNew(false);
		setEditingProduct(item);
		form.reset({
			model: item.model,
			model_type: item.model_type,
			model_size: item.model_size,
			count: item.count,
			real_price: item.real_price,
			price: item.price,
			sorting: item.sorting,
		});
	};

	const handleCancelEdit = () => {
		setIsAddingNew(false);
		setEditingProduct(null);
		form.reset();
	};

	const onSubmitItem = (data: ProductItemFormData) => {
		if (editingProduct) {
			setProducts(products.map((p) => (p.id === editingProduct.id ? { ...data, id: p.id } : p)));
		} else {
			const newItem: ProductItem = { ...data, id: `temp-${Date.now()}` };
			setProducts([...products, newItem]);
		}
		handleCancelEdit();
	};

	const handleDeleteItem = (id: string) => {
		setDeletingId(id);
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (deletingId) {
			setProducts(products.filter((p) => p.id !== deletingId));
			setDeletingId(null);
			setIsDeleteDialogOpen(false);
		}
	};

	const handleSaveAll = async () => {
		if (!selectedCategory || products.length === 0) return;
		setIsSaving(true);
		try {
			for (const product of products) {
				await createProduct.mutateAsync({
					category: selectedCategory,
					model: product.model,
					model_type: product.model_type,
					model_size: product.model_size,
					count: product.count,
					real_price: product.real_price,
					price: product.price,
					sorting: product.sorting,
				});
			}
			// navigate back to products list after saving
			navigate('/products');
		} catch (error) {
			console.error('Error saving products:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const getModelName = (modelId: number) => models.find((m) => m.id === modelId)?.name || '-';
	const getModelTypeName = (modelTypeId: number) => modelTypes.find((mt) => mt.id === modelTypeId)?.name || '-';
	const getModelSizeName = (modelSizeId: number) =>
		modelSizes.find((ms) => ms.id === modelSizeId)?.size.toString() || '-';
	const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + " so'm";

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Mahsulotlar qo'shish</h1>
					<p className='text-muted-foreground'>Bir nechta mahsulot qo'shish</p>
				</div>
				<div className='flex gap-2'>
					<Button variant='outline' onClick={() => navigate('/products')}>
						Orqaga
					</Button>
					<Button onClick={handleSaveAll} disabled={products.length === 0 || isSaving}>
						{isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}Hammasini saqlash (
						{products.length})
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Mahsulotlar</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						<div className='flex items-end gap-4'>
							<div className='flex-1'>
								<label className='text-sm font-medium mb-2 block'>Kategoriya *</label>
								<Select value={selectedCategory?.toString()} onValueChange={handleCategoryChange}>
									<SelectTrigger>
										<SelectValue placeholder='Kategoriyani tanlang' />
									</SelectTrigger>
									<SelectContent>
										{categories.map((category) => (
											<SelectItem key={category.id} value={category.id.toString()}>
												{category.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button
								onClick={handleAddNew}
								disabled={!selectedCategory || isAddingNew || editingProduct !== null}
							>
								<Plus className='h-4 w-4 mr-2' />
								Mahsulot qo'shish
							</Button>
						</div>

						<div className='border rounded-lg'>
							<Form {...form}>
								<form onSubmit={form.handleSubmit(onSubmitItem)}>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Model</TableHead>
												<TableHead>Model turi</TableHead>
												<TableHead>Model o'lchami</TableHead>
												<TableHead>Soni</TableHead>
												<TableHead>Haqiqiy narx (so'mda)</TableHead>
												<TableHead>Sotuv narxi (so'mda)</TableHead>
												<TableHead className='w-[140px]'>Amallar</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{isLoadingProducts ? (
												<TableRow>
													<TableCell colSpan={7} className='text-center py-8'>
														<Loader2 className='h-6 w-6 animate-spin mx-auto' />
													</TableCell>
												</TableRow>
											) : (
												<>
													{(isAddingNew || editingProduct) && (
														<TableRow className='bg-blue-50 dark:bg-blue-950'>
															<TableCell>
																<FormField
																	control={form.control}
																	name='model'
																	render={({ field }) => {
																		// filter models by selected category (API uses `categories`)
																		const filteredModels = selectedCategory
																			? models.filter((m) => {
																					const anyM = m as any;
																					if (Array.isArray(anyM.categories))
																						return anyM.categories.includes(
																							selectedCategory,
																						);
																					if (Array.isArray(anyM.category))
																						return anyM.category.includes(
																							selectedCategory,
																						);
																					if (
																						Array.isArray(
																							anyM.category_detail,
																						)
																					)
																						return anyM.category_detail.some(
																							(c: any) =>
																								c.id ===
																								selectedCategory,
																						);
																					return false;
																				})
																			: models;

																		return (
																			<FormItem>
																				<Select
																					onValueChange={(value) => {
																						const v = parseInt(value);
																						field.onChange(v);
																						// reset downstream selects when model changes
																						form.setValue('model_type', 0);
																						form.setValue('model_size', 0);
																					}}
																					value={field.value?.toString()}
																				>
																					<FormControl>
																						<SelectTrigger className='h-9'>
																							<SelectValue placeholder='Tanlang' />
																						</SelectTrigger>
																					</FormControl>
																					<SelectContent>
																						{filteredModels.map((model) => (
																							<SelectItem
																								key={model.id}
																								value={model.id.toString()}
																							>
																								{model.name}
																							</SelectItem>
																						))}
																					</SelectContent>
																				</Select>
																			</FormItem>
																		);
																	}}
																/>
															</TableCell>
															<TableCell>
																<FormField
																	control={form.control}
																	name='model_type'
																	render={({ field }) => {
																		// filter model types by selected model
																		const filteredModelTypes = watchedModel
																			? modelTypes.filter(
																					(mt) => mt.model === watchedModel,
																				)
																			: modelTypes;

																		return (
																			<FormItem>
																				<Select
																					onValueChange={(value) => {
																						const v = parseInt(value);
																						field.onChange(v);
																						// reset model_size when model_type changes
																						form.setValue('model_size', 0);
																					}}
																					value={field.value?.toString()}
																				>
																					<FormControl>
																						<SelectTrigger className='h-9'>
																							<SelectValue placeholder='Tanlang' />
																						</SelectTrigger>
																					</FormControl>
																					<SelectContent>
																						{filteredModelTypes.map(
																							(modelType) => (
																								<SelectItem
																									key={modelType.id}
																									value={modelType.id.toString()}
																								>
																									{modelType.name}
																								</SelectItem>
																							),
																						)}
																					</SelectContent>
																				</Select>
																			</FormItem>
																		);
																	}}
																/>
															</TableCell>
															<TableCell>
																<FormField
																	control={form.control}
																	name='model_size'
																	render={({ field }) => {
																		// filter model sizes by selected model_type
																		const filteredModelSizes = watchedModelType
																			? modelSizes.filter(
																					(ms) =>
																						ms.model_type ===
																						watchedModelType,
																				)
																			: modelSizes;

																		return (
																			<FormItem>
																				<Select
																					onValueChange={(value) =>
																						field.onChange(parseInt(value))
																					}
																					value={field.value?.toString()}
																				>
																					<FormControl>
																						<SelectTrigger className='h-9'>
																							<SelectValue placeholder='Tanlang' />
																						</SelectTrigger>
																					</FormControl>
																					<SelectContent>
																						{filteredModelSizes.map(
																							(modelSize) => (
																								<SelectItem
																									key={modelSize.id}
																									value={modelSize.id.toString()}
																								>
																									{modelSize.size} —{' '}
																									{
																										ModelSizeTypeLabels[
																											modelSize
																												.type
																										]
																									}
																								</SelectItem>
																							),
																						)}
																					</SelectContent>
																				</Select>
																			</FormItem>
																		);
																	}}
																/>
															</TableCell>
															<TableCell>
																<FormField
																	control={form.control}
																	name='count'
																	render={({ field }) => (
																		<FormItem>
																			<FormControl>
																				<Input
																					type='number'
																					placeholder='0'
																					className='h-9'
																					{...field}
																					onChange={(e) => {
																						const value = e.target.value;
																						field.onChange(
																							value === ''
																								? 0
																								: parseInt(value),
																						);
																					}}
																				/>
																			</FormControl>
																		</FormItem>
																	)}
																/>
															</TableCell>
															<TableCell>
																<FormField
																	control={form.control}
																	name='real_price'
																	render={({ field }) => (
																		<FormItem>
																			<FormControl>
																				<Input
																					type='number'
																					placeholder='0'
																					className='h-9'
																					{...field}
																					onChange={(e) => {
																						const value = e.target.value;
																						field.onChange(
																							value === ''
																								? 0
																								: parseFloat(value),
																						);
																					}}
																				/>
																			</FormControl>
																		</FormItem>
																	)}
																/>
															</TableCell>
															<TableCell>
																<FormField
																	control={form.control}
																	name='price'
																	render={({ field }) => (
																		<FormItem>
																			<FormControl>
																				<Input
																					type='number'
																					placeholder='0'
																					className='h-9'
																					{...field}
																					onChange={(e) => {
																						const value = e.target.value;
																						field.onChange(
																							value === ''
																								? 0
																								: parseFloat(value),
																						);
																					}}
																				/>
																			</FormControl>
																		</FormItem>
																	)}
																/>
															</TableCell>
															<TableCell>
																<div className='flex gap-1'>
																	<Button type='submit' size='sm' className='h-9'>
																		Saqlash
																	</Button>
																	<Button
																		type='button'
																		variant='ghost'
																		size='sm'
																		className='h-9'
																		onClick={handleCancelEdit}
																	>
																		Bekor
																	</Button>
																</div>
															</TableCell>
														</TableRow>
													)}

													{!isAddingNew &&
														!editingProduct &&
														existingProducts.length === 0 &&
														products.length === 0 && (
															<TableRow>
																<TableCell
																	colSpan={7}
																	className='text-center py-8 text-muted-foreground'
																>
																	{selectedCategory
																		? 'Mahsulotlar yo\'q. "Mahsulot qo\'shish" tugmasini bosing.'
																		: "Kategoriyani tanlang va mahsulot qo'shing."}
																</TableCell>
															</TableRow>
														)}

													{existingProducts.map((product) => (
														<TableRow
															key={`existing-${product.id}`}
															className='bg-muted/30'
														>
															<TableCell className='font-medium'>
																{product.model_detail?.name || '-'}
															</TableCell>
															<TableCell>
																{product.model_type_detail?.name || '-'}
															</TableCell>
															<TableCell>
																{product.model_size_detail?.size || '-'}
															</TableCell>
															<TableCell>{product.count}</TableCell>
															<TableCell>{formatPrice(product.real_price)}</TableCell>
															<TableCell className='text-green-600 font-medium'>
																{formatPrice(product.price)}
															</TableCell>
															<TableCell>
																<span className='text-xs text-muted-foreground'>
																	Mavjud
																</span>
															</TableCell>
														</TableRow>
													))}

													{products.map((product) => (
														<TableRow key={product.id}>
															<TableCell className='font-medium'>
																{getModelName(product.model)}
															</TableCell>
															<TableCell>
																{getModelTypeName(product.model_type)}
															</TableCell>
															<TableCell>
																{getModelSizeName(product.model_size)}
															</TableCell>
															<TableCell>{product.count}</TableCell>
															<TableCell>{formatPrice(product.real_price)}</TableCell>
															<TableCell className='text-green-600 font-medium'>
																{formatPrice(product.price)}
															</TableCell>
															<TableCell>
																<div className='flex gap-2'>
																	<Button
																		variant='ghost'
																		size='icon'
																		onClick={() => handleEditItem(product)}
																	>
																		<Edit className='h-4 w-4' />
																	</Button>
																	<Button
																		variant='ghost'
																		size='icon'
																		onClick={() => handleDeleteItem(product.id)}
																	>
																		<Trash2 className='h-4 w-4 text-destructive' />
																	</Button>
																</div>
															</TableCell>
														</TableRow>
													))}
												</>
											)}
										</TableBody>
									</Table>
								</form>
							</Form>
						</div>
					</div>
				</CardContent>
			</Card>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
						<AlertDialogDescription>Bu mahsulot ro'yxatdan o'chiriladi.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Bekor qilish</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete}>O'chirish</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
