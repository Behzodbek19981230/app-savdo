/**
 * Products Page
 * Mahsulotlar sahifasi
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import {
	Search,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Plus,
	Eye,
	Edit,
	Image as ImageIcon,
	Trash2,
	Loader2,
	Package,
	X,
	FilterX,
	ZoomIn,
	ZoomOut,
	RotateCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProducts, useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/api/useProducts';
import { ProductImagesDialog } from '@/components/products/ProductImagesDialog';
import { AddProductsDialog } from '@/components/products/AddProductsDialog';
import { useCreateProductCategory } from '@/hooks/api/useProductCategories';
import { useCreateProductModel } from '@/hooks/api/useProductModels';
import { useCreateModelType } from '@/hooks/api/useModelTypes';
import { useCreateProductTypeSize } from '@/hooks/api/useProductTypeSize';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { type Product, ProductType, ProductTypeLabels } from '@/services/product.service';
import { productSchema, type ProductFormData } from '@/lib/validations/product';
import { ModelSizeTypeLabels } from '@/services';
import { productCategoryService } from '@/services/productCategory.service';
import { productBranchCategoryService } from '@/services/productBranchCategory.service';
import { productModelService } from '@/services/productModel.service';
import { modelTypeService } from '@/services/modelType.service';
import { productTypeSizeService } from '@/services/productTypeSize.service';
import { unitService } from '@/services/unit.service';

const ITEMS_PER_PAGE = 10;
const AUTOCOMPLETE_PAGE_SIZE = 20;

type SortField = 'category' | 'model' | 'price' | 'count' | 'sorting' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function Products() {
	const navigate = useNavigate();
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortField, setSortField] = useState<SortField>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isImagesDialogOpen, setIsImagesDialogOpen] = useState(false);
	const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [imagesProduct, setImagesProduct] = useState<Product | null>(null);
	// Autocomplete backend qidiruv va infinite scroll uchun
	const [categorySearch, setCategorySearch] = useState('');
	const [branchCategorySearch, setBranchCategorySearch] = useState('');
	const [modelSearch, setModelSearch] = useState('');
	const [modelTypeSearch, setModelTypeSearch] = useState('');
	const [sizeSearch, setSizeSearch] = useState('');
	const [unitSearch, setUnitSearch] = useState('');
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	// Filters
	const [filterCategory, setFilterCategory] = useState<string>('');
	const [filterModel, setFilterModel] = useState<string>('');
	const [filterModelType, setFilterModelType] = useState<string>('');
	const [filterType, setFilterType] = useState<string>('');

	// Form
	const form = useForm<ProductFormData>({
		resolver: zodResolver(productSchema),
		defaultValues: {
			category: 0,
			branch_category: 0,
			model: 0,
			model_type: 0,
			size: 0,
			unit: 0,
			type: ProductType.DONA,
			count: 0,
			reserve_limit: 100,
			real_price: 0,
			price: 0,
			wholesale_price: 0,
			min_price: 0,
			note: '',
			discription: '',
			sorting: null,
		},
	});

	// Build ordering string for API
	const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;

	// Queries
	const { data, isLoading } = useProducts({
		page: currentPage,
		limit: ITEMS_PER_PAGE,
		search: searchQuery || undefined,
		ordering,
		is_delete: false,
		category: filterCategory && filterCategory !== 'all' ? parseInt(filterCategory) : undefined,
		model: filterModel && filterModel !== 'all' ? parseInt(filterModel) : undefined,
		model_type: filterModelType && filterModelType !== 'all' ? parseInt(filterModelType) : undefined,
		type: filterType && filterType !== 'all' ? filterType : undefined,
	});

	const selectedCategory = form.watch('category');
	const selectedModel = form.watch('model');
	const selectedModelType = form.watch('model_type');

	const categoriesInfinite = useInfiniteQuery({
		queryKey: ['productCategories', 'list', { is_delete: false, search: categorySearch }],
		queryFn: ({ pageParam }) =>
			productCategoryService.getCategories({
				page: pageParam,
				perPage: AUTOCOMPLETE_PAGE_SIZE,
				search: categorySearch || undefined,
				is_delete: false,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
	});

	const branchCategoriesInfinite = useInfiniteQuery({
		queryKey: [
			'productBranchCategories',
			'list',
			{ product_branch: selectedCategory, is_delete: false, search: branchCategorySearch },
		],
		queryFn: ({ pageParam }) =>
			productBranchCategoryService.getCategories({
				page: pageParam,
				perPage: AUTOCOMPLETE_PAGE_SIZE,
				search: branchCategorySearch || undefined,
				is_delete: false,
				product_branch: selectedCategory,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
		enabled: !!selectedCategory,
	});

	const modelsInfinite = useInfiniteQuery({
		queryKey: ['productModels', 'list', { branch: selectedCategory, is_delete: false, search: modelSearch }],
		queryFn: ({ pageParam }) =>
			productModelService.getModels({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				search: modelSearch || undefined,
				is_delete: false,
				branch: selectedCategory,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
		enabled: !!selectedCategory,
	});

	const modelTypesInfinite = useInfiniteQuery({
		queryKey: ['modelTypes', 'list', { madel: selectedModel, is_delete: false, search: modelTypeSearch }],
		queryFn: ({ pageParam }) =>
			modelTypeService.getModelTypes({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				search: modelTypeSearch || undefined,
				is_delete: false,
				madel: selectedModel,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
		enabled: !!selectedModel,
	});

	const productTypeSizesInfinite = useInfiniteQuery({
		queryKey: [
			'productTypeSizes',
			'list',
			{ product_type: selectedModelType, is_delete: false, search: sizeSearch },
		],
		queryFn: ({ pageParam }) =>
			productTypeSizeService.getProductTypeSizes({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				search: sizeSearch || undefined,
				is_delete: false,
				product_type: selectedModelType,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
		enabled: !!selectedModelType,
	});

	const unitsInfinite = useInfiniteQuery({
		queryKey: ['units', 'list', { is_active: true, search: unitSearch }],
		queryFn: ({ pageParam }) =>
			unitService.getUnits({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				search: unitSearch || undefined,
				is_active: true,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
	});

	// Tahrirlashda product by id orqali ma'lumot olish
	const { data: productById, isLoading: isProductByIdLoading } = useProduct(editingId ?? 0);

	// Mutations
	const createProduct = useCreateProduct();
	const updateProduct = useUpdateProduct();
	const deleteProduct = useDeleteProduct();

	const queryClient = useQueryClient();
	const { toast } = useToast();
	const createProductCategory = useCreateProductCategory();
	const createModel = useCreateProductModel();
	const createModelType = useCreateModelType();
	const createProductTypeSize = useCreateProductTypeSize();

	const products = data?.results || [];
	const pagination = data?.pagination;
	const totalPages = pagination?.lastPage || 1;

	const categories = categoriesInfinite.data?.pages.flatMap((p) => p.results) ?? [];
	const branchCategories = branchCategoriesInfinite.data?.pages.flatMap((p) => p.results) ?? [];
	const models = modelsInfinite.data?.pages.flatMap((p) => p.results) ?? [];
	const modelTypes = modelTypesInfinite.data?.pages.flatMap((p) => p.results) ?? [];
	const productTypeSizes = useMemo(
		() => productTypeSizesInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[productTypeSizesInfinite.data?.pages],
	);
	const units = unitsInfinite.data?.pages.flatMap((p) => p.results) ?? [];

	const selectedSize = form.watch('size');
	const selectedUnit = form.watch('unit');

	const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
	const branchCategoryOptions = branchCategories.map((c) => ({ value: c.id, label: c.name }));
	const modelOptions = models.map((m) => ({ value: m.id, label: m.name }));
	const modelTypeOptions = modelTypes.map((t) => ({ value: t.id, label: t.name }));
	const sizeOptions = productTypeSizes.map((s) => ({ value: s.id, label: String(s.size) }));
	const unitOptions = units.map((u) => ({ value: u.id, label: u.code }));

	const isMutating = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending;

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

	const handleCreateCategory = async (name: string) => {
		try {
			const result = await createProductCategory.mutateAsync({
				name,
				sorting: 0,
				is_delete: false,
			});
			return result ? { id: result.id, name: result.name } : null;
		} catch {
			return null;
		}
	};

	const handleCreateModel = async (name: string) => {
		if (!selectedCategory) return null;
		try {
			const result = await createModel.mutateAsync({
				name,
				branch: selectedCategory,
				sorting: 0,
				is_delete: false,
			});
			await queryClient.invalidateQueries({ queryKey: ['productModels', 'list'] });
			return result ? { id: result.id, name: result.name } : null;
		} catch {
			return null;
		}
	};

	const handleCreateModelType = async (name: string) => {
		if (!selectedModel) return null;
		try {
			const result = await createModelType.mutateAsync({
				name,
				madel: selectedModel,
				sorting: 0,
				is_delete: false,
			});
			await queryClient.invalidateQueries({ queryKey: ['modelTypes', 'list'] });
			return result ? { id: result.id, name: result.name } : null;
		} catch {
			return null;
		}
	};

	const handleOpenDialog = (item?: Product) => {
		if (item) {
			setEditingId(item.id);
			// Formani product by id yuklanganida to'ldiramiz (useEffect da)
		} else {
			setEditingId(null);
			form.reset({
				category: 0,
				branch_category: 0,
				model: 0,
				model_type: 0,
				size: 0,
				unit: 0,
				type: ProductType.DONA,
				count: 0,
				reserve_limit: 100,
				real_price: 0,
				price: 0,
				wholesale_price: 0,
				min_price: 0,
				note: '',
				discription: '',
				sorting: null,
			});
		}
		setIsDialogOpen(true);
	};

	// Tahrirlashda: product by id yuklangach formani to'ldirish
	useEffect(() => {
		if (!isDialogOpen || !editingId || !productById) return;
		const p = productById;
		const parseNum = (v: number | string) => (typeof v === 'string' ? parseFloat(v) : v) || 0;
		const unitId = p.size_detail?.unit_detail?.id ?? p.size_detail?.unit ?? 0;
		form.reset({
			category: p.branch || 0,
			branch_category: p.branch_category || 0,
			model: p.model || 0,
			model_type: p.type || 0,
			size: p.size || 0,
			unit: unitId,
			type: ProductType.DONA,
			count: p.count || 0,
			reserve_limit: p.reserve_limit || 100,
			real_price: parseNum(p.real_price),
			price: parseNum(p.unit_price),
			wholesale_price: parseNum(p.wholesale_price),
			min_price: parseNum(p.min_price),
			note: p.note || '',
			discription: p.note || '',
			sorting: null,
		});
	}, [isDialogOpen, editingId, productById, form]);

	// Bo'lim o'zgarganda kategoriyani tozalash faqat yangi qo'shishda (tahrirda product-by-id dan keladi)
	useEffect(() => {
		if (isDialogOpen && !editingId) {
			form.setValue('branch_category', 0);
		}
	}, [selectedCategory, isDialogOpen, editingId, form]);

	// Faqat yangi qo'shishda mahsulot nomi o'zgarganda o'lchamni tozalash (tahrirda product by id dan keladi)
	useEffect(() => {
		if (isDialogOpen && !editingId) {
			form.setValue('size', 0);
		}
	}, [selectedModelType, isDialogOpen, editingId, form]);

	// ProductTypeSize tanlanganda mos unit ni default qilish (xuddi purchase-invoices/add)
	useEffect(() => {
		if (selectedSize && productTypeSizes.length) {
			const selectedProductTypeSize = productTypeSizes.find((s) => s.id === selectedSize);
			if (selectedProductTypeSize?.unit) {
				form.setValue('unit', selectedProductTypeSize.unit);
			}
		}
	}, [selectedSize, productTypeSizes, form]);

	const handleCreateSize = async (sizeValue: string) => {
		if (!selectedModelType) return null;
		if (!selectedUnit) {
			toast({
				title: 'Xatolik',
				description: "Yangi o'lcham qo'shish uchun avval o'lchov birligini tanlang",
				variant: 'destructive',
			});
			return null;
		}
		try {
			const result = await createProductTypeSize.mutateAsync({
				product_type: selectedModelType,
				size: parseFloat(sizeValue) || 0,
				unit: selectedUnit,
				sorting: 0,
				is_delete: false,
			});
			await queryClient.invalidateQueries({ queryKey: ['productTypeSizes', 'list'] });
			return result ? { id: result.id, name: String(result.size) } : null;
		} catch {
			return null;
		}
	};

	const handleOpenImagesDialog = (item: Product) => {
		setImagesProduct(item);
		setIsImagesDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingId(null);
		form.reset();
	};

	const onSubmit = async (data: ProductFormData) => {
		try {
			const submitData: Partial<Product> & Record<string, unknown> = {
				branch: data.category,
				model: data.model,
				type: data.model_type,
				size: data.size,
				count: data.count,
				reserve_limit: data.reserve_limit,
				real_price: data.real_price,
				unit_price: data.price,
				wholesale_price: data.wholesale_price,
				min_price: data.min_price,
				note: data.note || data.discription,
				sorting: data.sorting ?? undefined,
			};
			if (data.branch_category && data.branch_category > 0) {
				submitData.branch_category = data.branch_category;
			}

			if (editingId) {
				await updateProduct.mutateAsync({ id: editingId, data: submitData as Partial<Product> });
			} else {
				await createProduct.mutateAsync(submitData as Partial<Product>);
			}
			handleCloseDialog();
		} catch (error) {
			console.error('Error saving product:', error);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;

		try {
			await deleteProduct.mutateAsync(deletingId);
			setIsDeleteDialogOpen(false);
			setDeletingId(null);
		} catch (error) {
			console.error('Error deleting product:', error);
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
		if (createProduct.isSuccess || updateProduct.isSuccess) {
			setIsDialogOpen(false);
			setEditingId(null);
			form.reset();
		}
	}, [createProduct.isSuccess, updateProduct.isSuccess, form]);

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

	const formatPrice = (price: number | string) => {
		const num = typeof price === 'string' ? parseFloat(price) : price;
		return (
			'$' +
			new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0)
		);
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				{/* <Button onClick={() => navigate('/products/add')}>
					<Plus className='mr-2 h-4 w-4' />
					Mahsulotlar qo'shish
				</Button> */}
			</div>

			{/* Main Card */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<Package className='h-6 w-6 text-primary' />
							<div>
								<CardTitle>Barcha mahsulotlar</CardTitle>
								<CardDescription>Jami {pagination?.total || 0} ta mahsulot</CardDescription>
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

					{/* Filters */}
					<div className='mb-4 grid grid-cols-1 md:grid-cols-4 gap-3'>
						<Select
							value={filterCategory}
							onValueChange={(value) => {
								setFilterCategory(value);
								setCurrentPage(1);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder='Kategoriya' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>Barcha kategoriyalar</SelectItem>
								{categories.map((category) => (
									<SelectItem key={category.id} value={category.id.toString()}>
										{category.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={filterModel}
							onValueChange={(value) => {
								setFilterModel(value);
								setCurrentPage(1);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder='Model' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>Barcha modellar</SelectItem>
								{models.map((model) => (
									<SelectItem key={model.id} value={model.id.toString()}>
										{model.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={filterModelType}
							onValueChange={(value) => {
								setFilterModelType(value);
								setCurrentPage(1);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder='Model turi' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>Barcha model turlari</SelectItem>
								{modelTypes.map((modelType) => (
									<SelectItem key={modelType.id} value={modelType.id.toString()}>
										{modelType.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Active Filters Display */}
					{(filterCategory || filterModel || filterModelType || filterType) && (
						<div className='mb-4 flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border'>
							<span className='text-sm font-medium text-muted-foreground'>Faol filterlar:</span>
							{filterCategory && filterCategory !== 'all' && (
								<Badge variant='secondary' className='gap-1.5 pl-2 pr-1'>
									<span className='text-xs'>Kategoriya:</span>
									<span className='font-medium'>
										{categories.find((c) => c.id.toString() === filterCategory)?.name}
									</span>
									<button
										onClick={() => {
											setFilterCategory('');
											setCurrentPage(1);
										}}
										className='ml-0.5 hover:bg-destructive/20 rounded-sm p-0.5 transition-colors'
									>
										<X className='h-3 w-3' />
									</button>
								</Badge>
							)}
							{filterModel && filterModel !== 'all' && (
								<Badge variant='secondary' className='gap-1.5 pl-2 pr-1'>
									<span className='text-xs'>Model:</span>
									<span className='font-medium'>
										{models.find((m) => m.id.toString() === filterModel)?.name}
									</span>
									<button
										onClick={() => {
											setFilterModel('');
											setCurrentPage(1);
										}}
										className='ml-0.5 hover:bg-destructive/20 rounded-sm p-0.5 transition-colors'
									>
										<X className='h-3 w-3' />
									</button>
								</Badge>
							)}
							{filterModelType && filterModelType !== 'all' && (
								<Badge variant='secondary' className='gap-1.5 pl-2 pr-1'>
									<span className='text-xs'>Model turi:</span>
									<span className='font-medium'>
										{modelTypes.find((mt) => mt.id.toString() === filterModelType)?.name}
									</span>
									<button
										onClick={() => {
											setFilterModelType('');
											setCurrentPage(1);
										}}
										className='ml-0.5 hover:bg-destructive/20 rounded-sm p-0.5 transition-colors'
									>
										<X className='h-3 w-3' />
									</button>
								</Badge>
							)}
							{filterType && filterType !== 'all' && (
								<Badge variant='secondary' className='gap-1.5 pl-2 pr-1'>
									<span className='text-xs'>Tur:</span>
									<span className='font-medium'>{ProductTypeLabels[filterType as ProductType]}</span>
									<button
										onClick={() => {
											setFilterType('');
											setCurrentPage(1);
										}}
										className='ml-0.5 hover:bg-destructive/20 rounded-sm p-0.5 transition-colors'
									>
										<X className='h-3 w-3' />
									</button>
								</Badge>
							)}
							<Button
								variant='ghost'
								size='sm'
								onClick={() => {
									setFilterCategory('');
									setFilterModel('');
									setFilterModelType('');
									setFilterType('');
									setCurrentPage(1);
								}}
								className='h-7 px-2 ml-auto'
							>
								<FilterX className='h-3.5 w-3.5 mr-1' />
								Hammasini tozalash
							</Button>
						</div>
					)}

					{/* Table */}
					{isLoading ? (
						<div className='flex items-center justify-center py-8'>
							<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
						</div>
					) : products.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-8 text-center'>
							<Package className='h-12 w-12 text-muted-foreground/50 mb-3' />
							<p className='text-muted-foreground'>Ma'lumot topilmadi</p>
						</div>
					) : (
						<>
							<div className='rounded-md border overflow-x-auto'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='w-[80px]'>Rasm</TableHead>
											<TableHead>Bo'lim</TableHead>
											<TableHead>Kategoriya turi</TableHead>
											<TableHead>Brend</TableHead>
											<TableHead>Mahsulot</TableHead>
											<TableHead>O'lcham</TableHead>
											<TableHead>Filial</TableHead>
											<TableHead className='text-right'>
												<button
													className='flex items-center hover:text-foreground transition-colors ml-auto'
													onClick={() => handleSort('count')}
												>
													Miqdori
													{getSortIcon('count')}
												</button>
											</TableHead>
											<TableHead className='text-right'>Narxi ($)</TableHead>
											<TableHead className='text-right'>Dona narxi ($)</TableHead>
											<TableHead className='text-right'>Optom narxi ($)</TableHead>
											<TableHead className='text-right'>Min narx ($)</TableHead>
											<TableHead>Amallar</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{products.map((product, index) => (
											<TableRow key={product.id}>
												<TableCell>
													<Avatar
														className='h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity'
														onClick={() => {
															if (product.images && product.images.length > 0) {
																setSelectedProduct(product);
																setCurrentImageIndex(0);
																setIsImageGalleryOpen(true);
															}
														}}
													>
														<AvatarImage
															src={product.images?.[0]?.file}
															alt={product.model_detail?.name || 'Product'}
														/>
														<AvatarFallback>
															<Package className='h-5 w-5 text-muted-foreground' />
														</AvatarFallback>
													</Avatar>
												</TableCell>
												<TableCell>{product.branch_detail?.name || '-'}</TableCell>
												<TableCell>{product.branch_category_detail?.name ?? '-'}</TableCell>
												<TableCell className='font-medium'>
													{product.model_detail?.name || '-'}
												</TableCell>
												<TableCell>{product.type_detail?.name || '-'}</TableCell>
												<TableCell>
													{product.size_detail?.size ?? '-'}{' '}
													{product.size_detail?.unit_detail?.name ?? ''}
												</TableCell>
												<TableCell>{product.filial_detail?.name || '-'}</TableCell>
												<TableCell className='text-right'>
													<Badge variant='default'>{product.count}</Badge>
												</TableCell>
												<TableCell className='text-right font-medium text-green-600'>
													{formatPrice(product.real_price)}
												</TableCell>
												<TableCell className='text-right text-green-600'>
													{formatPrice(product.unit_price)}
												</TableCell>
												<TableCell className='text-right text-green-600'>
													{formatPrice(product.wholesale_price)}
												</TableCell>
												<TableCell className='text-right text-green-600'>
													{formatPrice(product.min_price)}
												</TableCell>
												<TableCell>
													<div className='flex items-center justify-end '>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => handleOpenImagesDialog(product)}
															title='Rasmlar'
														>
															<ImageIcon className='h-4 w-4' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => navigate(`/products/${product.id}`)}
															title="Ko'rish"
														>
															<Eye className='h-4 w-4' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => handleOpenDialog(product)}
														>
															<Edit className='h-4 w-4' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => openDeleteDialog(product.id)}
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

			{/* Create/Edit Dialog - xuddi purchase-invoices/add dagi mahsulot modali */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className='w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle className='text-xl'>
							{editingId ? 'Tahrirlash' : "Yangi mahsulot qo'shish"}
						</DialogTitle>
						<DialogDescription>Mahsulot ma'lumotlarini kiriting</DialogDescription>
					</DialogHeader>

					{editingId && isProductByIdLoading ? (
						<div className='flex items-center justify-center py-12'>
							<Loader2 className='h-10 w-10 animate-spin text-muted-foreground' />
						</div>
					) : (
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3'>
								{/* Bo'lim va Kategoriya turi */}
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									<FormField
										control={form.control}
										name='category'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Bo'lim <span className='text-destructive'>*</span>
												</FormLabel>
												<FormControl>
													<Autocomplete
														options={categoryOptions}
														value={field.value || undefined}
														onValueChange={(val) => field.onChange(Number(val))}
														placeholder="Bo'limni tanlang"
														searchPlaceholder="Bo'lim qidirish..."
														emptyText="Bo'lim topilmadi"
														allowCreate
														onCreateNew={handleCreateCategory}
														createText="Yangi bo'lim qo'shish"
														onSearchChange={setCategorySearch}
														onScrollToBottom={() => categoriesInfinite.fetchNextPage()}
														hasMore={!!categoriesInfinite.hasNextPage}
														isLoadingMore={categoriesInfinite.isFetchingNextPage}
														isLoading={categoriesInfinite.isLoading}
													/>
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
												<FormLabel>
													Kategoriya turi <span className='text-destructive'>*</span>
												</FormLabel>
												<FormControl>
													<Autocomplete
														options={branchCategoryOptions}
														value={field.value || undefined}
														onValueChange={(val) => field.onChange(Number(val))}
														placeholder={
															selectedCategory
																? 'Kategoriya turini tanlang'
																: "Avval bo'limni tanlang"
														}
														searchPlaceholder='Kategoriya qidirish...'
														emptyText='Kategoriya topilmadi'
														disabled={!selectedCategory}
														onSearchChange={setBranchCategorySearch}
														onScrollToBottom={() => branchCategoriesInfinite.fetchNextPage()}
														hasMore={!!branchCategoriesInfinite.hasNextPage}
														isLoadingMore={branchCategoriesInfinite.isFetchingNextPage}
														isLoading={branchCategoriesInfinite.isLoading}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Brend va Mahsulot nomi */}
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									<FormField
										control={form.control}
										name='model'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Brend <span className='text-destructive'>*</span>
												</FormLabel>
												<FormControl>
													<Autocomplete
														options={modelOptions}
														value={field.value || undefined}
														onValueChange={(val) => field.onChange(Number(val))}
														placeholder={
															selectedCategory
																? 'Brendni tanlang'
																: "Avval bo'limni tanlang"
														}
														searchPlaceholder='Brend qidirish...'
														emptyText='Brend topilmadi'
														disabled={!selectedCategory}
														isLoading={modelsInfinite.isLoading}
														allowCreate={!!selectedCategory}
														onCreateNew={handleCreateModel}
														createText="Yangi brend qo'shish"
														onSearchChange={setModelSearch}
														onScrollToBottom={() => modelsInfinite.fetchNextPage()}
														hasMore={!!modelsInfinite.hasNextPage}
														isLoadingMore={modelsInfinite.isFetchingNextPage}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name='model_type'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Mahsulot nomi <span className='text-destructive'>*</span>
												</FormLabel>
												<FormControl>
													<Autocomplete
														options={modelTypeOptions}
														value={field.value || undefined}
														onValueChange={(val) => field.onChange(Number(val))}
														placeholder={
															selectedModel
																? 'Mahsulot nomini tanlang'
																: 'Avval brendni tanlang'
														}
														searchPlaceholder='Mahsulot qidirish...'
														emptyText='Mahsulot topilmadi'
														disabled={!selectedModel}
														isLoading={modelTypesInfinite.isLoading}
														allowCreate={!!selectedModel}
														onCreateNew={handleCreateModelType}
														createText="Yangi mahsulot qo'shish"
														onSearchChange={setModelTypeSearch}
														onScrollToBottom={() => modelTypesInfinite.fetchNextPage()}
														hasMore={!!modelTypesInfinite.hasNextPage}
														isLoadingMore={modelTypesInfinite.isFetchingNextPage}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* O'lcham va O'lchov birligi - xuddi purchase-invoices/add */}
								<FormField
									control={form.control}
									name='size'
									render={({ field }) => {
										const selectedProductTypeSize = productTypeSizes.find(
											(s) => s.id === selectedSize,
										);
										const hasUnitInSize = !!selectedProductTypeSize?.unit;
										return (
											<FormItem>
												<FormLabel>O'lcham</FormLabel>
												<div className='flex'>
													<Autocomplete
														options={unitOptions}
														value={selectedUnit || undefined}
														onValueChange={(val) => form.setValue('unit', Number(val))}
														placeholder='birlik'
														searchPlaceholder="Birlik qidirish..."
														emptyText="Birlik topilmadi"
														disabled={hasUnitInSize}
														className='w-[100px] rounded-r-none border-r-0'
														onSearchChange={setUnitSearch}
														onScrollToBottom={() => unitsInfinite.fetchNextPage()}
														hasMore={!!unitsInfinite.hasNextPage}
														isLoadingMore={unitsInfinite.isFetchingNextPage}
														isLoading={unitsInfinite.isLoading}
													/>
													<FormControl>
														<div className='flex-1'>
															<Autocomplete
																options={sizeOptions}
																value={field.value || undefined}
																onValueChange={(val) => field.onChange(Number(val))}
																placeholder={
																	!selectedModelType
																		? 'Avval mahsulot nomini tanlang'
																		: "O'lchamni tanlang"
																}
																searchPlaceholder="O'lcham qidirish..."
																emptyText="O'lcham topilmadi"
																disabled={!selectedModelType}
																isLoading={productTypeSizesInfinite.isLoading}
																allowCreate={!!selectedModelType}
																onCreateNew={handleCreateSize}
																createText="Yangi o'lcham qo'shish"
																className='rounded-l-none border-l-0'
																onSearchChange={setSizeSearch}
																onScrollToBottom={() => productTypeSizesInfinite.fetchNextPage()}
																hasMore={!!productTypeSizesInfinite.hasNextPage}
																isLoadingMore={productTypeSizesInfinite.isFetchingNextPage}
															/>
														</div>
													</FormControl>
												</div>
												<FormMessage />
											</FormItem>
										);
									}}
								/>

								{/* Zaxira limiti va Miqdori - xuddi purchase-invoices/add */}
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 items-end'>
									<FormField
										control={form.control}
										name='count'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Miqdori <span className='text-destructive'>*</span>
												</FormLabel>
												<div className='flex'>
													<FormControl>
														<Input
															type='number'
															placeholder='0'
															{...field}
															className='rounded-r-none'
															onChange={(e) => {
																const v = e.target.value;
																field.onChange(v === '' ? 0 : parseInt(v, 10));
															}}
														/>
													</FormControl>
													<span className='inline-flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground'>
														{units.find((u) => u.id === form.watch('unit'))?.code ||
															'birlik'}
													</span>
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name='reserve_limit'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Zaxira limiti <span className='text-destructive'>*</span>
													<span className='text-muted-foreground font-normal'>
														{' '}
														(Xabar berish uchun)
													</span>
												</FormLabel>
												<div className='flex'>
													<FormControl>
														<Input
															type='number'
															{...field}
															className='rounded-r-none'
															onChange={(e) => {
																const v = e.target.value;
																field.onChange(v === '' ? 0 : parseInt(v, 10));
															}}
														/>
													</FormControl>
													<span className='inline-flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground'>
														{units.find((u) => u.id === form.watch('unit'))?.code ||
															'birlik'}
													</span>
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Narxlar - Dollar, xuddi purchase-invoices/add */}
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									<FormField
										control={form.control}
										name='real_price'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Xaqiqiy narxi <span className='text-destructive'>*</span>
												</FormLabel>
												<div className='flex'>
													<FormControl>
														<Input
															type='number'
															step='0.01'
															placeholder='0.00'
															{...field}
															className='rounded-r-none'
															onChange={(e) => {
																const v = e.target.value;
																field.onChange(v === '' ? 0 : parseFloat(v));
															}}
														/>
													</FormControl>
													<span className='inline-flex items-center px-2 bg-green-100 border border-l-0 rounded-r-md text-sm text-green-700'>
														$
													</span>
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name='price'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Dona narxi <span className='text-destructive'>*</span>
												</FormLabel>
												<div className='flex'>
													<FormControl>
														<Input
															type='number'
															step='0.01'
															placeholder='0.00'
															{...field}
															className='rounded-r-none'
															onChange={(e) => {
																const v = e.target.value;
																field.onChange(v === '' ? 0 : parseFloat(v));
															}}
														/>
													</FormControl>
													<span className='inline-flex items-center px-2 bg-green-100 border border-l-0 rounded-r-md text-sm text-green-700'>
														$
													</span>
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									<FormField
										control={form.control}
										name='wholesale_price'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Optom narxi <span className='text-destructive'>*</span>
												</FormLabel>
												<div className='flex'>
													<FormControl>
														<Input
															type='number'
															step='0.01'
															placeholder='0.00'
															{...field}
															className='rounded-r-none'
															onChange={(e) => {
																const v = e.target.value;
																field.onChange(v === '' ? 0 : parseFloat(v));
															}}
														/>
													</FormControl>
													<span className='inline-flex items-center px-2 bg-green-100 border border-l-0 rounded-r-md text-sm text-green-700'>
														$
													</span>
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name='min_price'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Minimal narxi <span className='text-destructive'>*</span>
												</FormLabel>
												<div className='flex'>
													<FormControl>
														<Input
															type='number'
															step='0.01'
															placeholder='0.00'
															{...field}
															className='rounded-r-none'
															onChange={(e) => {
																const v = e.target.value;
																field.onChange(v === '' ? 0 : parseFloat(v));
															}}
														/>
													</FormControl>
													<span className='inline-flex items-center px-2 bg-green-100 border border-l-0 rounded-r-md text-sm text-green-700'>
														$
													</span>
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{/* Izoh - xuddi purchase-invoices/add */}
								<FormField
									control={form.control}
									name='note'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Izoh</FormLabel>
											<FormControl>
												<Textarea placeholder='Izoh yozing...' {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
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
					)}
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
						<AlertDialogDescription>
							Bu amalni qaytarib bo'lmaydi. Mahsulot butunlay o'chiriladi.
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

			{/* Product Images Dialog */}
			<ProductImagesDialog
				open={isImagesDialogOpen}
				onOpenChange={(open) => {
					setIsImagesDialogOpen(open);
					if (!open) setImagesProduct(null);
				}}
				product={imagesProduct}
			/>

			{/* Add Products Dialog */}
			<AddProductsDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

			{/* Image Gallery Dialog */}
			<Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
				<DialogContent className='max-w-7xl max-h-[90vh]'>
					<DialogHeader>
						<DialogTitle>Mahsulot rasmlari</DialogTitle>
						<DialogDescription>
							{selectedProduct?.model_detail?.name || 'Mahsulot'} - {selectedProduct?.branch_detail?.name}
						</DialogDescription>
					</DialogHeader>
					{selectedProduct?.images && selectedProduct.images.length > 0 ? (
						<div className='space-y-4'>
							{/* Main Image with Zoom */}
							<TransformWrapper
								initialScale={1}
								minScale={0.5}
								maxScale={4}
								centerOnInit
								wheel={{ step: 0.1 }}
								doubleClick={{ mode: 'toggle', step: 0.7 }}
								pinch={{ step: 5 }}
							>
								{({ zoomIn, zoomOut, resetTransform }) => (
									<div className='relative'>
										{/* Zoom Controls */}
										<div className='absolute top-2 right-2 z-10 flex gap-1 bg-background/80 rounded-lg p-1'>
											<Button
												variant='outline'
												size='icon'
												onClick={() => zoomIn()}
												title='Yaqinlashtirish'
												className='h-8 w-8'
											>
												<ZoomIn className='h-4 w-4' />
											</Button>
											<Button
												variant='outline'
												size='icon'
												onClick={() => zoomOut()}
												title='Uzoqlashtirish'
												className='h-8 w-8'
											>
												<ZoomOut className='h-4 w-4' />
											</Button>
											<Button
												variant='outline'
												size='icon'
												onClick={() => resetTransform()}
												title='Qayta tiklash'
												className='h-8 w-8'
											>
												<RotateCw className='h-4 w-4' />
											</Button>
										</div>

										{/* Navigation Buttons */}
										{selectedProduct.images.length > 1 && (
											<>
												<Button
													variant='outline'
													size='icon'
													className='absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background'
													onClick={() => {
														resetTransform();
														setCurrentImageIndex((prev) =>
															prev === 0 ? selectedProduct.images!.length - 1 : prev - 1,
														);
													}}
												>
													<ArrowDown className='h-4 w-4 rotate-90' />
												</Button>
												<Button
													variant='outline'
													size='icon'
													className='absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background'
													onClick={() => {
														resetTransform();
														setCurrentImageIndex((prev) =>
															prev === selectedProduct.images!.length - 1 ? 0 : prev + 1,
														);
													}}
												>
													<ArrowDown className='h-4 w-4 -rotate-90' />
												</Button>
											</>
										)}

										{/* Image Counter */}
										{selectedProduct.images.length > 1 && (
											<div className='absolute bottom-2 right-2 z-10 bg-background/80 px-2 py-1 rounded text-sm'>
												{currentImageIndex + 1} / {selectedProduct.images.length}
											</div>
										)}

										{/* Zoomable Image */}
										<TransformComponent
											wrapperClass='!w-full !h-[60vh] bg-muted rounded-lg overflow-hidden'
											contentClass='!w-full !h-full flex items-center justify-center'
										>
											<img
												src={selectedProduct.images[currentImageIndex]?.file}
												alt={`Product ${currentImageIndex + 1}`}
												className='max-w-full max-h-full object-contain'
												style={{ userSelect: 'none' }}
											/>
										</TransformComponent>
									</div>
								)}
							</TransformWrapper>

							{/* Thumbnail Grid */}
							{selectedProduct.images.length > 1 && (
								<div className='grid grid-cols-8 gap-2 max-h-32 overflow-y-auto'>
									{selectedProduct.images.map((attachment, index) => (
										<button
											key={attachment.id}
											onClick={() => setCurrentImageIndex(index)}
											className={cn(
												'relative aspect-square rounded-md overflow-hidden border-2 transition-all hover:opacity-80',
												currentImageIndex === index
													? 'border-primary ring-2 ring-primary'
													: 'border-transparent',
											)}
										>
											<img
												src={attachment.file}
												alt={`Thumbnail ${index + 1}`}
												className='w-full h-full object-cover'
											/>
										</button>
									))}
								</div>
							)}

							{/* Instructions */}
							<div className='text-xs text-muted-foreground text-center space-y-1'>
								<p>💡 Rasmni yaqinlashtirish: Scroll yoki zoom tugmalari</p>
								<p>💡 Rasmni siljitish: Bosib ushlang va torting</p>
								<p>💡 Ikki marta bosing: Avtomatik zoom</p>
							</div>
						</div>
					) : (
						<div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
							<Package className='h-16 w-16 mb-4' />
							<p>Rasm mavjud emas</p>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
