/**
 * Model turlari va Model o'lchamlari — bitta sahifa, tablar orqali
 * Tab 1: Model turi ro'yxati + "Qo'shish" modalka
 * Tab 2: Model o'lchami (jadval)
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Autocomplete } from '@/components/ui/autocomplete';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	PaginationEllipsis,
} from '@/components/ui/pagination';
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
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Edit,
	Loader2,
	Pencil,
	Plus,
	Ruler,
	Search,
	Tag,
	Trash2,
	X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useToast } from '@/hooks/use-toast';
import { useModelTypes, useModelType, useUpdateModelType, useDeleteModelType } from '@/hooks/api/useModelTypes';
import type { ModelType } from '@/services/modelType.service';
import { useProductModels } from '@/hooks/api/useProductModels';
import { useUnits } from '@/hooks/api/useUnit';
import { useModelSizes } from '@/hooks/api/useModelSizes';
import { useProductCategories } from '@/hooks/api/useProductCategories';
import { useProductBranchCategories } from '@/hooks/api/useProductBranchCategories';
import { modelTypeService, type ProductTypeCreateItem, type ProductTypeSizeItem } from '@/services/modelType.service';
import { modelTypeKeys } from '@/hooks/api/useModelTypes';
import ModelSizes from '@/pages/ModelSizes';
import { productBranchCategoryService, productCategoryService, productModelService } from '@/services';
import { unitService } from '@/services/unit.service';

const ITEMS_PER_PAGE = 10;
const defaultSizeRow = (): ProductTypeSizeItem => ({ size: '', unit: '' });

type TabValue = 'model-type' | 'model-size';
type SortField = 'name' | 'model' | 'sorting' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

interface ModelTypeAndSizeProps {
	defaultTab?: TabValue;
}

export default function ModelTypeAndSize({ defaultTab = 'model-type' }: ModelTypeAndSizeProps) {
	const queryClient = useQueryClient();
	const { toast } = useToast();
	const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);

	// Tab 1: list state
	const [currentPage, setCurrentPage] = useState(1);
	// Applied filters (used for querying)
	const [searchQuery, setSearchQuery] = useState('');
	const [filterModelId, setFilterModelId] = useState<number | undefined>(undefined);
	// Form-level filters (user edits these but they won't apply until user clicks "Filter")
	const [formSearch, setFormSearch] = useState<string>('');
	const [formFilterModelId, setFormFilterModelId] = useState<number | undefined>(undefined);
	const [sortField, setSortField] = useState<SortField>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);

	// Add modal state
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [branch, setBranch] = useState<number>(0);
	const [branchCategory, setBranchCategory] = useState<number>(0);
	const [modelSearch, setModelSearch] = useState('');
	const [madel, setMadel] = useState<number>(0);
	const [name, setName] = useState('');
	const [sorting, setSorting] = useState(1);
	const [productTypeSizeRows, setProductTypeSizeRows] = useState<ProductTypeSizeItem[]>([defaultSizeRow()]);
	const [suggestedSorting, setSuggestedSorting] = useState<number | null>(null);
	const [isLoadingSuggestedSorting, setIsLoadingSuggestedSorting] = useState(false);
	// Autocomplete search states
	const [filterModelSearch, setFilterModelSearch] = useState('');
	const [branchSearch, setBranchSearch] = useState('');
	const [branchCategorySearch, setBranchCategorySearch] = useState('');
	const [editBranchSearch, setEditBranchSearch] = useState('');
	const [editBranchCategorySearch, setEditBranchCategorySearch] = useState('');
	const [unitSearch, setUnitSearch] = useState('');
	const [editUnitSearch, setEditUnitSearch] = useState('');

	// Edit modal state
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editBranch, setEditBranch] = useState<number>(0);
	const [editBranchCategory, setEditBranchCategory] = useState<number>(0);
	const [editModelSearch, setEditModelSearch] = useState('');
	const [editMadel, setEditMadel] = useState<number>(0);
	const [editName, setEditName] = useState('');
	const [editSorting, setEditSorting] = useState<number>(0);
	const [editModelSizes, setEditModelSizes] = useState<ProductTypeSizeItem[]>([]);
	const [editSuggestedSorting, setEditSuggestedSorting] = useState<number | null>(null);
	const [isLoadingEditSuggestedSorting, setIsLoadingEditSuggestedSorting] = useState(false);
	const AUTOCOMPLETE_PAGE_SIZE = 10;
	// Delete dialog state
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	// Tahrirlashda getById dan form to'ldirilganda "clear" effectlari ishlamasin
	const isLoadingEditFormRef = useRef(false);

	const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;
	const { data, isLoading } = useModelTypes({
		page: currentPage,
		limit: ITEMS_PER_PAGE,
		search: searchQuery || undefined,
		ordering,
		is_delete: false,
		madel: filterModelId,
	});
	// Branches (bo'limlar)
	const { data: branchesData } = useProductCategories({
		limit: 1000,
		is_delete: false,
	});

	// Branch tanlanganda, shu branch bo'yicha branch-category listini olish
	const { data: branchCategoriesData } = useProductBranchCategories(
		branch && branch !== 0
			? {
					limit: 1000,
					is_delete: false,
					product_branch: branch,
				}
			: undefined,
	);

	// Branch-category tanlanganda, shu branch-category bo'yicha product-model listini olish
	const { data: modelsData, isLoading: isModelsLoading } = useProductModels(
		branchCategory && branchCategory !== 0
			? {
					limit: 1000,
					is_delete: false,
					search: modelSearch || undefined,
					branch_category: branchCategory,
				}
			: undefined,
	);
	// Edit uchun barcha branch-category'larni olish (branch va branchCategory ni topish uchun) - infinite query
	const allBranchCategoriesForEditInfinite = useInfiniteQuery({
		queryKey: ['productBranchCategories', 'edit-all', { is_delete: false }],
		queryFn: ({ pageParam }) =>
			productBranchCategoryService.getCategories({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				is_delete: false,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
	});
	const allBranchCategoriesForEdit = useMemo(
		() => allBranchCategoriesForEditInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[allBranchCategoriesForEditInfinite.data?.pages],
	);

	// Edit uchun branch-category listini olish
	const { data: editBranchCategoriesData } = useProductBranchCategories(
		editBranch && editBranch !== 0
			? {
					limit: 1000,
					is_delete: false,
					product_branch: editBranch,
				}
			: undefined,
	);

	// Edit uchun barcha modellarni olish (branch va branchCategory ni topish uchun) - infinite query
	const allModelsForEditInfinite = useInfiniteQuery({
		queryKey: ['productModels', 'edit-all', { is_delete: false }],
		queryFn: ({ pageParam }) =>
			productModelService.getModels({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				is_delete: false,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
	});
	const allModelsForEdit = useMemo(
		() => allModelsForEditInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[allModelsForEditInfinite.data?.pages],
	);

	// Edit uchun branch-category tanlanganda, shu branch-category bo'yicha product-model listini olish
	const { data: modelsEditData, isLoading: isModelsEditLoading } = useProductModels(
		editBranchCategory && editBranchCategory !== 0
			? {
					limit: 1000,
					is_delete: false,
					search: editModelSearch || undefined,
					branch_category: editBranchCategory,
				}
			: undefined,
	);
	// Infinite queries for Autocomplete
	const filterModelsInfinite = useInfiniteQuery({
		queryKey: ['productModels', 'filter', { is_delete: false, search: filterModelSearch }],
		queryFn: ({ pageParam }) =>
			productModelService.getModels({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				search: filterModelSearch || undefined,
				is_delete: false,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
	});

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

	const branchCategoriesInfinite = useInfiniteQuery({
		queryKey: [
			'productBranchCategories',
			'list',
			{ product_branch: branch, is_delete: false, search: branchCategorySearch },
		],
		queryFn: ({ pageParam }) =>
			productBranchCategoryService.getCategories({
				page: pageParam,
				search: branchCategorySearch || undefined,
				is_delete: false,
				product_branch: branch,
				limit: AUTOCOMPLETE_PAGE_SIZE,
			} as Parameters<typeof productBranchCategoryService.getCategories>[0]),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
		enabled: !!branch && branch !== 0,
	});

	const modelsInfinite = useInfiniteQuery({
		queryKey: ['productModels', 'list', { branch_category: branchCategory, is_delete: false, search: modelSearch }],
		queryFn: ({ pageParam }) =>
			productModelService.getModels({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				search: modelSearch || undefined,
				is_delete: false,
				branch_category: branchCategory,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
		enabled: !!branchCategory && branchCategory !== 0,
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

	// Edit infinite queries
	const editBranchesInfinite = useInfiniteQuery({
		queryKey: ['productCategories', 'edit', { is_delete: false, search: editBranchSearch }],
		queryFn: ({ pageParam }) =>
			productCategoryService.getCategories({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				search: editBranchSearch || undefined,
				is_delete: false,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
	});

	const editBranchCategoriesInfinite = useInfiniteQuery({
		queryKey: [
			'productBranchCategories',
			'edit',
			{ product_branch: editBranch, is_delete: false, search: editBranchCategorySearch },
		],
		queryFn: ({ pageParam }) =>
			productBranchCategoryService.getCategories({
				page: pageParam,
				search: editBranchCategorySearch || undefined,
				is_delete: false,
				product_branch: editBranch,
				limit: AUTOCOMPLETE_PAGE_SIZE,
			} as Parameters<typeof productBranchCategoryService.getCategories>[0]),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
		enabled: !!editBranch && editBranch !== 0,
	});

	const editModelsInfinite = useInfiniteQuery({
		queryKey: [
			'productModels',
			'edit',
			{ branch_category: editBranchCategory, is_delete: false, search: editModelSearch },
		],
		queryFn: ({ pageParam }) =>
			productModelService.getModels({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				search: editModelSearch || undefined,
				is_delete: false,
				branch_category: editBranchCategory,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
		enabled: !!editBranchCategory && editBranchCategory !== 0,
	});

	const editUnitsInfinite = useInfiniteQuery({
		queryKey: ['units', 'edit', { is_active: true, search: editUnitSearch }],
		queryFn: ({ pageParam }) =>
			unitService.getUnits({
				page: pageParam,
				limit: AUTOCOMPLETE_PAGE_SIZE,
				search: editUnitSearch || undefined,
				is_active: true,
			}),
		getNextPageParam: (lastPage) =>
			lastPage.pagination.currentPage < lastPage.pagination.lastPage
				? lastPage.pagination.currentPage + 1
				: undefined,
		initialPageParam: 1,
	});

	const { data: unitsData } = useUnits({ limit: 1000, is_active: true });
	const { data: modelSizesData, isLoading: isModelSizesLoading } = useModelSizes(
		editingId ? { product_type: editingId, limit: 1000, is_delete: false } : undefined,
	);

	// Edit uchun model type ma'lumotlarini olish
	const { data: editingModelTypeData, isLoading: isEditingModelTypeLoading } = useModelType(editingId || 0);

	const modelTypes = data?.results ?? [];
	const pagination = data?.pagination;
	const totalPages = pagination?.lastPage || 1;
	const branches = useMemo(
		() => branchesInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[branchesInfinite.data?.pages],
	);
	const branchCategories = useMemo(
		() => branchCategoriesInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[branchCategoriesInfinite.data?.pages],
	);
	const models = useMemo(
		() => modelsInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[modelsInfinite.data?.pages],
	);
	const editBranches = useMemo(
		() => editBranchesInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[editBranchesInfinite.data?.pages],
	);
	const editBranchCategories = useMemo(
		() => editBranchCategoriesInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[editBranchCategoriesInfinite.data?.pages],
	);
	const modelsEdit = useMemo(
		() => editModelsInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[editModelsInfinite.data?.pages],
	);
	const filterModels = useMemo(
		() => filterModelsInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[filterModelsInfinite.data?.pages],
	);
	const units = useMemo(() => unitsInfinite.data?.pages.flatMap((p) => p.results) ?? [], [unitsInfinite.data?.pages]);
	const editUnits = useMemo(
		() => editUnitsInfinite.data?.pages.flatMap((p) => p.results) ?? [],
		[editUnitsInfinite.data?.pages],
	);
	const modelSizes = useMemo(() => modelSizesData?.results ?? [], [modelSizesData?.results]);

	const updateModelType = useUpdateModelType();
	const deleteModelType = useDeleteModelType();

	const createBulk = useMutation({
		mutationFn: (data: ProductTypeCreateItem[]) => modelTypeService.createProductTypesBulk(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: modelTypeKeys.lists() });
			queryClient.invalidateQueries({ queryKey: ['modelSizes'] });
			toast({ title: 'Muvaffaqiyatli', description: "Model turi va o'lchamlar saqlandi" });
			setIsAddModalOpen(false);
			resetAddForm();
		},
		onError: (err: unknown) => {
			const msg =
				err && typeof err === 'object' && 'message' in err
					? String((err as { message: unknown }).message)
					: 'Xatolik';
			toast({ title: 'Xatolik', description: msg, variant: 'destructive' });
		},
	});

	function resetAddForm() {
		setBranch(branches[0]?.id ?? 0);
		setBranchCategory(0);
		setModelSearch('');
		setMadel(0);
		setName('');
		setSorting(1);
		setProductTypeSizeRows([defaultSizeRow()]);
		setSuggestedSorting(null);
	}

	const addSizeRow = () => setProductTypeSizeRows((prev) => [...prev, defaultSizeRow()]);
	const removeSizeRow = (index: number) => setProductTypeSizeRows((prev) => prev.filter((_, i) => i !== index));
	const updateSizeRow = (index: number, field: 'size' | 'unit', value: string | number) =>
		setProductTypeSizeRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

	// Edit modal uchun size row funksiyalari
	const addEditSizeRow = () => setEditModelSizes((prev) => [...prev, defaultSizeRow()]);
	const removeEditSizeRow = (index: number) => {
		// Faqat state'dan o'chirish (PUT request'da barcha size'lar yuboriladi)
		setEditModelSizes((prev) => prev.filter((_, i) => i !== index));
	};
	const updateEditSizeRow = (index: number, field: 'size' | 'unit', value: string | number) =>
		setEditModelSizes((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

	const handleSubmitModelType = (e: React.FormEvent) => {
		e.preventDefault();
		if (!branch || branch === 0) {
			toast({
				title: 'Xatolik',
				description: "Bo'limni tanlash majburiy",
				variant: 'destructive',
			});
			return;
		}
		if (!branchCategory || branchCategory === 0) {
			toast({
				title: 'Xatolik',
				description: 'Kategoriya turini tanlash majburiy',
				variant: 'destructive',
			});
			return;
		}
		if (!madel || !name.trim()) {
			toast({
				title: 'Xatolik',
				description: "Model va nomi to'ldirilishi shart",
				variant: 'destructive',
			});
			return;
		}
		const sizes = productTypeSizeRows.filter(
			(r) => String(r.size).trim() !== '' && r.unit !== '' && r.unit !== undefined,
		);
		if (sizes.length === 0) {
			toast({
				title: 'Xatolik',
				description: "Kamida bitta o'lcham (size + unit) kiriting",
				variant: 'destructive',
			});
			return;
		}
		const payload: ProductTypeCreateItem[] = [
			{
				madel,
				name: name.trim(),
				sorting: Number(sorting) || 1,
				product_type_size: sizes.map((r) => ({
					size: typeof r.size === 'number' ? r.size : (r.size as string).trim(),
					unit: typeof r.unit === 'number' ? r.unit : Number(r.unit) || (r.unit as string),
				})),
				branch_category: branchCategory,
				branch: branch,
			},
		];
		createBulk.mutate(payload);
	};

	const openEditModal = (mt: ModelType) => {
		setEditingId(mt.id);
		setEditBranch(0);
		setEditBranchCategory(0);
		setEditMadel(0);
		setEditName('');
		setEditSorting(0);
		setEditModelSearch('');
		setEditModelSizes([]);
		setEditSuggestedSorting(null);
		setIsEditModalOpen(true);
	};

	// Branch o'zgarganda branchCategory va madel ni tozalash
	useEffect(() => {
		if (isAddModalOpen) {
			setBranchCategory(0);
			setMadel(0);
			setSuggestedSorting(null);
		}
	}, [branch, isAddModalOpen]);

	// Branch-category o'zgarganda madel ni tozalash
	useEffect(() => {
		if (isAddModalOpen) {
			setMadel(0);
			setSuggestedSorting(null);
		}
	}, [branchCategory, isAddModalOpen]);

	// Model tanlanganda suggested sorting olish
	useEffect(() => {
		if (isAddModalOpen && madel && madel !== 0) {
			setIsLoadingSuggestedSorting(true);
			modelTypeService
				.getSuggestedSorting(madel)
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
		} else {
			setSuggestedSorting(null);
		}
	}, [madel, isAddModalOpen]);

	// Modal ochilganda default branch ni set qilish
	useEffect(() => {
		if (isAddModalOpen && branches.length > 0 && branch === 0) {
			setBranch(branches[0].id);
		}
	}, [isAddModalOpen, branches, branch]);

	// Edit qilganda getById orqali ma'lumotlarni olish va form'ni to'ldirish
	// API bitta elementli massiv yoki { results: [...] } qaytaradi; branch/branch_category filter bilan listlar mos
	useEffect(() => {
		if (!editingId || !editingModelTypeData) return;

		const raw = editingModelTypeData as ModelType[] | { results?: ModelType[] };
		const list: ModelType[] = Array.isArray(raw) ? raw : (raw?.results ?? []);
		const modelTypeData = list[0] ?? (raw as ModelType);

		if (!modelTypeData || typeof modelTypeData !== 'object') return;

		const modelId = modelTypeData.madel ?? (modelTypeData as ModelType & { model?: number }).model;
		const detail = modelTypeData.madel_detail as
			| {
					branch?: number | null;
					branch_category?: number | null;
					branch_category_detail?: { id: number; product_branch: number } | null;
			  }
			| undefined;
		const topLevel = modelTypeData as { branch?: number | null; branch_category?: number | null };

		isLoadingEditFormRef.current = true;

		// Branch va BranchCategory — yangi struktura: madel_detail ichida (top-level null bo'lishi mumkin)
		const branchId =
			detail?.branch ?? detail?.branch_category_detail?.product_branch ?? topLevel?.branch ?? undefined;
		const branchCategoryId =
			detail?.branch_category ?? detail?.branch_category_detail?.id ?? topLevel?.branch_category ?? undefined;
		if (branchId) setEditBranch(branchId);
		if (branchCategoryId) setEditBranchCategory(branchCategoryId);

		// Asosiy maydonlar
		setEditMadel(modelId || 0);
		setEditName(modelTypeData.name ?? '');
		setEditSorting(modelTypeData.sorting ?? 0);

		// product_type_size — API dagi format (id, size, unit / unit_detail)
		if (modelTypeData.product_type_size && Array.isArray(modelTypeData.product_type_size)) {
			const sizes: ProductTypeSizeItem[] = modelTypeData.product_type_size.map(
				(size: { id?: number; size?: number; unit?: number; unit_detail?: { id: number } }) => ({
					id: size.id,
					size: size.size ?? '',
					unit: size.unit ?? size.unit_detail?.id ?? '',
				}),
			);
			setEditModelSizes(sizes);
		} else {
			setEditModelSizes([]);
		}

		// Agar madel_detail da branch/branch_category bo'lmasa, allModels/allBranchCategories orqali topamiz
		if (!branchId && modelId && allBranchCategoriesForEdit.length > 0 && allModelsForEdit.length > 0) {
			const model = allModelsForEdit.find((m: { id: number }) => m.id === modelId);
			if (model?.branch_category) {
				const branchCategory = allBranchCategoriesForEdit.find(
					(bc: { id: number }) => bc.id === model.branch_category,
				);
				if (branchCategory) {
					setEditBranch(branchCategory.product_branch);
					setEditBranchCategory(branchCategory.id);
				}
			}
		}

		setTimeout(() => {
			isLoadingEditFormRef.current = false;
		}, 0);
	}, [editingId, editingModelTypeData, allBranchCategoriesForEdit, allModelsForEdit]);

	// Edit uchun branch o'zgarganda branchCategory va madel ni tozalash (faqat foydalanuvchi o'zgartirganda)
	useEffect(() => {
		if (isEditModalOpen && !isLoadingEditFormRef.current) {
			setEditBranchCategory(0);
			setEditMadel(0);
			setEditSuggestedSorting(null);
		}
	}, [editBranch, isEditModalOpen]);

	// Edit uchun branch-category o'zgarganda madel ni tozalash (faqat foydalanuvchi o'zgartirganda)
	useEffect(() => {
		if (isEditModalOpen && !isLoadingEditFormRef.current) {
			setEditMadel(0);
			setEditSuggestedSorting(null);
		}
	}, [editBranchCategory, isEditModalOpen]);

	// Edit uchun model tanlanganda suggested sorting olish
	useEffect(() => {
		if (isEditModalOpen && editMadel && editMadel !== 0) {
			setIsLoadingEditSuggestedSorting(true);
			modelTypeService
				.getSuggestedSorting(editMadel)
				.then((response) => {
					setEditSuggestedSorting(response.suggested_sorting);
				})
				.catch((error) => {
					console.error('Error fetching suggested sorting:', error);
					setEditSuggestedSorting(null);
				})
				.finally(() => {
					setIsLoadingEditSuggestedSorting(false);
				});
		} else {
			setEditSuggestedSorting(null);
		}
	}, [editMadel, isEditModalOpen]);

	const closeEditModal = () => {
		setIsEditModalOpen(false);
		setEditingId(null);
	};
	const handleSubmitEdit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (editingId == null || !editMadel || !editName.trim()) {
			toast({ title: 'Xatolik', description: "Model va nomi to'ldirilishi shart", variant: 'destructive' });
			return;
		}

		try {
			// Validatsiya: kamida bitta o'lcham bo'lishi kerak
			const validSizes = editModelSizes.filter(
				(r) => String(r.size).trim() !== '' && r.unit !== '' && r.unit !== undefined,
			);

			if (validSizes.length === 0) {
				toast({
					title: 'Xatolik',
					description: "Kamida bitta o'lcham (size + unit) kiriting",
					variant: 'destructive',
				});
				return;
			}

			// PUT request uchun data tayyorlash (create formatida)
			// Update qilishda branch va branch_category shart emas
			const updateData: ProductTypeCreateItem = {
				madel: editMadel || 0,
				name: editName.trim(),
				sorting: editSorting || 0,
				product_type_size: validSizes.map((r) => ({
					size: typeof r.size === 'number' ? r.size : (r.size as string).trim(),
					unit: typeof r.unit === 'number' ? r.unit : Number(r.unit) || (r.unit as string),
				})),
			};
			if (editBranch) updateData.branch = editBranch;
			if (editBranchCategory) updateData.branch_category = editBranchCategory;

			// PUT request yuborish
			await modelTypeService.updateProductTypeWithSizes(editingId, updateData);

			queryClient.invalidateQueries({ queryKey: modelTypeKeys.lists() });
			queryClient.invalidateQueries({ queryKey: ['modelSizes'] });
			toast({ title: 'Muvaffaqiyatli', description: "Model turi va o'lchamlar yangilandi" });
			closeEditModal();
		} catch (err) {
			const msg =
				err && typeof err === 'object' && 'message' in err
					? String((err as { message: unknown }).message)
					: 'Xatolik';
			toast({ title: 'Xatolik', description: msg, variant: 'destructive' });
		}
	};
	const openDeleteDialog = (id: number) => {
		setDeletingId(id);
		setIsDeleteDialogOpen(true);
	};
	const handleDelete = () => {
		if (deletingId == null) return;
		deleteModelType.mutate(deletingId, {
			onSuccess: () => {
				setIsDeleteDialogOpen(false);
				setDeletingId(null);
			},
		});
	};
	const editModelOptions = useMemo(() => {
		const list = modelsEdit.map((m) => ({ value: m.id, label: m.name }));
		if (editingId != null && editMadel && allModelsForEdit.length > 0) {
			const model = allModelsForEdit.find((m) => m.id === editMadel);
			if (model && !list.some((o) => o.value === editMadel)) {
				return [{ value: editMadel, label: model.name }, ...list];
			}
		}
		return list;
	}, [modelsEdit, editingId, editMadel, allModelsForEdit]);

	// Model sizes yuklanganida editModelSizes'ni yangilash (faqat getById dan product_type_size bo'lmasa)
	useEffect(() => {
		if (editingId && modelSizes.length > 0) {
			let hasProductTypeSize = false;
			if (editingModelTypeData) {
				if (Array.isArray(editingModelTypeData) && editingModelTypeData.length > 0) {
					const firstItem = editingModelTypeData[0];
					hasProductTypeSize = !!firstItem?.product_type_size && firstItem.product_type_size.length > 0;
				} else if (!Array.isArray(editingModelTypeData)) {
					const item = editingModelTypeData as ModelType;
					hasProductTypeSize = !!item.product_type_size && item.product_type_size.length > 0;
				}
			}

			if (!hasProductTypeSize) {
				setEditModelSizes(
					modelSizes.map((ms) => ({
						id: ms.id,
						size: String(ms.size),
						unit: ms.unit || '',
					})),
				);
			}
		}
	}, [editingId, modelSizes, editingModelTypeData]);

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
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleFilter = () => {
		setSearchQuery(formSearch);
		setFilterModelId(formFilterModelId);
		setCurrentPage(1);
	};

	const handleClear = () => {
		setFormSearch('');
		setFormFilterModelId(undefined);
		setSearchQuery('');
		setFilterModelId(undefined);
		setCurrentPage(1);
	};
	const renderPaginationItems = () => {
		const items = [];
		const maxVisible = 5;
		let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
		const endPage = Math.min(totalPages, startPage + maxVisible - 1);
		if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
		if (startPage > 1) {
			items.push(
				<PaginationItem key='1'>
					<PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
						1
					</PaginationLink>
				</PaginationItem>,
			);
			if (startPage > 2) items.push(<PaginationEllipsis key='ellipsis-start' />);
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
			if (endPage < totalPages - 1) items.push(<PaginationEllipsis key='ellipsis-end' />);
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
			<Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabValue)}>
				<TabsList className='grid w-full max-w-md grid-cols-2'>
					<TabsTrigger value='model-type' className='gap-2'>
						<Tag className='h-4 w-4' />
						Model turi
					</TabsTrigger>
					<TabsTrigger value='model-size' className='gap-2'>
						<Ruler className='h-4 w-4' />
						Model o&apos;lchami
					</TabsTrigger>
				</TabsList>

				<TabsContent value='model-type' className='mt-4'>
					<Card>
						<CardHeader className='pb-4 flex flex-row items-center justify-between'>
							<div>
								<CardTitle className='text-lg'>Model turlari</CardTitle>
								<CardDescription>Jami {pagination?.total ?? 0} ta model turi</CardDescription>
							</div>
							<Button onClick={() => setIsAddModalOpen(true)}>
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
											{ value: 'all', label: 'Barcha modellar' },
											...filterModels.map((model) => ({ value: model.id, label: model.name })),
										]}
										value={formFilterModelId ?? 'all'}
										onValueChange={(v) => setFormFilterModelId(v === 'all' ? undefined : Number(v))}
										placeholder="Model bo'yicha filtrlash"
										className='w-full sm:w-[220px]'
										onSearchChange={setFilterModelSearch}
										onScrollToBottom={() => filterModelsInfinite.fetchNextPage()}
										hasMore={!!filterModelsInfinite.hasNextPage}
										isLoadingMore={filterModelsInfinite.isFetchingNextPage}
										isLoading={filterModelsInfinite.isLoading}
									/>
								</div>
								<div className='w-full sm:w-auto flex gap-2 items-center'>
									<Button
										onClick={handleFilter}
										className='bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs px-3'
									>
										<Search className='h-3.5 w-3.5 mr-1' />
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
								<div className='flex justify-center py-8'>
									<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
								</div>
							) : modelTypes.length === 0 ? (
								<div className='flex flex-col items-center justify-center py-8 text-center'>
									<Tag className='h-12 w-12 text-muted-foreground/50 mb-3' />
									<p className='text-muted-foreground'>Ma&apos;lumot topilmadi</p>
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
													<TableHead className='w-[100px] text-right'>Amallar</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{modelTypes.map((mt, index) => (
													<TableRow key={mt.id}>
														<TableCell>
															{index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}
														</TableCell>
														<TableCell className='font-medium'>{mt.name}</TableCell>
														<TableCell>
															{mt.madel_detail?.name ?? mt.madel ?? '-'}
														</TableCell>
														<TableCell className='text-right'>
															<div className='flex items-center justify-end '>
																<Button
																	variant='ghost'
																	size='icon'
																	className='text-warning hover:text-warning'
																	onClick={() => openEditModal(mt)}
																	title='Tahrirlash'
																>
																	<Pencil className='h-4 w-4' />
																</Button>
																<Button
																	variant='ghost'
																	size='icon'
																	onClick={() => openDeleteDialog(mt.id)}
																	title="O'chirish"
																	className='text-destructive hover:text-destructive'
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
									{totalPages > 1 && (
										<div className='mt-4'>
											<Pagination>
												<PaginationContent>
													<PaginationItem>
														<PaginationPrevious
															onClick={() =>
																handlePageChange(Math.max(1, currentPage - 1))
															}
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
																currentPage === totalPages &&
																	'pointer-events-none opacity-50',
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
				</TabsContent>

				<TabsContent value='model-size' className='mt-4'>
					<ModelSizes />
				</TabsContent>
			</Tabs>

			{/* Modal: Model turi va o'lchamlar qo'shish */}
			<Dialog
				open={isAddModalOpen}
				onOpenChange={(open) => {
					setIsAddModalOpen(open);
					if (!open) resetAddForm();
				}}
			>
				<DialogContent className='sm:max-w-[800px] max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Model turi va o&apos;lchamlar qo&apos;shish</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmitModelType} className='space-y-4'>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label>Bo&apos;lim *</Label>
								<Autocomplete
									options={[
										{ value: 0, label: "Bo'limni tanlang" },
										...branches.map((b) => ({ value: b.id, label: b.name })),
									]}
									value={branch ?? 0}
									onValueChange={(v) => {
										setBranch(Number(v));
										setBranchCategory(0);
										setMadel(0);
										setSuggestedSorting(null);
									}}
									placeholder="Bo'limni tanlang"
									searchPlaceholder="Bo'lim qidirish..."
									onSearchChange={setBranchSearch}
									onScrollToBottom={() => branchesInfinite.fetchNextPage()}
									hasMore={!!branchesInfinite.hasNextPage}
									isLoadingMore={branchesInfinite.isFetchingNextPage}
									isLoading={branchesInfinite.isLoading}
								/>
							</div>

							<div className='space-y-2'>
								<Label>Kategoriya turi *</Label>
								<Autocomplete
									options={[
										{ value: 0, label: 'Kategoriya turini tanlang' },
										...branchCategories.map((bc) => ({ value: bc.id, label: bc.name })),
									]}
									value={branchCategory ?? 0}
									onValueChange={(v) => {
										setBranchCategory(Number(v));
										setMadel(0);
										setSuggestedSorting(null);
									}}
									placeholder={
										branch && branch !== 0 ? 'Kategoriya turini tanlang' : "Avval bo'limni tanlang"
									}
									disabled={!branch || branch === 0}
									searchPlaceholder='Kategoriya qidirish...'
									onSearchChange={setBranchCategorySearch}
									onScrollToBottom={() => branchCategoriesInfinite.fetchNextPage()}
									hasMore={!!branchCategoriesInfinite.hasNextPage}
									isLoadingMore={branchCategoriesInfinite.isFetchingNextPage}
									isLoading={branchCategoriesInfinite.isLoading}
								/>
							</div>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label>Model (madel) *</Label>
								<Autocomplete
									options={models.map((m) => ({ value: m.id, label: m.name }))}
									value={madel || undefined}
									onValueChange={(val) => setMadel(Number(val))}
									placeholder={
										branchCategory && branchCategory !== 0
											? 'Model tanlang'
											: 'Avval kategoriya turini tanlang'
									}
									searchPlaceholder='Model qidirish...'
									emptyText='Model topilmadi'
									onSearchChange={setModelSearch}
									onScrollToBottom={() => modelsInfinite.fetchNextPage()}
									hasMore={!!modelsInfinite.hasNextPage}
									isLoadingMore={modelsInfinite.isFetchingNextPage}
									isLoading={modelsInfinite.isLoading || isModelsLoading}
									disabled={!branchCategory || branchCategory === 0}
								/>
							</div>

							<div className='space-y-2'>
								<Label>Nomi *</Label>
								<Input
									placeholder='Model turi nomi'
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
							</div>
						</div>

						<div className='space-y-2 max-w-[200px]'>
							<Label>Tartib raqami</Label>
							<Input
								type='number'
								min={0}
								value={sorting}
								onChange={(e) => setSorting(Number(e.target.value) || 0)}
							/>
							{suggestedSorting !== null && (
								<p className='text-xs text-red-500 font-medium'>
									Tavsiya etilgan tartib raqami: {suggestedSorting}
								</p>
							)}
							{suggestedSorting === null && isLoadingSuggestedSorting && (
								<p className='text-xs text-muted-foreground'>
									Tavsiya etilgan tartib raqami yuklanmoqda...
								</p>
							)}
						</div>
						<div className='space-y-3'>
							<div className='flex items-center justify-between'>
								<Label>O&apos;lchamlar (product_type_size) *</Label>
								<Button type='button' variant='outline' size='sm' onClick={addSizeRow}>
									<Plus className='h-4 w-4 mr-1' />
									Qo&apos;shish
								</Button>
							</div>
							<div className='rounded-md border p-3 space-y-2 max-h-[220px] overflow-y-auto'>
								{productTypeSizeRows.map((row, index) => (
									<div key={index} className='flex flex-wrap items-center gap-2'>
										<Input
											placeholder="O\'lcham"
											className='w-28'
											value={row.size}
											onChange={(e) => updateSizeRow(index, 'size', e.target.value)}
										/>
										<Autocomplete
											options={units.map((u) => ({ value: u.id, label: u.code }))}
											value={row.unit ? Number(row.unit) : undefined}
											onValueChange={(v) => updateSizeRow(index, 'unit', Number(v))}
											placeholder='Birlik'
											searchPlaceholder='Birlik qidirish...'
											emptyText='Topilmadi'
											className='w-[140px]'
											onSearchChange={setUnitSearch}
											onScrollToBottom={() => unitsInfinite.fetchNextPage()}
											hasMore={!!unitsInfinite.hasNextPage}
											isLoadingMore={unitsInfinite.isFetchingNextPage}
											isLoading={unitsInfinite.isLoading}
										/>
										<Button
											type='button'
											variant='ghost'
											size='icon'
											onClick={() => removeSizeRow(index)}
											className='text-destructive'
										>
											<Trash2 className='h-4 w-4' />
										</Button>
									</div>
								))}
							</div>
						</div>
						<DialogFooter>
							<Button type='button' variant='outline' onClick={() => setIsAddModalOpen(false)}>
								Bekor qilish
							</Button>
							<Button type='submit' disabled={createBulk.isPending}>
								{createBulk.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
								Saqlash
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Modal: Tahrirlash */}
			<Dialog open={isEditModalOpen} onOpenChange={(open) => !open && closeEditModal()}>
				<DialogContent className='sm:max-w-[800px] max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Model turini tahrirlash</DialogTitle>
					</DialogHeader>
					{isEditingModelTypeLoading ? (
						<div className='flex items-center justify-center py-12'>
							<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
						</div>
					) : (
						<form onSubmit={handleSubmitEdit} className='space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label>Bo&apos;lim *</Label>
									<Autocomplete
										options={[
											{ value: 0, label: "Bo'limni tanlang" },
											...editBranches.map((b) => ({ value: b.id, label: b.name })),
										]}
										value={editBranch ?? 0}
										onValueChange={(v) => {
											setEditBranch(Number(v));
											setEditBranchCategory(0);
											setEditMadel(0);
											setEditSuggestedSorting(null);
										}}
										placeholder="Bo'limni tanlang"
										searchPlaceholder="Bo'lim qidirish..."
										onSearchChange={setEditBranchSearch}
										onScrollToBottom={() => editBranchesInfinite.fetchNextPage()}
										hasMore={!!editBranchesInfinite.hasNextPage}
										isLoadingMore={editBranchesInfinite.isFetchingNextPage}
										isLoading={editBranchesInfinite.isLoading}
									/>
								</div>

								<div className='space-y-2'>
									<Label>Kategoriya turi *</Label>
									<Autocomplete
										options={[
											{ value: 0, label: 'Kategoriya turini tanlang' },
											...editBranchCategories.map((bc) => ({ value: bc.id, label: bc.name })),
										]}
										value={editBranchCategory ?? 0}
										onValueChange={(v) => {
											setEditBranchCategory(Number(v));
											setEditMadel(0);
											setEditSuggestedSorting(null);
										}}
										placeholder={
											editBranch && editBranch !== 0
												? 'Kategoriya turini tanlang'
												: "Avval bo'limni tanlang"
										}
										disabled={!editBranch || editBranch === 0}
										searchPlaceholder='Kategoriya qidirish...'
										onSearchChange={setEditBranchCategorySearch}
										onScrollToBottom={() => editBranchCategoriesInfinite.fetchNextPage()}
										hasMore={!!editBranchCategoriesInfinite.hasNextPage}
										isLoadingMore={editBranchCategoriesInfinite.isFetchingNextPage}
										isLoading={editBranchCategoriesInfinite.isLoading}
									/>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label>Model (madel) *</Label>
									<Autocomplete
										options={editModelOptions}
										value={editMadel || undefined}
										onValueChange={(v) => setEditMadel(Number(v))}
										placeholder={
											editBranchCategory && editBranchCategory !== 0
												? 'Model tanlang'
												: editMadel
													? undefined
													: 'Avval kategoriya turini tanlang'
										}
										searchPlaceholder='Model qidirish...'
										emptyText='Model topilmadi'
										onSearchChange={setEditModelSearch}
										isLoading={isModelsEditLoading}
										disabled={!editMadel && (!editBranchCategory || editBranchCategory === 0)}
										onScrollToBottom={() => editModelsInfinite.fetchNextPage()}
										hasMore={!!editModelsInfinite.hasNextPage}
										isLoadingMore={editModelsInfinite.isFetchingNextPage}
									/>
								</div>

								<div className='space-y-2'>
									<Label>Nomi *</Label>
									<Input
										placeholder='Model turi nomi'
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
									/>
								</div>
							</div>

							<div className='space-y-2 max-w-[200px]'>
								<Label>Tartib raqami</Label>
								<Input
									type='number'
									min={0}
									value={editSorting}
									onChange={(e) => setEditSorting(Number(e.target.value) || 0)}
								/>
								{editSuggestedSorting !== null && (
									<p className='text-xs text-red-500 font-medium'>
										Tavsiya etilgan tartib raqami: {editSuggestedSorting}
									</p>
								)}
								{editSuggestedSorting === null && isLoadingEditSuggestedSorting && (
									<p className='text-xs text-muted-foreground'>
										Tavsiya etilgan tartib raqami yuklanmoqda...
									</p>
								)}
							</div>
							<div className='space-y-3'>
								<div className='flex items-center justify-between'>
									<Label>O&apos;lchamlar (product_type_size)</Label>
									<Button type='button' variant='outline' size='sm' onClick={addEditSizeRow}>
										<Plus className='h-4 w-4 mr-1' />
										Qo&apos;shish
									</Button>
								</div>
								{isModelSizesLoading ? (
									<div className='flex justify-center py-4'>
										<Loader2 className='h-7 w-6 animate-spin text-muted-foreground' />
									</div>
								) : (
									<div className='rounded-md border p-3 space-y-2 max-h-[220px] overflow-y-auto'>
										{editModelSizes.length === 0 ? (
											<p className='text-xs text-muted-foreground text-center py-2'>
												O&apos;lcham topilmadi
											</p>
										) : (
											editModelSizes.map((row, index) => (
												<div key={index} className='flex flex-wrap items-center gap-2'>
													<Input
														placeholder="O'lcham"
														className='w-28'
														value={row.size}
														onChange={(e) =>
															updateEditSizeRow(index, 'size', e.target.value)
														}
													/>
													<Autocomplete
														options={editUnits.map((u) => ({ value: u.id, label: u.code }))}
														value={row.unit ? Number(row.unit) : undefined}
														onValueChange={(v) =>
															updateEditSizeRow(index, 'unit', Number(v))
														}
														placeholder='Birlik'
														searchPlaceholder='Birlik qidirish...'
														emptyText='Topilmadi'
														className='w-[140px]'
														onSearchChange={setEditUnitSearch}
														onScrollToBottom={() => editUnitsInfinite.fetchNextPage()}
														hasMore={!!editUnitsInfinite.hasNextPage}
														isLoadingMore={editUnitsInfinite.isFetchingNextPage}
														isLoading={editUnitsInfinite.isLoading}
													/>
													<Button
														type='button'
														variant='ghost'
														size='icon'
														onClick={() => removeEditSizeRow(index)}
														className='text-destructive'
													>
														<Trash2 className='h-4 w-4' />
													</Button>
												</div>
											))
										)}
									</div>
								)}
							</div>
							<DialogFooter>
								<Button type='button' variant='outline' onClick={closeEditModal}>
									Bekor qilish
								</Button>
								<Button type='submit' disabled={updateModelType.isPending || isEditingModelTypeLoading}>
									{updateModelType.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
									Saqlash
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>

			{/* O'chirish tasdiq */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
						<AlertDialogDescription>
							Bu model turi o'chiriladi. Bu amalni qaytarib bo'lmaydi.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Bekor qilish</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={deleteModelType.isPending}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{deleteModelType.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							O'chirish
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
