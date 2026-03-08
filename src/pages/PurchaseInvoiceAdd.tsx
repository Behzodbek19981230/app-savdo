import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NumberInput from '@/components/ui/NumberInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import {
	useCreatePurchaseInvoice,
	usePurchaseInvoice,
	useUpdatePurchaseInvoice,
	useDonePurchaseInvoice,
	useDeletePurchaseInvoice,
	purchaseInvoiceKeys,
} from '@/hooks/api/usePurchaseInvoice';
import {
	useCreateProductHistory,
	useDeleteProductHistory,
	useProductHistories,
	useUpdateProductHistory,
} from '@/hooks/api/useProductHistory';
import { useSuppliers, useCreateSupplier } from '@/hooks/api/useSupplier';
import { useSklads } from '@/hooks/api/useSklad';
import { useCompanies } from '@/hooks/api/useCompanies';
import { PurchaseInvoiceType, PurchaseInvoiceTypeLabels, CreatePurchaseInvoicePayload } from '@/types/purchaseInvoice';
import type { ProductHistory } from '@/types/productHistory';
import { useProduct, useProducts } from '@/hooks/api/useProducts';
import {
	useProductCategories,
	useCreateProductCategory,
	PRODUCT_CATEGORY_KEYS,
} from '@/hooks/api/useProductCategories';
import {
	useProductBranchCategories,
	useCreateProductBranchCategory,
	PRODUCT_BRANCH_CATEGORY_KEYS,
} from '@/hooks/api/useProductBranchCategories';
import { useProductModels, useCreateProductModel, PRODUCT_MODEL_KEYS } from '@/hooks/api/useProductModels';
import { useQueryClient } from '@tanstack/react-query';
import { useModelTypes, useCreateModelType, modelTypeKeys } from '@/hooks/api/useModelTypes';
import { useModelSizes } from '@/hooks/api/useModelSizes';
import { useUnits, useCreateUnit, unitKeys } from '@/hooks/api/useUnit';
import { useProductTypeSizes, useCreateProductTypeSize, productTypeSizeKeys } from '@/hooks/api/useProductTypeSize';
import { useExchangeRates } from '@/hooks/api/useExchangeRate';
import { useUsers } from '@/hooks/api/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
	ArrowLeft,
	Plus,
	Loader2,
	Package,
	Star,
	Trash2,
	ArrowDownCircle,
	DollarSign,
	Calendar,
	User,
	Building2,
	Warehouse,
	Truck,
	FileText,
	Hash,
	CheckCircle2,
	ShoppingCart,
	Pencil,
	Eye,
	ShoppingBag,
} from 'lucide-react';
import moment from 'moment';
import { Textarea } from '@/components/ui/textarea';
import { showError } from '@/lib/toast';
import { productService } from '@/services';
import { formatNumber } from '@/lib/utils';

// Faktura form schema
const invoiceSchema = z
	.object({
		type: z.enum([PurchaseInvoiceType.EXTERNAL, PurchaseInvoiceType.INTERNAL]),
		supplier: z.coerce.number().min(0).optional(),
		sklad_outgoing: z.coerce.number().min(0).optional(),
		filial: z.coerce.number().positive('Filial tanlanishi shart'),
		sklad: z.coerce.number().positive('Ombor tanlanishi shart'),
		date: z.string().min(1, 'Sana kiritilishi shart'),
		employee: z.coerce.number().positive('Xodim tanlanishi shart'),
	})
	.superRefine((data, ctx) => {
		if (data.type === PurchaseInvoiceType.EXTERNAL) {
			if (!data.supplier || data.supplier <= 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Ta'minotchi tanlanishi shart",
					path: ['supplier'],
				});
			}
		} else {
			if (!data.sklad_outgoing || data.sklad_outgoing <= 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Ombor tanlanishi shart',
					path: ['sklad_outgoing'],
				});
			}
		}
	});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Payment form schema
const paymentSchema = z.object({
	given_summa_total_dollar: z.coerce.number().min(0, "Jami to'lov kiritilishi shart"),
	given_summa_dollar: z.coerce.number().min(0, "Dollar to'lovi kiritilishi shart"),
	given_summa_naqt: z.coerce.number().min(0, "Naqt to'lovi kiritilishi shart"),
	given_summa_kilik: z.coerce.number().min(0, "Kesibek to'lovi kiritilishi shart"),
	given_summa_terminal: z.coerce.number().min(0, "Terminal to'lovi kiritilishi shart"),
	given_summa_transfer: z.coerce.number().min(0, "Transfer to'lovi kiritilishi shart"),
	total_debt: z.coerce.number().min(0, 'Qarz miqdori kiritilishi shart'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// Mahsulot form schema
const productSchema = z.object({
	product: z.coerce.number().optional(), // Endi ishlatilmaydi
	reserve_limit: z.coerce.number().min(0, 'Zaxira limiti kiritilishi shart'),
	is_weight: z.boolean().default(false), // Tarozi
	branch: z.coerce.number().positive("Bo'lim tanlanishi shart"),
	branch_category: z.coerce.number().positive('Kategoriya turi tanlanishi shart'),
	model: z.coerce.number().positive('Brend tanlanishi shart'),
	type: z.coerce.number().positive('Mahsulot nomi tanlanishi shart'), // Piyola, Kosa, etc.
	size: z.coerce.number().positive("O'lcham tanlanishi shart"), // ProductTypeSize
	unit: z.coerce.number().positive("O'lchov birligi tanlanishi shart"), // O'lchov birligi (Unit)
	count: z.coerce.number().int().positive('Miqdor kiritilishi shart'), // int
	real_price: z.coerce.number().min(0, 'Xaqiqiy narx kiritilishi shart'), // float - Dollar
	min_price: z.coerce.number().min(0, 'Minimal narx kiritilishi shart'), // float - Dollar
	note: z.string().optional(), // Izoh
});

type ProductFormData = z.infer<typeof productSchema>;

// Qo'shilgan mahsulot turi
interface AddedProduct extends ProductFormData {
	id: number;
	product_name?: string; // Type name (Piyola, Kosa, etc.)
	branch_name?: string;
	branch_category_name?: string;
	model_name?: string;
	type_name?: string;
	size_name?: string;
	unit_name?: string;
}

export default function PurchaseInvoiceAdd() {
	const navigate = useNavigate();
	const { id } = useParams<{ id?: string }>();
	const { user } = useAuthContext();
	const { toast } = useToast();
	const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
	const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [tempProductId, setTempProductId] = useState(1);
	const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
	const [newUnitName, setNewUnitName] = useState('');
	const [newUnitCode, setNewUnitCode] = useState('');
	const [isCreatingUnit, setIsCreatingUnit] = useState(false);
	const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
	const [pendingInvoiceData, setPendingInvoiceData] = useState<InvoiceFormData | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<ProductHistory | null>(null);
	const [viewingProduct, setViewingProduct] = useState<ProductHistory | null>(null);
	const [productEditForm, setProductEditForm] = useState<{
		count: number;
		real_price: number;
	} | null>(null);
	const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
	const { selectedFilialId } = useAuthContext();

	// Load existing invoice if id is provided
	const { data: existingInvoice, isLoading: isLoadingInvoice } = usePurchaseInvoice(id ? Number(id) : undefined);
	const deletePurchaseInvoice = useDeletePurchaseInvoice();

	// Load product histories for existing invoice
	const { data: productHistoriesData, isLoading: isProductHistoriesLoading } = useProductHistories(
		id
			? {
					purchase_invoice: Number(id),
					perPage: 1000,
				}
			: undefined,
	);

	const productHistories = productHistoriesData?.results || [];

	// Autocomplete pagination va search state'lar
	const [categoryPage, setCategoryPage] = useState(1);
	const [categorySearch, setCategorySearch] = useState('');
	const [allCategories, setAllCategories] = useState<Array<{ value: number; label: string }>>([]);

	const [branchCategoryPage, setBranchCategoryPage] = useState(1);
	const [branchCategorySearch, setBranchCategorySearch] = useState('');
	const [allBranchCategories, setAllBranchCategories] = useState<Array<{ value: number; label: string }>>([]);

	const [modelPage, setModelPage] = useState(1);
	const [modelSearch, setModelSearch] = useState('');
	const [allModels, setAllModels] = useState<Array<{ value: number; label: string }>>([]);

	const [typePage, setTypePage] = useState(1);
	const [typeSearch, setTypeSearch] = useState('');
	const [allTypes, setAllTypes] = useState<Array<{ value: number; label: string }>>([]);

	const [sizePage, setSizePage] = useState(1);
	const [sizeSearch, setSizeSearch] = useState('');
	const [allSizes, setAllSizes] = useState<Array<{ value: number; label: string }>>([]);

	// Faktura form
	const invoiceForm = useForm<InvoiceFormData>({
		resolver: zodResolver(invoiceSchema),
		defaultValues: {
			type: PurchaseInvoiceType.EXTERNAL,
			supplier: 0,
			sklad_outgoing: 0,
			filial: (selectedFilialId ?? user?.filials_detail?.[0]?.id) || 0,
			sklad: 0,
			date: moment().format('YYYY-MM-DD'),
			employee: user?.id || 0,
		},
	});

	// Watch type to conditionally show supplier or sklad_outgoing
	const invoiceType = invoiceForm.watch('type');

	// Sync form filial when global selected filial changes
	useEffect(() => {
		if (selectedFilialId) {
			invoiceForm.setValue('filial', selectedFilialId);
		}
	}, [selectedFilialId]);

	// Load existing invoice data into form
	useEffect(() => {
		if (existingInvoice) {
			invoiceForm.reset({
				type: existingInvoice.type as PurchaseInvoiceType,
				supplier: existingInvoice.supplier || 0,
				sklad_outgoing: ((existingInvoice as unknown as Record<string, unknown>).sklad_outgoing as number) || 0,
				filial: existingInvoice.filial,
				sklad: existingInvoice.sklad,
				date: existingInvoice.date,
				employee: existingInvoice.employee,
			});
		}
	}, [existingInvoice, invoiceForm]);

	// Clear supplier/sklad_outgoing when type changes
	useEffect(() => {
		if (invoiceType === PurchaseInvoiceType.EXTERNAL) {
			invoiceForm.setValue('sklad_outgoing', 0);
		} else {
			invoiceForm.setValue('supplier', 0);
		}
	}, [invoiceType, invoiceForm]);

	// Payment form
	const paymentForm = useForm<PaymentFormData>({
		resolver: zodResolver(paymentSchema),
		defaultValues: {
			given_summa_total_dollar: 0,
			given_summa_dollar: 0,
			given_summa_naqt: 0,
			given_summa_kilik: 0,
			given_summa_terminal: 0,
			given_summa_transfer: 0,
			total_debt: 0,
		},
	});

	// Edit modal ochilganda faqat sana va ombor (invoiceForm) existingInvoice dan to'ldiriladi
	useEffect(() => {
		if (isEditModalOpen && existingInvoice) {
			invoiceForm.reset({
				type: existingInvoice.type as PurchaseInvoiceType,
				supplier: existingInvoice.supplier || 0,
				sklad_outgoing: ((existingInvoice as unknown as Record<string, unknown>).sklad_outgoing as number) || 0,
				filial: existingInvoice.filial,
				sklad: existingInvoice.sklad,
				date: existingInvoice.date,
				employee: existingInvoice.employee,
			});
		}
	}, [isEditModalOpen, existingInvoice, invoiceForm]);

	// Mahsulot tahrirlash modal ochilganda faqat miqdor va narx to'ldiriladi
	const toNum = (v: number | string) => (typeof v === 'string' ? parseFloat(v) || 0 : (v ?? 0));
	useEffect(() => {
		if (editingProduct) {
			setProductEditForm({
				count: editingProduct.count,
				real_price: toNum(editingProduct.real_price),
			});
		} else {
			setProductEditForm(null);
		}
	}, [editingProduct]);

	// Watch payment form values for auto-calculation
	const givenSummaDollar = paymentForm.watch('given_summa_dollar') || 0;
	const givenSummaNaqt = paymentForm.watch('given_summa_naqt') || 0;
	const givenSummaKilik = paymentForm.watch('given_summa_kilik') || 0;
	const givenSummaTerminal = paymentForm.watch('given_summa_terminal') || 0;
	const givenSummaTransfer = paymentForm.watch('given_summa_transfer') || 0;

	// Mahsulot form
	const productForm = useForm<ProductFormData>({
		resolver: zodResolver(productSchema),
		defaultValues: {
			product: 0,
			reserve_limit: 100,
			is_weight: false,
			branch: 0,
			branch_category: 0,
			model: 0,
			type: 0,
			size: 0,
			unit: 0,
			count: 0,
			real_price: 0,
			min_price: 0,
			note: '',
		},
	});

	const selectedFilial = invoiceForm.watch('filial');
	const selectedBranch = productForm.watch('branch');
	const selectedBranchCategory = productForm.watch('branch_category');
	const selectedModel = productForm.watch('model');
	const selectedType = productForm.watch('type');
	const selectedUnit = productForm.watch('unit');
	const selectedSize = productForm.watch('size');
	const selectedSkladId = invoiceForm.watch('sklad_outgoing');

	const queryClient = useQueryClient();

	// Data fetching
	const { data: usersData } = useUsers({ limit: 20, is_active: true });
	const { data: suppliersData } = useSuppliers({
		limit: 20,
		is_delete: false,
		filial: selectedFilialId ?? undefined,
	});
	const { data: companiesData } = useCompanies({ limit: 20, is_delete: false });
	const { data: skladsData } = useSklads({ perPage: 1000, filial: selectedFilialId ?? undefined, is_delete: false });
	const { data: productsData } = useProducts({ limit: 20, is_delete: false });

	// Categories with pagination and search
	const { data: categoriesData, isLoading: isCategoriesLoading } = useProductCategories({
		page: categoryPage,
		limit: 20,
		search: categorySearch || undefined,
		is_delete: false,
	});

	// Branch categories with pagination and search
	const { data: branchCategoriesData, isLoading: isBranchCategoriesLoading } = useProductBranchCategories(
		selectedBranch
			? {
					page: branchCategoryPage,
					limit: 20,
					search: branchCategorySearch || undefined,
					is_delete: false,
					product_branch: selectedBranch,
				}
			: undefined,
	);

	// Models with pagination and search - branch_category bo'yicha filter
	const { data: modelsData, isLoading: isModelsLoading } = useProductModels(
		selectedBranchCategory
			? {
					page: modelPage,
					limit: 20,
					search: modelSearch || undefined,
					is_delete: false,
					branch_category: selectedBranchCategory,
				}
			: undefined,
	);

	// Types with pagination and search
	const { data: typesData, isLoading: isTypesLoading } = useModelTypes(
		selectedModel
			? {
					page: typePage,
					limit: 20,
					search: typeSearch || undefined,
					is_delete: false,
					madel: selectedModel,
				}
			: undefined,
	);

	const { data: sizesData } = useModelSizes({ limit: 20, is_delete: false });
	const { data: unitsData, isLoading: isUnitsLoading } = useUnits({ limit: 20, is_active: true });

	// ProductTypeSizes with pagination and search
	const { data: productTypeSizesData, isLoading: isSizesLoading } = useProductTypeSizes(
		selectedType
			? {
					page: sizePage,
					limit: 20,
					search: sizeSearch || undefined,
					is_delete: false,
					product_type: selectedType,
				}
			: undefined,
	);

	const { data: exchangeRatesData } = useExchangeRates(selectedFilial ? { filial: selectedFilial } : undefined);

	const users = usersData?.results || [];
	const suppliers = suppliersData?.results || [];
	const companies = companiesData?.results || [];
	const sklads = skladsData?.results || [];
	const products = productsData?.results || [];
	const categories = categoriesData?.results || [];
	const branchCategories = branchCategoriesData?.results || [];
	const models = modelsData?.results || [];
	const types = typesData?.results || [];
	const sizes = sizesData?.results || [];
	const units = unitsData?.results || [];
	const productTypeSizes = productTypeSizesData?.results || [];
	const dollarRate = exchangeRatesData?.results?.[0]?.dollar || 12500;

	// Get dollar rate for payment modal (from pending invoice filial)
	const { data: exchangeRatesDataForPayment } = useExchangeRates(
		pendingInvoiceData?.filial ? { filial: pendingInvoiceData.filial } : undefined,
	);
	const dollarRateForPayment = exchangeRatesDataForPayment?.results?.[0]?.dollar || dollarRate;

	// Auto-calculate total dollar based on inputs
	useEffect(() => {
		if (!isPaymentDialogOpen) return;
		const totalInSom = givenSummaNaqt + givenSummaKilik + givenSummaTerminal + givenSummaTransfer;
		const totalInDollar = givenSummaDollar + totalInSom / dollarRateForPayment;
		paymentForm.setValue('given_summa_total_dollar', parseFloat(totalInDollar.toFixed(2)));
	}, [
		givenSummaDollar,
		givenSummaNaqt,
		givenSummaKilik,
		givenSummaTerminal,
		givenSummaTransfer,
		dollarRateForPayment,
		paymentForm,
		isPaymentDialogOpen,
	]);

	// Ensure the invoice 'employee' defaults to the current user when available
	useEffect(() => {
		const currentEmployee = invoiceForm.getValues().employee;
		if ((currentEmployee === undefined || currentEmployee === 0) && user?.id) {
			invoiceForm.setValue('employee', user.id);
		}
		// Also if users list is loaded but doesn't include current employee, still set it
	}, [user, users, invoiceForm]);

	// Categories pagination va search uchun effect
	useEffect(() => {
		if (categoriesData?.results) {
			if (categoryPage === 1) {
				setAllCategories(categoriesData.results.map((c) => ({ value: c.id, label: c.name })));
			} else {
				setAllCategories((prev) => {
					const existingIds = new Set(prev.map((p) => p.value));
					const newItems = categoriesData.results
						.filter((c) => !existingIds.has(c.id))
						.map((c) => ({ value: c.id, label: c.name }));
					return [...prev, ...newItems];
				});
			}
		}
	}, [categoriesData, categoryPage]);

	// Category search o'zgarganda page ni reset; listni tozalamaslik — API javobi kelganda effect yangilaydi (branch listi chiqadi)
	useEffect(() => {
		setCategoryPage(1);
		if (!categorySearch.trim()) {
			queryClient.invalidateQueries({ queryKey: PRODUCT_CATEGORY_KEYS.lists() });
		}
	}, [categorySearch, queryClient]);

	// Branch categories: API dan kelgan listni selectga yozish (results yoki to'g'ridan-to'g'ri massiv)
	useEffect(() => {
		if (!selectedBranch) return;
		const raw = branchCategoriesData as
			| {
					results?: Array<{ id: number; name: string }>;
					data?: { results?: Array<{ id: number; name: string }> };
			  }
			| Array<{ id: number; name: string }>
			| undefined;
		const list: Array<{ id: number; name: string }> = Array.isArray(raw)
			? raw
			: (raw?.results ??
				(raw as { data?: { results?: Array<{ id: number; name: string }> } })?.data?.results ??
				[]);
		if (!list.length) {
			if (!isBranchCategoriesLoading) setAllBranchCategories([]);
			return;
		}
		if (branchCategoryPage === 1) {
			setAllBranchCategories(list.map((c) => ({ value: c.id, label: c.name })));
		} else {
			setAllBranchCategories((prev) => {
				const existingIds = new Set(prev.map((p) => p.value));
				const newItems = list
					.filter((c) => !existingIds.has(c.id))
					.map((c) => ({ value: c.id, label: c.name }));
				return [...prev, ...newItems];
			});
		}
	}, [branchCategoriesData, branchCategoryPage, selectedBranch, isBranchCategoriesLoading]);

	// Branch category search o'zgarganda page ni reset; listni tozalamaslik — API javobi kelganda effect yangilaydi
	useEffect(() => {
		setBranchCategoryPage(1);
		if (!branchCategorySearch.trim()) {
			queryClient.invalidateQueries({ queryKey: PRODUCT_BRANCH_CATEGORY_KEYS.lists() });
		}
	}, [branchCategorySearch, queryClient]);

	// Branch o'zgarganda: faqat page/search reset va invalidate — listni tozalamaslik, yangi ma'lumot kelganda effect yangilaydi
	useEffect(() => {
		setBranchCategoryPage(1);
		setBranchCategorySearch('');
		if (selectedBranch) {
			queryClient.invalidateQueries({ queryKey: PRODUCT_BRANCH_CATEGORY_KEYS.lists() });
		}
	}, [selectedBranch, queryClient]);

	// Models: API listini selectga yozish (branch_category tanlanganida)
	useEffect(() => {
		if (!selectedBranchCategory) return;
		const raw = modelsData as
			| { results?: Array<{ id: number; name: string }> }
			| Array<{ id: number; name: string }>
			| undefined;
		const list = Array.isArray(raw) ? raw : (raw?.results ?? []);
		if (!list.length) return;
		if (modelPage === 1) {
			setAllModels(list.map((m) => ({ value: m.id, label: m.name })));
		} else {
			setAllModels((prev) => {
				const existingIds = new Set(prev.map((p) => p.value));
				const newItems = list
					.filter((m) => !existingIds.has(m.id))
					.map((m) => ({ value: m.id, label: m.name }));
				return [...prev, ...newItems];
			});
		}
	}, [modelsData, modelPage, selectedBranchCategory]);

	// Model search o'zgarganda page ni reset; listni tozalamaslik — API javobi kelganda effect yangilaydi
	useEffect(() => {
		setModelPage(1);
		if (!modelSearch.trim()) {
			queryClient.invalidateQueries({ queryKey: PRODUCT_MODEL_KEYS.lists() });
		}
	}, [modelSearch, queryClient]);

	// Branch yoki Branch category o'zgarganda: model listini yangilash uchun faqat reset + invalidate
	useEffect(() => {
		setModelPage(1);
		setModelSearch('');
		if (selectedBranchCategory) {
			queryClient.invalidateQueries({ queryKey: PRODUCT_MODEL_KEYS.lists() });
		}
	}, [selectedBranch, selectedBranchCategory, queryClient]);

	// Types: API listini selectga yozish (model tanlanganida)
	useEffect(() => {
		if (!selectedModel) return;
		const raw = typesData as
			| { results?: Array<{ id: number; name: string }> }
			| Array<{ id: number; name: string }>
			| undefined;
		const list = Array.isArray(raw) ? raw : (raw?.results ?? []);
		if (!list.length) return;
		if (typePage === 1) {
			setAllTypes(list.map((t) => ({ value: t.id, label: t.name })));
		} else {
			setAllTypes((prev) => {
				const existingIds = new Set(prev.map((p) => p.value));
				const newItems = list
					.filter((t) => !existingIds.has(t.id))
					.map((t) => ({ value: t.id, label: t.name }));
				return [...prev, ...newItems];
			});
		}
	}, [typesData, typePage, selectedModel]);

	// Type search o'zgarganda page ni reset; listni tozalamaslik — API javobi kelganda effect yangilaydi
	useEffect(() => {
		setTypePage(1);
		if (!typeSearch.trim()) {
			queryClient.invalidateQueries({ queryKey: modelTypeKeys.lists() });
		}
	}, [typeSearch, queryClient]);

	// Model o'zgarganda: type listini yangilash uchun faqat reset + invalidate
	useEffect(() => {
		setTypePage(1);
		setTypeSearch('');
		if (selectedModel) {
			queryClient.invalidateQueries({ queryKey: modelTypeKeys.lists() });
		}
	}, [selectedModel, queryClient]);

	// Sizes: API listini selectga yozish (type tanlanganida)
	useEffect(() => {
		if (!selectedType) return;
		const raw = productTypeSizesData as
			| { results?: Array<{ id: number; size?: number }> }
			| Array<{ id: number; size?: number }>
			| undefined;
		const list = Array.isArray(raw) ? raw : (raw?.results ?? []);
		if (!list.length) return;
		if (sizePage === 1) {
			setAllSizes(list.map((s) => ({ value: s.id, label: String(s.size ?? s.id) })));
		} else {
			setAllSizes((prev) => {
				const existingIds = new Set(prev.map((p) => p.value));
				const newItems = list
					.filter((s) => !existingIds.has(s.id))
					.map((s) => ({ value: s.id, label: String(s.size ?? s.id) }));
				return [...prev, ...newItems];
			});
		}
	}, [productTypeSizesData, sizePage, selectedType]);

	// Size search o'zgarganda page ni reset; listni tozalamaslik — API javobi kelganda effect yangilaydi
	useEffect(() => {
		setSizePage(1);
		if (!sizeSearch.trim()) {
			queryClient.invalidateQueries({ queryKey: productTypeSizeKeys.lists() });
		}
	}, [sizeSearch, queryClient]);

	// Type o'zgarganda: size listini yangilash uchun faqat reset + invalidate
	useEffect(() => {
		setSizePage(1);
		setSizeSearch('');
		if (selectedType) {
			queryClient.invalidateQueries({ queryKey: productTypeSizeKeys.lists() });
		}
	}, [selectedType, queryClient]);

	// Mahsulot modal ochilganda search/page reset, listlarni tozalamasdan faqat yangilash (branch listi keladi)
	useEffect(() => {
		if (isProductDialogOpen) {
			setCategorySearch('');
			setCategoryPage(1);
			setBranchCategorySearch('');
			setBranchCategoryPage(1);
			setModelSearch('');
			setModelPage(1);
			setTypeSearch('');
			setTypePage(1);
			setSizeSearch('');
			setSizePage(1);
			// Listlarni tozalamaslik — cache'dagi ma'lumot ko'rinadi, invalidate dan keyin yangilanadi
			queryClient.invalidateQueries({ queryKey: PRODUCT_CATEGORY_KEYS.lists() });
			queryClient.invalidateQueries({ queryKey: PRODUCT_BRANCH_CATEGORY_KEYS.lists() });
			queryClient.invalidateQueries({ queryKey: PRODUCT_MODEL_KEYS.lists() });
			queryClient.invalidateQueries({ queryKey: modelTypeKeys.lists() });
			queryClient.invalidateQueries({ queryKey: productTypeSizeKeys.lists() });
		}
	}, [isProductDialogOpen, queryClient]);

	// Mutations
	const createPurchaseInvoice = useCreatePurchaseInvoice();
	const updatePurchaseInvoice = useUpdatePurchaseInvoice();
	const donePurchaseInvoice = useDonePurchaseInvoice();
	const createProductHistory = useCreateProductHistory();
	const updateProductHistory = useUpdateProductHistory();
	const deleteProductHistoryMutation = useDeleteProductHistory();
	const createSupplier = useCreateSupplier();
	const createModel = useCreateProductModel();
	const createProductCategory = useCreateProductCategory();
	const createBranchCategory = useCreateProductBranchCategory();
	const createType = useCreateModelType();
	const createUnit = useCreateUnit();
	const createProductTypeSize = useCreateProductTypeSize();

	// Autocomplete uchun category options (dynamic)
	const categoryOptions = allCategories;

	// Autocomplete uchun branch category options (dynamic)
	const branchCategoryOptions = allBranchCategories;

	// Autocomplete uchun model options (dynamic)
	const modelOptions = allModels;

	// Autocomplete uchun type options (dynamic)
	const typeOptions = allTypes;

	// Autocomplete uchun unit options
	const unitOptions = units.map((u) => ({ value: u.id, label: `${u.name} (${u.code})` }));

	// Autocomplete uchun size options (dynamic)
	const sizeOptions = allSizes;

	// Yangi bo'lim (category) qo'shish
	const handleCreateCategory = async (name: string) => {
		try {
			const result = await createProductCategory.mutateAsync({
				name,
				is_delete: false,
			});
			return { id: result.id, name: result.name };
		} catch {
			return null;
		}
	};

	// Yangi kategoriya turi qo'shish (tanlangan bo'lim bilan)
	const handleCreateBranchCategory = async (name: string) => {
		if (!selectedBranch) return null;
		try {
			const result = await createBranchCategory.mutateAsync({
				name,
				product_branch: selectedBranch,
				is_delete: false,
			});
			await queryClient.invalidateQueries({
				queryKey: PRODUCT_BRANCH_CATEGORY_KEYS.list({
					limit: 20,
					is_delete: false,
					product_branch: selectedBranch,
				}),
			});
			return { id: result.id, name: result.name };
		} catch {
			return null;
		}
	};

	// Yangi model qo'shish (tanlangan branch_category bilan)
	const handleCreateModel = async (name: string) => {
		if (!selectedBranchCategory) return null;
		try {
			const result = await createModel.mutateAsync({
				name,
				branch_category: selectedBranchCategory,
				is_delete: false,
			});
			// Mos branch_category bo'yicha listni qayta yuklash
			await queryClient.invalidateQueries({
				queryKey: PRODUCT_MODEL_KEYS.list({
					limit: 20,
					is_delete: false,
					branch_category: selectedBranchCategory,
				}),
			});
			return { id: result.id, name: result.name };
		} catch {
			return null;
		}
	};

	// Yangi type qo'shish (tanlangan model bilan)
	const handleCreateType = async (name: string) => {
		if (!selectedModel) return null;
		try {
			const result = await createType.mutateAsync({
				name,
				madel: selectedModel,
				is_delete: false,
			});
			// Mos model bo'yicha listni qayta yuklash
			await queryClient.invalidateQueries({
				queryKey: modelTypeKeys.list({ limit: 20, is_delete: false, madel: selectedModel }),
			});
			return { id: result.id, name: result.name };
		} catch {
			return null;
		}
	};

	// Yangi unit qo'shish (dialog orqali)
	const handleCreateUnitSubmit = async () => {
		if (!newUnitName || !newUnitCode) return;
		setIsCreatingUnit(true);
		try {
			const result = await createUnit.mutateAsync({
				name: newUnitName,
				code: newUnitCode.toLowerCase(),
				is_active: true,
			});
			// Listni qayta yuklash
			await queryClient.invalidateQueries({
				queryKey: unitKeys.list({ limit: 20, is_active: true }),
			});
			// Yangi yaratilgan unitni tanlash
			productForm.setValue('unit', result.id);
			setIsUnitDialogOpen(false);
			setNewUnitName('');
			setNewUnitCode('');
		} catch {
			// error handled in hook
		} finally {
			setIsCreatingUnit(false);
		}
	};

	// Yangi size qo'shish (tanlangan type va unit bilan)
	const handleCreateSize = async (sizeValue: string) => {
		if (!selectedType) return null;
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
				product_type: selectedType,
				size: parseFloat(sizeValue) || 0,
				unit: selectedUnit, // O'lchov birligi (Unit ID)
				is_delete: false,
			});
			// Mos type bo'yicha listni qayta yuklash
			await queryClient.invalidateQueries({
				queryKey: productTypeSizeKeys.list({ limit: 20, is_delete: false, product_type: selectedType }),
			});
			return { id: result.id, name: String(result.size) };
		} catch {
			return null;
		}
	};

	// Branch o'zgarganda model va type ni tozalash
	useEffect(() => {
		productForm.setValue('model', 0);
		productForm.setValue('type', 0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedBranch]);

	// Model o'zgarganda type va size ni tozalash
	useEffect(() => {
		productForm.setValue('type', 0);
		productForm.setValue('size', 0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedModel]);

	// Type o'zgarganda size ni tozalash
	useEffect(() => {
		productForm.setValue('size', 0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedType]);

	// ProductTypeSize tanlanganda mos unit ni default qilish
	useEffect(() => {
		if (selectedSize) {
			const selectedProductTypeSize = productTypeSizes.find((s) => s.id === selectedSize);
			if (selectedProductTypeSize?.unit) {
				productForm.setValue('unit', selectedProductTypeSize.unit);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedSize, productTypeSizes]);

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('uz-UZ').format(value);
	};

	// Dollar formatlagich (use shared formatter)
	const formatDollar = (value: number) => formatNumber(value);

	// Branch o'zgarganda branch_category va model ni tozalash
	useEffect(() => {
		if (isProductDialogOpen) {
			productForm.setValue('branch_category', 0);
			productForm.setValue('model', 0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedBranch, isProductDialogOpen]);

	// Branch category o'zgarganda model ni tozalash
	useEffect(() => {
		if (isProductDialogOpen) {
			productForm.setValue('model', 0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedBranchCategory, isProductDialogOpen]);
	// Ichki kirimda sklad_outgoing bo'yicha tanlangan mahsulot qoldig'ini olish
	const [skladStockCount, setSkladStockCount] = useState<number | null>(null);
	const [isLoadingStock, setIsLoadingStock] = useState(false);
	const checkSkladStock = async () => {
		const products = await productService.getProducts({
			limit: 1,
			model: selectedModel,
			type: selectedType,
			branch: selectedBranch,
			branch_category: selectedBranchCategory,
			filial: selectedFilial,
			size: selectedSize,
		});
		const product = products.results?.[0];

		if (invoiceType !== PurchaseInvoiceType.INTERNAL || !product || !selectedSkladId) {
			setSkladStockCount(null);
			return;
		}
		setIsLoadingStock(true);
		productService
			.getProductStock({ product: product?.id, sklad: selectedSkladId })
			.then((res) => setSkladStockCount(res.count ?? 0))
			.catch(() => setSkladStockCount(null))
			.finally(() => setIsLoadingStock(false));
	};
	useEffect(() => {
		if (
			invoiceType === PurchaseInvoiceType.INTERNAL &&
			selectedSkladId &&
			selectedModel &&
			selectedType &&
			selectedBranch &&
			selectedBranchCategory &&
			selectedSize
		) {
			checkSkladStock();
		}
	}, [selectedSize, selectedSkladId, invoiceType]);

	// Tahrirlash modalida INTERNAL faktura uchun sklad qoldig'ini olish
	const [editSkladStockCount, setEditSkladStockCount] = useState<number | null>(null);
	const [isLoadingEditStock, setIsLoadingEditStock] = useState(false);
	useEffect(() => {
		const outgoingSkladId = existingInvoice
			? ((existingInvoice as unknown as Record<string, unknown>).sklad_outgoing as number)
			: null;
		if (!editingProduct || existingInvoice?.type !== PurchaseInvoiceType.INTERNAL || !outgoingSkladId) {
			setEditSkladStockCount(null);
			return;
		}
		setIsLoadingEditStock(true);
		productService
			.getProducts({
				limit: 1,
				model: editingProduct.model,
				type: editingProduct.type,
				branch: editingProduct.branch,
				branch_category: editingProduct.branch_category,
				size: editingProduct.size,
			})
			.then(async (res) => {
				const product = res.results?.[0];
				if (!product) {
					setEditSkladStockCount(null);
					return;
				}
				const stock = await productService.getProductStock({ product: product.id, sklad: outgoingSkladId });
				setEditSkladStockCount(stock?.count ?? null);
			})
			.catch(() => setEditSkladStockCount(null))
			.finally(() => setIsLoadingEditStock(false));
	}, [editingProduct, existingInvoice]);

	// Mahsulot qo'shish dialogini ochish
	const openProductDialog = () => {
		productForm.reset({
			product: 0,
			reserve_limit: 100,
			is_weight: false,
			branch: 0,
			branch_category: 0,
			model: 0,
			type: 0,
			size: 0,
			unit: 0,
			count: 0,
			real_price: 0,
			min_price: 0,
			note: '',
		});
		setIsProductDialogOpen(true);
	};

	// Mahsulotni listga qo'shish
	const handleAddProduct = async (values: ProductFormData) => {
		// Ichki kirimda sklad qoldig'idan ko'p kiritib bo'lmaydi
		if (
			invoiceType === PurchaseInvoiceType.INTERNAL &&
			skladStockCount !== null &&
			values.count > skladStockCount
		) {
			productForm.setError('count', {
				type: 'manual',
				message: `Ombordan kirita oladigan maksimal miqdor: ${skladStockCount}`,
			});
			return;
		}
		const branch = categories.find((c) => c.id === values.branch);
		const branchCategory = branchCategories.find((c) => c.id === values.branch_category);
		const model = models.find((m) => m.id === values.model);
		const type = types.find((t) => t.id === values.type);
		const size = productTypeSizes.find((s) => s.id === values.size);
		const unit = units.find((u) => u.id === values.unit);

		// Product nomini branch + kategoriya turi + model + type + size orqali yasaymiz
		const productName =
			[branch?.name, branchCategory?.name, model?.name, type?.name, size ? String(size.size) : undefined]
				.filter(Boolean)
				.join(' ') || 'Mahsulot';

		const newProduct: AddedProduct = {
			...values,
			id: tempProductId,
			product_name: productName,
			branch_name: branch?.name,
			branch_category_name: branchCategory?.name,
			model_name: model?.name,
			type_name: type?.name,
			size_name: size ? String(size.size) : undefined,
			unit_name: unit?.name,
		};

		// Agar mavjud fakturani tahrirlayotgan bo'lsak (id mavjud), har bir mahsulot qo'shganda product-history ga yozish
		if (id && existingInvoice) {
			try {
				const invoiceFormValues = invoiceForm.getValues();
				await createProductHistory.mutateAsync({
					date: invoiceFormValues.date,
					reserve_limit: values.reserve_limit,
					purchase_invoice: Number(id),
					branch: values.branch,
					branch_category: values.branch_category,
					model: values.model,
					type: values.type,
					size: values.size,
					unit: values.unit,
					is_weight: values.is_weight,
					count: values.count,
					real_price: values.real_price,
					unit_price: values.real_price,
					wholesale_price: 0,
					min_price: values.min_price,
					note: values.note,
					filial_id: invoiceFormValues.filial,
				});
			} catch (error) {
				// Error handled in hook toast
				return; // Mahsulot qo'shmaslik, chunki product-history yaratilmadi
			}
		}

		setAddedProducts([...addedProducts, newProduct]);
		setTempProductId(tempProductId + 1);
		setIsProductDialogOpen(false);
		setSkladStockCount((prev) => (prev !== null ? prev - values.count : null)); // Qo'shilgan mahsulot miqdorini sklad qoldig'idan ayirish
		// Har bir listni yangilash — keyingi ochishda yangi ma'lumotlar bo'ladi
		queryClient.invalidateQueries({ queryKey: PRODUCT_CATEGORY_KEYS.lists() });
		queryClient.invalidateQueries({ queryKey: PRODUCT_BRANCH_CATEGORY_KEYS.lists() });
		queryClient.invalidateQueries({ queryKey: PRODUCT_MODEL_KEYS.lists() });
		queryClient.invalidateQueries({ queryKey: modelTypeKeys.lists() });
		queryClient.invalidateQueries({ queryKey: productTypeSizeKeys.lists() });
	};

	// Mahsulotni listdan o'chirish
	const handleRemoveProduct = (id: number) => {
		setAddedProducts(addedProducts.filter((p) => p.id !== id));
	};

	const [deletingProductHistoryId, setDeletingProductHistoryId] = useState<number | null>(null);

	const handleDeleteProductHistory = (id: number) => {
		setDeletingProductHistoryId(id);
	};

	const confirmDeleteProductHistory = async () => {
		if (deletingProductHistoryId === null) return;
		await deleteProductHistoryMutation.mutateAsync(deletingProductHistoryId);
		setDeletingProductHistoryId(null);
	};

	// Jami summani hisoblash
	const totalSum = addedProducts.reduce((sum, p) => sum + p.count * p.real_price, 0);

	// Fakturani saqlash
	const handleSubmit = async (values: InvoiceFormData) => {
		if (productHistories.length === 0 && addedProducts.length === 0) {
			return;
		}

		// Agar EXTERNAL bo'lsa, modal ochish
		if (values.type === PurchaseInvoiceType.EXTERNAL) {
			setPendingInvoiceData(values);
			setIsPaymentDialogOpen(true);
			return;
		}

		// INTERNAL uchun oddiy saqlash
		await saveInvoice(values);
	};

	// Bekor qilish (o'chirish) funksiyasi
	const handleBekorQilish = async () => {
		if (!id || !existingInvoice) return;
		try {
			await deletePurchaseInvoice.mutateAsync(Number(id));
			navigate('/purchase-invoices');
		} catch {
			// xato toast hook orqali chiqadi
		}
		setIsCancelDialogOpen(false);
	};

	// Fakturani saqlash funksiyasi
	const saveInvoice = async (values: InvoiceFormData, paymentData?: PaymentFormData) => {
		setIsSubmitting(true);

		try {
			const productCount = productHistories.length || addedProducts.length;
			const productSum = productHistories.length
				? productHistories.reduce((sum, p) => {
						const price = typeof p.real_price === 'string' ? parseFloat(p.real_price) : p.real_price;
						return sum + p.count * (price || 0);
					}, 0)
				: totalSum;

			let invoiceId: number;

			// Prepare payload based on type
			const payload: CreatePurchaseInvoicePayload = {
				type: values.type ?? PurchaseInvoiceType.EXTERNAL,
				filial: values.filial,
				sklad: values.sklad,
				date: values.date,
				employee: values.employee,
				product_count: productCount,
				all_product_summa: productSum,
				is_karzinka: false,
				...(paymentData && {
					given_summa_total_dollar: paymentData.given_summa_total_dollar,
					given_summa_dollar: paymentData.given_summa_dollar,
					given_summa_naqt: paymentData.given_summa_naqt,
					given_summa_kilik: paymentData.given_summa_kilik,
					given_summa_terminal: paymentData.given_summa_terminal,
					given_summa_transfer: paymentData.given_summa_transfer,
					total_debt: paymentData.total_debt,
				}),
			};

			// Add supplier or sklad_outgoing based on type
			if (values.type === PurchaseInvoiceType.EXTERNAL) {
				payload.supplier = values.supplier;
			} else {
				payload.sklad_outgoing = values.sklad_outgoing;
			}

			if (id && existingInvoice) {
				// Mavjud fakturani tasdiqlash (done API)
				await donePurchaseInvoice.mutateAsync({
					id: Number(id),
					data: payload,
				});
				invoiceId = Number(id);
			} else {
				// Yangi faktura yaratish
				const invoice = await createPurchaseInvoice.mutateAsync(payload);
				invoiceId = invoice.id;

				// Har bir mahsulotni ProductHistory ga qo'shish (faqat yangi faktura uchun)
				for (const product of addedProducts) {
					await createProductHistory.mutateAsync({
						date: values.date,
						reserve_limit: product.reserve_limit,
						purchase_invoice: invoiceId,
						branch: product.branch,
						branch_category: product.branch_category,
						model: product.model,
						type: product.type,
						size: product.size,
						unit: product.unit,
						is_weight: product.is_weight,
						count: product.count,
						real_price: product.real_price,
						unit_price: product.real_price,
						wholesale_price: 0,
						min_price: product.min_price,
						note: product.note,
						filial_id: values.filial,
					});
				}
			}

			navigate('/purchase-invoices');
		} catch {
			// handled in hooks
		} finally {
			setIsSubmitting(false);
		}
	};

	// Payment modalda saqlash
	const handlePaymentSubmit = async (paymentValues: PaymentFormData) => {
		if (!pendingInvoiceData) return;
		setIsPaymentDialogOpen(false);
		await saveInvoice(pendingInvoiceData, paymentValues);
		setPendingInvoiceData(null);
	};

	// Id bo'lganda yuklanish va topilmadi
	if (id && isLoadingInvoice) {
		return (
			<div className='space-y-6'>
				<div className='flex items-center gap-4'>
					<Skeleton className='h-7 w-10' />
					<Skeleton className='h-8 w-64' />
				</div>
				<Skeleton className='h-48 w-full' />
				<Skeleton className='h-76 w-full' />
			</div>
		);
	}
	if (id && !existingInvoice) {
		return (
			<div className='flex flex-col items-center justify-center py-20'>
				<FileText className='h-16 w-16 text-muted-foreground/50 mb-4' />
				<h2 className='text-xl font-semibold mb-2'>Faktura topilmadi</h2>
				<p className='text-muted-foreground mb-4'>Ushbu ID bilan faktura mavjud emas</p>
				<Button onClick={() => navigate('/purchase-invoices')}>
					<ArrowLeft className='mr-2 h-4 w-4' />
					Orqaga qaytish
				</Button>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			{/* Faktura ma'lumotlari - existingInvoice bo'lsa Show sahifasidagidek faqat o'qiladigan */}
			<Card>
				<CardHeader className='flex flex-row items-center justify-between flex-wrap gap-2'>
					<CardTitle className='flex items-center gap-2 text-base'>
						{(existingInvoice?.type ?? invoiceType) === PurchaseInvoiceType.INTERNAL
							? existingInvoice
								? 'Ichki kirim'
								: 'Ichki kirim yaratish'
							: existingInvoice
								? 'Tashqi kirim'
								: 'Tashqi kirim yaratish'}
					</CardTitle>
					{existingInvoice?.is_karzinka && (
						<CardDescription className='flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2'>
							<ShoppingCart className='h-4 w-4 shrink-0' />
							Bu faktura karzinkada — hali tasdiqlanmagan. Mahsulotlar qo'shilgan, amalga oshirish yoki
							"Bekor qilish" orqali o'chirish mumkin.
						</CardDescription>
					)}
					<div className='flex items-center gap-2'>
						<Button variant='outline' onClick={() => navigate('/purchase-invoices')}>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Orqaga
						</Button>
						{existingInvoice && (
							<Button variant='outline' size='sm' onClick={() => setIsEditModalOpen(true)}>
								<Pencil className='h-4 w-4 mr-2' />
								Tahrirlash
							</Button>
						)}
						{existingInvoice && existingInvoice.is_karzinka && (
							<Button
								variant='outline'
								size='sm'
								onClick={() => setIsCancelDialogOpen(true)}
								className='text-destructive hover:text-destructive'
							>
								<Trash2 className='h-4 w-4 mr-2' />
								Bekor qilish
							</Button>
						)}
						{existingInvoice && (
							<>
								{existingInvoice.is_karzinka && (
									<Badge
										variant='outline'
										className='text-xs border-amber-500 text-amber-700 bg-amber-50'
									>
										<ShoppingCart className='h-3.5 w-3.5 mr-1' />
										Karzinka
									</Badge>
								)}
								<Badge
									variant='default'
									className={`text-xs ${existingInvoice.type === PurchaseInvoiceType.EXTERNAL ? 'bg-green-600' : 'bg-blue-600'}`}
								>
									{existingInvoice.type === PurchaseInvoiceType.EXTERNAL
										? PurchaseInvoiceTypeLabels[PurchaseInvoiceType.EXTERNAL]
										: PurchaseInvoiceTypeLabels[PurchaseInvoiceType.INTERNAL]}
								</Badge>
							</>
						)}
						<Button
							disabled={productHistories.length === 0 || isSubmitting}
							onClick={invoiceForm.handleSubmit(handleSubmit, (errors) => {
								const errorMessages = Object.entries(errors)
									.map(([key, value]) => `${key}: ${value?.message}`)
									.join('\n');
								if (errorMessages) {
									alert(`Iltimos, quyidagi maydonlarni to'ldiring:\n${errorMessages}`);
								}
							})}
						>
							{isSubmitting ? (
								<Loader2 className='h-4 w-4 mr-2 animate-spin' />
							) : (
								<CheckCircle2 className='h-4 w-4 mr-2' />
							)}
							Tasdiqlash
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{existingInvoice ? (
						<>
							<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-1'>
								{/* Sana */}
								<div className='flex items-baseline gap-1.5'>
									<p className='text-xs text-muted-foreground'>Sana:</p>
									<p className='font-medium text-xs'>
										{moment(existingInvoice.date).format('DD.MM.YYYY')}
									</p>
								</div>

								{/* Ichki kirim uchun: Qaysi ombordan va Qaysi omborga */}
								{existingInvoice.type === PurchaseInvoiceType.INTERNAL ? (
									<>
										<div className='flex items-baseline gap-1.5'>
											<p className='text-xs text-muted-foreground'>Ombordan:</p>
											<p className='font-medium text-xs'>
												{(
													existingInvoice as unknown as {
														sklad_outgoing_detail?: { name: string };
													}
												).sklad_outgoing_detail?.name || '-'}
											</p>
										</div>
										<div className='flex items-baseline gap-1.5'>
											<p className='text-xs text-muted-foreground'>Omborga:</p>
											<p className='font-medium text-xs'>
												{existingInvoice.sklad_detail?.name || '-'}
											</p>
										</div>
									</>
								) : (
									<>
										{/* Tashqi kirim uchun: Ta'minotchi va Ombor */}
										<div className='flex items-baseline gap-1.5'>
											<p className='text-xs text-muted-foreground'>Ta'minotchi:</p>
											<p className='font-medium text-xs'>
												{existingInvoice.supplier_detail?.name || '-'}
											</p>
										</div>
										<div className='flex items-baseline gap-1.5'>
											<p className='text-xs text-muted-foreground'>Ombor:</p>
											<p className='font-medium text-xs'>
												{existingInvoice.sklad_detail?.name || '-'}
											</p>
										</div>
									</>
								)}
								<div className='flex items-baseline gap-1.5'>
									<p className='text-xs text-muted-foreground'>Xodim:</p>
									<p className='font-medium text-xs'>
										{existingInvoice.employee_detail?.full_name ||
											(existingInvoice.is_karzinka ? 'Kiritilmagan' : '-')}
									</p>
								</div>
								<div className='flex items-baseline gap-1.5'>
									<p className='text-xs text-muted-foreground'>Mahsulotlar:</p>
									<p className='font-medium text-xs'>{existingInvoice.product_count} ta</p>
								</div>
								<div className='flex items-baseline gap-1.5'>
									<p className='text-xs text-muted-foreground'>Jami summa:</p>
									<p className='font-medium text-xs text-emerald-600'>
										${formatDollar(existingInvoice.all_product_summa)}
									</p>
								</div>
							</div>

							{/* To'lov ma'lumotlari */}
							{(existingInvoice.given_summa_dollar > 0 ||
								existingInvoice.given_summa_naqt > 0 ||
								existingInvoice.given_summa_terminal > 0 ||
								existingInvoice.given_summa_transfer > 0) && (
								<div className='mt-1 pt-1 border-t'>
									<h4 className='font-medium text-xs mb-2'>To'lov ma'lumotlari</h4>
									<div className='grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2'>
										{existingInvoice.given_summa_dollar > 0 && (
											<div className='flex items-baseline gap-1.5'>
												<p className='text-xs text-muted-foreground'>Dollar:</p>
												<p className='font-semibold text-xs text-green-600'>
													${formatDollar(existingInvoice.given_summa_dollar)}
												</p>
											</div>
										)}
										{existingInvoice.given_summa_naqt > 0 && (
											<div className='flex items-baseline gap-1.5'>
												<p className='text-xs text-muted-foreground'>Naqd:</p>
												<p className='font-semibold text-xs text-blue-600'>
													{formatCurrency(existingInvoice.given_summa_naqt)} so'm
												</p>
											</div>
										)}
										{existingInvoice.given_summa_terminal > 0 && (
											<div className='flex items-baseline gap-1.5'>
												<p className='text-xs text-muted-foreground'>Terminal:</p>
												<p className='font-semibold text-xs text-purple-600'>
													{formatCurrency(existingInvoice.given_summa_terminal)} so'm
												</p>
											</div>
										)}
										{existingInvoice.given_summa_transfer > 0 && (
											<div className='flex items-baseline gap-1.5'>
												<p className='text-xs text-muted-foreground'>Transfer:</p>
												<p className='font-semibold text-xs text-orange-600'>
													{formatCurrency(existingInvoice.given_summa_transfer)} so'm
												</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Qancha to'lanmagan - faqat tashqi kirim uchun */}
							{existingInvoice.type === PurchaseInvoiceType.EXTERNAL &&
								existingInvoice.all_product_summa > 0 &&
								(() => {
									const allProductSumma = parseFloat(String(existingInvoice.all_product_summa || 0));
									const givenSummaTotal = parseFloat(
										String(existingInvoice.given_summa_total_dollar || 0),
									);
									const remaining = allProductSumma - givenSummaTotal;
									return remaining > 0 ? (
										<div className='mt-1 pt-1 border-t'>
											<div className='grid grid-cols-2 gap-4'>
												<div className='flex items-baseline gap-1.5'>
													<p className='text-xs text-muted-foreground'>Jami to'langan:</p>
													<p className='font-semibold text-emerald-600'>
														${formatDollar(givenSummaTotal)}
													</p>
												</div>
												<div className='flex items-baseline gap-1.5'>
													<p className='text-xs text-muted-foreground'>Qancha to'lanmagan:</p>
													<p className='font-semibold text-red-600'>
														${formatDollar(remaining)}
													</p>
												</div>
											</div>
										</div>
									) : null;
								})()}

							{/* Qarz ma'lumotlari */}
							{(existingInvoice.total_debt_old > 0 ||
								existingInvoice.total_debt > 0 ||
								existingInvoice.total_debt_today > 0) && (
								<div className='mt-1 pt-1 border-t'>
									<h4 className='font-medium text-xs mb-2'>Qarz ma'lumotlari</h4>
									<div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
										<div className='flex items-baseline gap-1.5'>
											<p className='text-xs text-muted-foreground'>Eski qarz:</p>
											<p className='font-semibold'>
												${formatDollar(existingInvoice.total_debt_old)}
											</p>
										</div>
										<div className='flex items-baseline gap-1.5'>
											<p className='text-xs text-muted-foreground'>Qolgan qarz:</p>
											<p className='font-semibold text-red-600'>
												${formatDollar(existingInvoice.total_debt)}
											</p>
										</div>
										<div className='flex items-baseline gap-1.5'>
											<p className='text-xs text-muted-foreground'>Bugungi qarz:</p>
											<p className='font-semibold text-amber-600'>
												${formatDollar(existingInvoice.total_debt_today)}
											</p>
										</div>
									</div>
								</div>
							)}
						</>
					) : (
						<Form {...invoiceForm}>
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
								<FormField
									control={invoiceForm.control}
									name='date'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Sana</FormLabel>
											<FormControl>
												<DatePicker
													date={
														field.value
															? moment(field.value, 'YYYY-MM-DD').toDate()
															: undefined
													}
													onDateChange={(d) =>
														field.onChange(d ? moment(d).format('YYYY-MM-DD') : '')
													}
													placeholder='Sana'
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={invoiceForm.control}
									name='type'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Turi</FormLabel>
											<FormControl>
												<Autocomplete
													options={[
														{
															value: PurchaseInvoiceType.EXTERNAL,
															label: PurchaseInvoiceTypeLabels[
																PurchaseInvoiceType.EXTERNAL
															],
														},
														{
															value: PurchaseInvoiceType.INTERNAL,
															label: PurchaseInvoiceTypeLabels[
																PurchaseInvoiceType.INTERNAL
															],
														},
													]}
													value={field.value}
													onValueChange={(v) => field.onChange(v as PurchaseInvoiceType)}
													placeholder='Tanlang'
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{invoiceType === PurchaseInvoiceType.EXTERNAL && (
									<FormField
										control={invoiceForm.control}
										name='supplier'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Ta'minotchi</FormLabel>
												<FormControl>
													<Autocomplete
														options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
														value={field.value || undefined}
														onValueChange={(v) => field.onChange(Number(v))}
														placeholder='Tanlang'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
								{invoiceType === PurchaseInvoiceType.INTERNAL && (
									<FormField
										control={invoiceForm.control}
										name='sklad_outgoing'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Qaysi ombor</FormLabel>
												<FormControl>
													<Autocomplete
														options={sklads.map((s) => ({ value: s.id, label: s.name }))}
														value={field.value || undefined}
														onValueChange={(v) => field.onChange(Number(v))}
														placeholder='Tanlang'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
								<FormField
									control={invoiceForm.control}
									name='filial'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Filial</FormLabel>
											<FormControl>
												<Autocomplete
													options={companies.map((c) => ({ value: c.id, label: c.name }))}
													value={field.value || undefined}
													onValueChange={(v) => field.onChange(Number(v))}
													placeholder='Tanlang'
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={invoiceForm.control}
									name='sklad'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Ombor</FormLabel>
											<FormControl>
												<Autocomplete
													options={sklads.map((s) => ({ value: s.id, label: s.name }))}
													value={field.value || undefined}
													onValueChange={(v) => field.onChange(Number(v))}
													placeholder='Omborni tanlang'
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={invoiceForm.control}
									name='employee'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Xodim</FormLabel>
											<FormControl>
												<Autocomplete
													options={users.map((u) => ({
														value: u.id,
														label: u.full_name || u.username,
													}))}
													value={field.value || undefined}
													onValueChange={(v) => field.onChange(Number(v))}
													placeholder='Tanlang'
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</Form>
					)}
				</CardContent>
			</Card>

			{/* Mahsulotlar - pastda full width */}
			<Card>
				<CardHeader className='pb-3'>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='flex items-center gap-2 text-base'>
								<Package className='h-5 w-5' />
								Mahsulotlar
							</CardTitle>
						</div>
						<Button onClick={openProductDialog} size='sm' className='gap-2'>
							<Plus className='h-4 w-4' />
							Qo'shish
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{isProductHistoriesLoading ? (
						<div className='flex items-center justify-center py-10'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
						</div>
					) : productHistories.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg'>
							<Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
							<p className='text-muted-foreground'>Mahsulotlar qo'shilmagan</p>
						</div>
					) : (
						<>
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='w-[50px]'>#</TableHead>
											<TableHead>Bo'lim</TableHead>
											<TableHead>Kategoriya turi</TableHead>
											<TableHead>Brend</TableHead>
											<TableHead>Mahsulot</TableHead>
											<TableHead>O'lcham</TableHead>
											<TableHead className='text-right'>Miqdori</TableHead>
											<TableHead className='text-right'>Narxi ($)</TableHead>
											<TableHead className='text-right'>Jami ($)</TableHead>
											{existingInvoice && <TableHead className='w-[70px]'>Amallar</TableHead>}
										</TableRow>
									</TableHeader>
									<TableBody>
										{productHistories.map((p, index) => {
											const realPrice =
												typeof p.real_price === 'string'
													? parseFloat(p.real_price)
													: p.real_price;
											return (
												<TableRow key={`history-${p.id}`}>
													<TableCell className='text-muted-foreground'>{index + 1}</TableCell>
													<TableCell>{p.branch_detail?.name || '-'}</TableCell>
													<TableCell>{p.branch_category_detail?.name ?? '-'}</TableCell>
													<TableCell>{p.model_detail?.name || '-'}</TableCell>
													<TableCell className='font-medium'>
														{p.type_detail?.name || '-'}
													</TableCell>
													<TableCell>
														{p.size_detail?.size ?? '-'} -{p.size_detail?.unit_code ?? ''}
													</TableCell>
													<TableCell className='text-right'>
														{p.count} {p.size_detail?.unit_code ?? ''}
													</TableCell>
													<TableCell className='text-right'>
														$
														{formatDollar(
															typeof p.real_price === 'string'
																? parseFloat(p.real_price)
																: (p.real_price ?? 0),
														)}
													</TableCell>

													<TableCell className='text-right font-semibold'>
														${formatDollar(p.count * (realPrice || 0))}
													</TableCell>
													{existingInvoice && (
														<TableCell className='min-w-24'>
															<Button
																variant='ghost'
																size='icon'
																onClick={() => setViewingProduct(p)}
																title="Ko'rish"
																className=' text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30'
															>
																<Eye className='h-4 w-4' />
															</Button>
															<Button
																variant='ghost'
																size='icon'
																onClick={() => setEditingProduct(p)}
																title='Tahrirlash'
																className=' text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-950/30'
															>
																<Pencil className='h-4 w-4' />
															</Button>
															<Button
																variant='ghost'
																size='icon'
																onClick={() => handleDeleteProductHistory(p.id)}
																title="O'chirish"
																className=' text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30'
															>
																<Trash2 className='h-4 w-4' />
															</Button>
														</TableCell>
													)}
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>

							{/* Jami */}
							<div className='mt-1 fle1 justify-end'>
								<div className='bg-muted rounded-lg px-3 py-2.5'>
									<div className='flex items-center gap-4 text-xs'>
										<div className='flex items-center gap-2'>
											<span className='text-xs text-muted-foreground'>Mahsulotlar:</span>
											<Badge variant='outline' className='h-5 px-2 text-xs'>
												{productHistories.length} ta
											</Badge>
										</div>
										<div className='h-4 w-px bg-border' />
										<div className='flex items-center gap-2'>
											<span className='text-xs text-muted-foreground'>Jami miqdor:</span>
											<span className='font-medium text-xs'>
												{formatCurrency(productHistories.reduce((sum, p) => sum + p.count, 0))}
											</span>
										</div>
										<div className='h-4 w-px bg-border' />
										<div className='flex items-center gap-2'>
											<span className='text-xs text-muted-foreground'>Jami summa:</span>
											<span className='text-base font-bold text-green-600'>
												$
												{formatDollar(
													productHistories.reduce((sum, p) => {
														const price =
															typeof p.real_price === 'string'
																? parseFloat(p.real_price)
																: p.real_price;
														return sum + p.count * (price || 0);
													}, 0),
												)}
											</span>
										</div>
									</div>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Mahsulot qo'shish modal */}
			<Dialog
				open={isProductDialogOpen}
				onOpenChange={(open) => {
					setIsProductDialogOpen(open);
					if (!open) {
						productForm.reset({
							product: 0,
							reserve_limit: 100,
							is_weight: false,
							branch: 0,
							branch_category: 0,
							model: 0,
							type: 0,
							size: 0,
							unit: 0,
							count: 0,
							real_price: 0,
							min_price: 0,
							note: '',
						});
						setSkladStockCount(null);
					}
				}}
			>
				<DialogContent className='w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle className='text-xl'>Yangi mahsulot qo'shish</DialogTitle>
					</DialogHeader>

					<Form {...productForm}>
						<form onSubmit={productForm.handleSubmit(handleAddProduct)} className='space-y-3'>
							{/* Bo'lim va Kategoriya turi */}
							<div className='grid grid-cols-2 gap-4'>
								<FormField
									control={productForm.control}
									name='branch'
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
													isLoading={isCategoriesLoading}
													onSearchChange={(search) => setCategorySearch(search)}
													onScrollToBottom={() => {
														if (
															categoriesData?.pagination &&
															categoryPage < categoriesData.pagination.lastPage
														) {
															setCategoryPage((prev) => prev + 1);
														}
													}}
													hasMore={
														categoriesData?.pagination
															? categoryPage < categoriesData.pagination.lastPage
															: false
													}
													isLoadingMore={isCategoriesLoading && categoryPage > 1}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={productForm.control}
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
														selectedBranch
															? 'Kategoriya turini tanlang'
															: "Avval bo'limni tanlang"
													}
													searchPlaceholder='Kategoriya turi qidirish...'
													emptyText='Kategoriya turi topilmadi'
													disabled={!selectedBranch}
													isLoading={isBranchCategoriesLoading}
													allowCreate={!!selectedBranch}
													onCreateNew={handleCreateBranchCategory}
													createText="Yangi kategoriya turi qo'shish"
													onSearchChange={(search) => setBranchCategorySearch(search)}
													onScrollToBottom={() => {
														if (
															branchCategoriesData?.pagination &&
															branchCategoryPage <
																branchCategoriesData.pagination.lastPage
														) {
															setBranchCategoryPage((prev) => prev + 1);
														}
													}}
													hasMore={
														branchCategoriesData?.pagination
															? branchCategoryPage <
																branchCategoriesData.pagination.lastPage
															: false
													}
													isLoadingMore={isBranchCategoriesLoading && branchCategoryPage > 1}
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
									control={productForm.control}
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
														selectedBranchCategory
															? 'Brendni tanlang'
															: selectedBranch
																? 'Avval kategoriya turini tanlang'
																: "Avval bo'limni tanlang"
													}
													searchPlaceholder='Brend qidirish...'
													emptyText='Brend topilmadi'
													disabled={!selectedBranchCategory}
													isLoading={isModelsLoading}
													allowCreate={!!selectedBranchCategory}
													onCreateNew={handleCreateModel}
													createText="Yangi brend qo'shish"
													onSearchChange={(search) => setModelSearch(search)}
													onScrollToBottom={() => {
														if (
															modelsData?.pagination &&
															modelPage < modelsData.pagination.lastPage
														) {
															setModelPage((prev) => prev + 1);
														}
													}}
													hasMore={
														modelsData?.pagination
															? modelPage < modelsData.pagination.lastPage
															: false
													}
													isLoadingMore={isModelsLoading && modelPage > 1}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={productForm.control}
									name='type'
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Mahsulot nomi <span className='text-destructive'>*</span>
											</FormLabel>
											<FormControl>
												<Autocomplete
													options={typeOptions}
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
													isLoading={isTypesLoading}
													allowCreate={!!selectedModel}
													onCreateNew={handleCreateType}
													createText="Yangi mahsulot qo'shish"
													onSearchChange={(search) => setTypeSearch(search)}
													onScrollToBottom={() => {
														if (
															typesData?.pagination &&
															typePage < typesData.pagination.lastPage
														) {
															setTypePage((prev) => prev + 1);
														}
													}}
													hasMore={
														typesData?.pagination
															? typePage < typesData.pagination.lastPage
															: false
													}
													isLoadingMore={isTypesLoading && typePage > 1}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* O'lcham va O'lchov birligi - yopishgan */}
								<FormField
									control={productForm.control}
									name='size'
									render={({ field }) => {
										// Tanlangan ProductTypeSize da unit borligini tekshirish
										const selectedProductTypeSize = productTypeSizes.find(
											(s) => s.id === selectedSize,
										);
										const hasUnitInSize = !!selectedProductTypeSize?.unit;

										return (
											<FormItem>
												<FormLabel>O'lcham</FormLabel>
												<div className='flex'>
													<FormControl>
														<div className='flex w-[200px]'>
															<Autocomplete
																options={sizeOptions}
																value={field.value || undefined}
																onValueChange={(val) => field.onChange(Number(val))}
																placeholder={
																	!selectedType
																		? 'Avval mahsulotni tanlang'
																		: "O'lchamni tanlang"
																}
																searchPlaceholder="O'lcham qidirish..."
																emptyText="O'lcham topilmadi"
																disabled={!selectedType} // Faqat Type tanlanmasa disabled
																isLoading={isSizesLoading}
																allowCreate={!!selectedType}
																onCreateNew={handleCreateSize}
																createText="Yangi o'lcham qo'shish"
																className='rounded-r-none border-r-0'
																onSearchChange={(search) => setSizeSearch(search)}
																onScrollToBottom={() => {
																	if (
																		productTypeSizesData?.pagination &&
																		sizePage <
																			productTypeSizesData.pagination.lastPage
																	) {
																		setSizePage((prev) => prev + 1);
																	}
																}}
																hasMore={
																	productTypeSizesData?.pagination
																		? sizePage <
																			productTypeSizesData.pagination.lastPage
																		: false
																}
																isLoadingMore={isSizesLoading && sizePage > 1}
															/>
														</div>
													</FormControl>
													{/* Unit select - faqat tanlangan size da unit bo'lsa disabled */}
													<Select
														value={selectedUnit ? String(selectedUnit) : ''}
														onValueChange={(val) => {
															if (val === 'create_new') {
																setIsUnitDialogOpen(true);
															} else {
																productForm.setValue('unit', Number(val));
															}
														}}
														disabled={hasUnitInSize} // Faqat size da unit bo'lsa disabled
													>
														<SelectTrigger className='w-[100px] rounded-l-none border-l-0'>
															<SelectValue placeholder='birlik' />
														</SelectTrigger>
														<SelectContent>
															{units.map((u) => (
																<SelectItem key={u.id} value={String(u.id)}>
																	{u.code}
																</SelectItem>
															))}
															<SelectItem value='create_new' className='text-primary'>
																<Plus className='h-3 w-3 inline mr-1' />
																Yangi
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
							</div>

							{/* Zaxira limiti va Miqdori */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 items-end'>
								<FormField
									control={productForm.control}
									name='count'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='flex items-center gap-2'>
												<span>
													Miqdori <span className='text-destructive'>*</span>
												</span>
												{invoiceType === PurchaseInvoiceType.INTERNAL && (
													<span className='text-xs font-normal'>
														{isLoadingStock ? (
															<span className='text-muted-foreground'>
																yuklanmoqda...
															</span>
														) : skladStockCount !== null ? (
															<span className='text-destructive font-semibold'>
																(Qoldiq: {skladStockCount})
															</span>
														) : null}
													</span>
												)}
											</FormLabel>
											<div className='flex'>
												<FormControl>
													<Input
														type='number'
														placeholder=''
														value={field.value === 0 ? '' : field.value}
														onChange={(e) => {
															const val =
																e.target.value === '' ? 0 : Number(e.target.value);
															field.onChange(val);
															if (
																invoiceType === PurchaseInvoiceType.INTERNAL &&
																skladStockCount !== null
															) {
																if (val > skladStockCount) {
																	productForm.setError('count', {
																		type: 'manual',
																		message: `Maksimal miqdor: ${skladStockCount}`,
																	});
																} else {
																	productForm.clearErrors('count');
																}
															}
														}}
														onBlur={field.onBlur}
														name={field.name}
														ref={field.ref}
														min={0}
														max={
															invoiceType === PurchaseInvoiceType.INTERNAL &&
															skladStockCount !== null
																? skladStockCount
																: undefined
														}
														className={`rounded-r-none ${
															invoiceType === PurchaseInvoiceType.INTERNAL &&
															skladStockCount !== null &&
															field.value > skladStockCount
																? 'border-destructive focus-visible:ring-destructive text-destructive'
																: ''
														}`}
													/>
												</FormControl>
												<span className='inline-flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-xs text-muted-foreground'>
													{units.find((u) => u.id === productForm.watch('unit'))?.code ||
														'birlik'}
												</span>
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={productForm.control}
									name='real_price'
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Xaqiqiy narxi <span className='text-destructive'>*</span>
											</FormLabel>
											<div className='flex'>
												<FormControl>
													<NumberInput
														value={String(field.value ?? 0)}
														onChange={(val) =>
															field.onChange(val === '' ? 0 : parseFloat(val))
														}
														placeholder='0.00'
														className='rounded-r-none'
													/>
												</FormControl>
												<span className='inline-flex items-center px-2 bg-green-100 border border-l-0 rounded-r-md text-xs text-green-700'>
													$
												</span>
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Hidden product field - endi ishlatilmaydi */}
							<input type='hidden' {...productForm.register('product')} value={1} />

							{/* Izoh */}
							<FormField
								control={productForm.control}
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

							<DialogFooter className='pt-4'>
								<Button type='submit' size='lg' className='gap-2'>
									<Plus className='h-5 w-5' />
									Kiritish
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Payment Dialog */}
			<Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
				<DialogContent className='sm:max-w-[600px]'>
					<DialogHeader>
						<DialogTitle>To'lov ma'lumotlari</DialogTitle>
					</DialogHeader>
					{/* Dollar kursi */}
					{pendingInvoiceData && (
						<div className='flex items-center gap-2 p-3 bg-muted rounded-lg mb-4'>
							<DollarSign className='h-4 w-4 text-green-600' />
							<span className='text-xs'>Dollar kursi:</span>
							<span className='font-semibold'>{formatCurrency(dollarRateForPayment)} so'm</span>
						</div>
					)}
					{pendingInvoiceData && (
						<Form {...paymentForm}>
							<form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className='space-y-4'>
								{/* Ta'minotchi / Qaysi ombor, Sana, Qarz */}
								<div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg'>
									<div>
										<p className='text-xs text-muted-foreground mb-1'>
											{pendingInvoiceData.type === PurchaseInvoiceType.INTERNAL
												? 'Qaysi ombor'
												: "Ta'minotchi"}
										</p>
										<p className='font-semibold'>
											{pendingInvoiceData.type === PurchaseInvoiceType.INTERNAL
												? sklads.find((s) => s.id === pendingInvoiceData.sklad_outgoing)
														?.name || '-'
												: suppliers.find((s) => s.id === pendingInvoiceData.supplier)?.name ||
													'-'}
										</p>
									</div>
									<div>
										<p className='text-xs text-muted-foreground mb-1'>Sana</p>
										<p className='font-semibold'>
											{moment(pendingInvoiceData.date).format('DD.MM.YYYY')}
										</p>
									</div>
									<div>
										<p className='text-xs text-muted-foreground mb-1'>Qarz</p>
										<p className='font-semibold'>
											{formatCurrency(
												((pendingInvoiceData as unknown as Record<string, unknown>)
													.supplier_debt as number) || 0,
											)}{' '}
											$
										</p>
									</div>
								</div>

								{/* Product count, All product summa, Given summa total dollar */}
								<div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg'>
									<div>
										<p className='text-xs text-muted-foreground mb-1'>Mahsulotlar soni</p>
										<p className='font-semibold text-lg'>
											{productHistories.length || addedProducts.length} ta
										</p>
									</div>
									<div>
										<p className='text-xs text-muted-foreground mb-1'>Jami summa</p>
										<p className='font-semibold text-lg text-green-600'>
											$
											{formatDollar(
												productHistories.length
													? productHistories.reduce((sum, p) => {
															const price =
																typeof p.real_price === 'string'
																	? parseFloat(p.real_price)
																	: p.real_price;
															return sum + p.count * (price || 0);
														}, 0)
													: totalSum,
											)}
										</p>
									</div>
									<div>
										<p className='text-xs text-muted-foreground mb-1'>Jami to'lov ($)</p>
										<FormField
											control={paymentForm.control}
											name='given_summa_total_dollar'
											render={({ field }) => (
												<FormItem>
													<FormControl>
														<NumberInput
															value={String(field.value ?? 0)}
															onChange={(val) =>
																field.onChange(val === '' ? 0 : parseFloat(val))
															}
															placeholder='0.00'
															readOnly
															className='bg-muted cursor-not-allowed'
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>

								{/* To'lov turlari */}
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<FormField
										control={paymentForm.control}
										name='given_summa_dollar'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Dollar to'lovi</FormLabel>
												<FormControl>
													<NumberInput
														value={String(field.value ?? 0)}
														onChange={(val) =>
															field.onChange(val === '' ? 0 : parseFloat(val))
														}
														placeholder='0.00'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={paymentForm.control}
										name='given_summa_naqt'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Naqt to'lovi</FormLabel>
												<FormControl>
													<NumberInput
														value={String(field.value ?? 0)}
														onChange={(val) =>
															field.onChange(val === '' ? 0 : parseFloat(val))
														}
														placeholder='0.00'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={paymentForm.control}
										name='given_summa_kilik'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Kilik to'lovi</FormLabel>
												<FormControl>
													<NumberInput
														value={String(field.value ?? 0)}
														onChange={(val) =>
															field.onChange(val === '' ? 0 : parseFloat(val))
														}
														placeholder='0.00'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={paymentForm.control}
										name='given_summa_terminal'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Terminal to'lovi</FormLabel>
												<FormControl>
													<NumberInput
														value={String(field.value ?? 0)}
														onChange={(val) =>
															field.onChange(val === '' ? 0 : parseFloat(val))
														}
														placeholder='0.00'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={paymentForm.control}
										name='given_summa_transfer'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Transfer to'lovi</FormLabel>
												<FormControl>
													<NumberInput
														value={String(field.value ?? 0)}
														onChange={(val) =>
															field.onChange(val === '' ? 0 : parseFloat(val))
														}
														placeholder='0.00'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<DialogFooter>
									<Button
										type='button'
										variant='outline'
										onClick={() => {
											setIsPaymentDialogOpen(false);
											setPendingInvoiceData(null);
										}}
									>
										Bekor qilish
									</Button>
									<Button type='submit' disabled={isSubmitting}>
										{isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
										Saqlash
									</Button>
								</DialogFooter>
							</form>
						</Form>
					)}
				</DialogContent>
			</Dialog>

			{/* Karzinka: mahsulotni faqat ko'rish (tahrirlash mumkin emas) */}
			<Dialog
				open={!!viewingProduct}
				onOpenChange={(open) => {
					if (!open) setViewingProduct(null);
				}}
			>
				<DialogContent className='sm:max-w-[420px]'>
					<DialogHeader>
						<DialogTitle>Mahsulot ma'lumotlari</DialogTitle>
					</DialogHeader>
					{viewingProduct && (
						<div className='space-y-4'>
							<div className='rounded-lg border p-4 space-y-2 text-xs'>
								<p>
									<span className='text-muted-foreground'>Mahsulot:</span>{' '}
									{viewingProduct.type_detail?.name} — {viewingProduct.model_detail?.name}
									{viewingProduct.size_detail?.size != null &&
										` (${viewingProduct.size_detail.size})`}
								</p>
								<p>
									<span className='text-muted-foreground'>Miqdori:</span> {viewingProduct.count}
								</p>
								<p>
									<span className='text-muted-foreground'>Xaqiqiy narxi:</span> $
									{formatDollar(
										typeof viewingProduct.real_price === 'string'
											? parseFloat(viewingProduct.real_price)
											: (viewingProduct.real_price ?? 0),
									)}
								</p>
								<p>
									<span className='text-muted-foreground'>Dona narxi:</span> $
									{formatDollar(
										typeof viewingProduct.unit_price === 'string'
											? parseFloat(viewingProduct.unit_price)
											: (viewingProduct.unit_price ?? 0),
									)}
								</p>
								<p>
									<span className='text-muted-foreground'>Optom narxi:</span> $
									{formatDollar(
										typeof viewingProduct.wholesale_price === 'string'
											? parseFloat(viewingProduct.wholesale_price)
											: (viewingProduct.wholesale_price ?? 0),
									)}
								</p>
								<p>
									<span className='text-muted-foreground'>Min narx:</span> $
									{formatDollar(
										typeof viewingProduct.min_price === 'string'
											? parseFloat(viewingProduct.min_price)
											: (viewingProduct.min_price ?? 0),
									)}
								</p>
								{viewingProduct.note && (
									<p>
										<span className='text-muted-foreground'>Izoh:</span> {viewingProduct.note}
									</p>
								)}
							</div>
							<DialogFooter>
								<Button variant='outline' onClick={() => setViewingProduct(null)}>
									Yopish
								</Button>
							</DialogFooter>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Yakunlangan mahsulotni tahrirlash modal (faqat karzinka emas fakturalar uchun) */}
			<Dialog
				open={!!editingProduct}
				onOpenChange={(open) => {
					if (!open) setEditingProduct(null);
				}}
			>
				<DialogContent className='sm:max-w-[480px]'>
					<DialogHeader>
						<DialogTitle>Mahsulotni tahrirlash</DialogTitle>
						<DialogDescription>
							{editingProduct && (
								<span>
									{editingProduct.type_detail?.name} — {editingProduct.model_detail?.name}
									{editingProduct.size_detail?.size != null &&
										` (${editingProduct.size_detail.size})`}
								</span>
							)}
						</DialogDescription>
					</DialogHeader>
					{editingProduct && productEditForm && (
						<form
							className='space-y-4'
							onSubmit={(e) => {
								e.preventDefault();
								if (
									existingInvoice?.type === PurchaseInvoiceType.INTERNAL &&
									editSkladStockCount !== null &&
									productEditForm.count > editSkladStockCount
								) {
									return;
								}
								updateProductHistory.mutateAsync(
									{
										id: editingProduct.id,
										data: {
											count: productEditForm.count,
											real_price: productEditForm.real_price,
										},
									},
									{
										onSuccess: () => {
											setEditingProduct(null);
											if (id) {
												queryClient.invalidateQueries({
													queryKey: purchaseInvoiceKeys.detail(Number(id)),
												});
											}
										},
									},
								);
							}}
						>
							<p className='text-xs text-muted-foreground'>
								Faqat miqdor va narxni o'zgartirish mumkin. Boshqa ma'lumotlar o'zgartirilmaydi.
							</p>
							{existingInvoice?.type === PurchaseInvoiceType.INTERNAL && (
								<div className='flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm'>
									<Warehouse className='h-4 w-4 shrink-0 text-destructive' />
									<span className='text-muted-foreground'>
										Ichki kirim ombordan:{' '}
										<span className='font-semibold text-foreground'>
											{sklads.find(
												(s) =>
													s.id ===
													((existingInvoice as unknown as Record<string, unknown>)
														.sklad_outgoing as number),
											)?.name ?? '-'}
										</span>
									</span>
									{isLoadingEditStock ? (
										<span className='ml-auto text-muted-foreground'>yuklanmoqda...</span>
									) : editSkladStockCount !== null ? (
										<span className='ml-auto font-bold text-destructive'>
											Qoldiq: {editSkladStockCount}
										</span>
									) : null}
								</div>
							)}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<label className='text-xs font-medium mb-2 block'>Miqdori</label>
									<Input
										type='number'
										min={1}
										max={
											existingInvoice?.type === PurchaseInvoiceType.INTERNAL &&
											editSkladStockCount !== null
												? editSkladStockCount
												: undefined
										}
										value={productEditForm.count === 0 ? '' : productEditForm.count}
										onChange={(e) => {
											const val = parseInt(e.target.value, 10) || 0;
											setProductEditForm((prev) => (prev ? { ...prev, count: val } : null));
										}}
										className={
											existingInvoice?.type === PurchaseInvoiceType.INTERNAL &&
											editSkladStockCount !== null &&
											productEditForm.count > editSkladStockCount
												? 'border-destructive focus-visible:ring-destructive text-destructive'
												: ''
										}
									/>
									{existingInvoice?.type === PurchaseInvoiceType.INTERNAL &&
										editSkladStockCount !== null &&
										productEditForm.count > editSkladStockCount && (
											<p className='text-xs text-destructive mt-1'>
												Maksimal miqdor: {editSkladStockCount}
											</p>
										)}
								</div>
								<div>
									<label className='text-xs font-medium mb-2 block'>Narxi ($)</label>
									<div className='flex'>
										<NumberInput
											value={String(productEditForm.real_price)}
											onChange={(v) =>
												setProductEditForm((prev) =>
													prev ? { ...prev, real_price: v === '' ? 0 : parseFloat(v) } : null,
												)
											}
											placeholder='0.00'
											className='rounded-r-none'
										/>
										<span className='inline-flex items-center px-2 bg-green-100 border border-l-0 rounded-r-md text-xs text-green-700'>
											$
										</span>
									</div>
								</div>
							</div>
							<DialogFooter className='pt-4'>
								<Button type='button' variant='outline' onClick={() => setEditingProduct(null)}>
									Bekor
								</Button>
								<Button type='submit' disabled={updateProductHistory.isPending}>
									{updateProductHistory.isPending && (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									)}
									Saqlash
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>

			{/* Faktura tahrirlash modal — faqat sana va ombor */}
			<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
				<DialogContent className='sm:max-w-[420px]'>
					<DialogHeader>
						<DialogTitle>
							{existingInvoice?.type === PurchaseInvoiceType.INTERNAL
								? 'Ichki kirim tahrirlash'
								: 'Tashqi kirim tahrirlash'}
						</DialogTitle>
					</DialogHeader>
					{existingInvoice && (
						<form
							className='space-y-4'
							onSubmit={(e) => {
								e.preventDefault();
								const inv = invoiceForm.getValues();
								updatePurchaseInvoice.mutateAsync(
									{
										id: Number(id),
										data: {
											date: inv.date,
											sklad: inv.sklad,
											...(existingInvoice?.type === PurchaseInvoiceType.INTERNAL
												? { sklad_outgoing: inv.sklad_outgoing }
												: { supplier: inv.supplier }),
										},
									},
									{
										onSuccess: () => {
											setIsEditModalOpen(false);
										},
									},
								);
							}}
						>
							<Form {...invoiceForm}>
								<div className='grid grid-cols-1 gap-4'>
									<FormField
										control={invoiceForm.control}
										name='date'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Sana</FormLabel>
												<FormControl>
													<DatePicker
														date={
															field.value
																? moment(field.value, 'YYYY-MM-DD').toDate()
																: undefined
														}
														onDateChange={(d) =>
															field.onChange(d ? moment(d).format('YYYY-MM-DD') : '')
														}
														placeholder='Sana'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{existingInvoice?.type === PurchaseInvoiceType.INTERNAL ? (
										<>
											<FormField
												control={invoiceForm.control}
												name='sklad_outgoing'
												render={({ field }) => (
													<FormItem>
														<FormLabel>Qaysi ombordan</FormLabel>
														<FormControl>
															<Autocomplete
																options={sklads.map((s) => ({
																	value: s.id,
																	label: s.name,
																}))}
																value={field.value || undefined}
																onValueChange={(v) => field.onChange(Number(v))}
																placeholder='Omborni tanlang'
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={invoiceForm.control}
												name='sklad'
												render={({ field }) => (
													<FormItem>
														<FormLabel>Qaysi omborga</FormLabel>
														<FormControl>
															<Autocomplete
																options={sklads.map((s) => ({
																	value: s.id,
																	label: s.name,
																}))}
																value={field.value || undefined}
																onValueChange={(v) => field.onChange(Number(v))}
																placeholder='Omborni tanlang'
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</>
									) : (
										<FormField
											control={invoiceForm.control}
											name='supplier'
											render={({ field }) => (
												<FormItem>
													<FormLabel>Ta'minotchi</FormLabel>
													<FormControl>
														<Autocomplete
															options={suppliers.map((s) => ({
																value: s.id,
																label: s.name,
															}))}
															value={field.value || undefined}
															onValueChange={(v) => field.onChange(Number(v))}
															placeholder="Ta'minotchini tanlang"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}
								</div>
							</Form>

							<DialogFooter className='pt-4'>
								<Button type='button' variant='outline' onClick={() => setIsEditModalOpen(false)}>
									Bekor
								</Button>
								<Button type='submit' disabled={updatePurchaseInvoice.isPending}>
									{updatePurchaseInvoice.isPending && (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									)}
									Saqlash
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>

			{/* Yangi o'lchov birligi qo'shish dialog */}
			<Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
				<DialogContent className='sm:max-w-[400px]'>
					<DialogHeader>
						<DialogTitle>Yangi o'lchov birligi</DialogTitle>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<label className='text-xs font-medium'>Nomi</label>
							<Input
								placeholder='Masalan: Kilogram'
								value={newUnitName}
								onChange={(e) => setNewUnitName(e.target.value)}
							/>
						</div>
						<div className='space-y-2'>
							<label className='text-xs font-medium'>Kodi</label>
							<Input
								placeholder='Masalan: kg'
								value={newUnitCode}
								onChange={(e) => setNewUnitCode(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={() => setIsUnitDialogOpen(false)}>
							Bekor qilish
						</Button>
						<Button
							onClick={handleCreateUnitSubmit}
							disabled={!newUnitName || !newUnitCode || isCreatingUnit}
						>
							{isCreatingUnit && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							Qo'shish
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Mahsulot tarixini o'chirish tasdiq oynasi */}
			<AlertDialog
				open={deletingProductHistoryId !== null}
				onOpenChange={(open) => {
					if (!open) setDeletingProductHistoryId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Mahsulotni o'chirish</AlertDialogTitle>
						<AlertDialogDescription>
							Bu mahsulot fakturadan o'chiriladi. Amalni davom ettirasizmi?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Yo'q</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDeleteProductHistory}
							disabled={deleteProductHistoryMutation.isPending}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{deleteProductHistoryMutation.isPending && (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							)}
							Ha, o'chirish
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Bekor qilish (o'chirish) tasdiq oynasi */}
			<AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Karzinkani bekor qilish</AlertDialogTitle>
						<AlertDialogDescription>
							Bu faktura butunlay o'chiriladi. Amalni davom ettirasizmi?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Yo'q</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBekorQilish}
							disabled={deletePurchaseInvoice.isPending}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{deletePurchaseInvoice.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							Ha, o'chirish
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
