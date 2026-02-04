/**
 * PurchaseInvoiceAdd Page
 * /purchase-invoices/add
 * Yangi tovar kirimi (faktura) va mahsulotlarni qo'shish
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Autocomplete } from '@/components/ui/autocomplete';
import { DatePicker } from '@/components/ui/date-picker';
import { useCreatePurchaseInvoice } from '@/hooks/api/usePurchaseInvoice';
import { useCreateProductHistory } from '@/hooks/api/useProductHistory';
import { useSuppliers, useCreateSupplier } from '@/hooks/api/useSupplier';
import { useSklads } from '@/hooks/api/useSklad';
import { useCompanies } from '@/hooks/api/useCompanies';
import { useProducts } from '@/hooks/api/useProducts';
import { useProductCategories, useCreateProductCategory } from '@/hooks/api/useProductCategories';
import { useProductModels, useCreateProductModel, PRODUCT_MODEL_KEYS } from '@/hooks/api/useProductModels';
import { useQueryClient } from '@tanstack/react-query';
import { useModelTypes, useCreateModelType, modelTypeKeys } from '@/hooks/api/useModelTypes';
import { useModelSizes } from '@/hooks/api/useModelSizes';
import { useUnits, useCreateUnit, unitKeys } from '@/hooks/api/useUnit';
import { useProductTypeSizes, useCreateProductTypeSize, productTypeSizeKeys } from '@/hooks/api/useProductTypeSize';
import { useExchangeRates } from '@/hooks/api/useExchangeRate';
import { useUsers } from '@/hooks/api/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import { ArrowLeft, Plus, Loader2, Package, Star, Trash2, ArrowDownCircle, DollarSign } from 'lucide-react';
import moment from 'moment';
import { Textarea } from '@/components/ui/textarea';

// Faktura form schema
const invoiceSchema = z.object({
	type: z.coerce.number().min(0),
	supplier: z.coerce.number().positive("Ta'minotchi tanlanishi shart"),
	filial: z.coerce.number().positive('Filial tanlanishi shart'),
	sklad: z.coerce.number().positive('Ombor tanlanishi shart'),
	date: z.string().min(1, 'Sana kiritilishi shart'),
	employee: z.coerce.number().positive('Xodim tanlanishi shart'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Mahsulot form schema
const productSchema = z.object({
	product: z.coerce.number().optional(), // Endi ishlatilmaydi
	reserve_limit: z.coerce.number().positive('Zaxira limiti kiritilishi shart'),
	is_weight: z.boolean().default(false), // Tarozi
	branch: z.coerce.number().positive("Bo'lim tanlanishi shart"),
	model: z.coerce.number().positive('Brend tanlanishi shart'),
	type: z.coerce.number().positive('Mahsulot nomi tanlanishi shart'), // Piyola, Kosa, etc.
	size: z.coerce.number().positive("O'lcham tanlanishi shart"), // ProductTypeSize
	unit: z.coerce.number().positive("O'lchov birligi tanlanishi shart"), // O'lchov birligi (Unit)
	count: z.coerce.number().int().positive('Miqdor kiritilishi shart'), // int
	real_price: z.coerce.number().positive('Xaqiqiy narx kiritilishi shart'), // float - Dollar
	unit_price: z.coerce.number().positive('Dona narx kiritilishi shart'), // float - Dollar
	wholesale_price: z.coerce.number().positive('Optom narx kiritilishi shart'), // float - Dollar
	min_price: z.coerce.number().positive('Minimal narx kiritilishi shart'), // float - Dollar
	note: z.string().optional(), // Izoh
});

type ProductFormData = z.infer<typeof productSchema>;

// Qo'shilgan mahsulot turi
interface AddedProduct extends ProductFormData {
	id: number;
	product_name?: string; // Type name (Piyola, Kosa, etc.)
	branch_name?: string;
	model_name?: string;
	type_name?: string;
	size_name?: string;
	unit_name?: string;
}

export default function PurchaseInvoiceAdd() {
	const navigate = useNavigate();
	const { user } = useAuthContext();
	const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
	const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [tempProductId, setTempProductId] = useState(1);
	const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
	const [newUnitName, setNewUnitName] = useState('');
	const [newUnitCode, setNewUnitCode] = useState('');
	const [isCreatingUnit, setIsCreatingUnit] = useState(false);

	// Faktura form
	const invoiceForm = useForm<InvoiceFormData>({
		resolver: zodResolver(invoiceSchema),
		defaultValues: {
			type: 0,
			supplier: 0,
			filial: user?.filials_detail?.[0]?.id || 0,
			sklad: 0,
			date: moment().format('YYYY-MM-DD'),
			employee: user?.id || 0,
		},
	});

	// Mahsulot form
	const productForm = useForm<ProductFormData>({
		resolver: zodResolver(productSchema),
		defaultValues: {
			product: 0,
			reserve_limit: 100,
			is_weight: false,
			branch: 0,
			model: 0,
			type: 0,
			size: 0,
			unit: 0,
			count: 0,
			real_price: 0,
			unit_price: 0,
			wholesale_price: 0,
			min_price: 0,
			note: '',
		},
	});

	const selectedFilial = invoiceForm.watch('filial');
	const selectedBranch = productForm.watch('branch');
	const selectedModel = productForm.watch('model');
	const selectedType = productForm.watch('type');
	const selectedUnit = productForm.watch('unit');
	const selectedSize = productForm.watch('size');

	// Data fetching
	const { data: usersData } = useUsers({ limit: 1000, is_active: true });
	const { data: suppliersData } = useSuppliers({ perPage: 1000, is_delete: false });
	const { data: companiesData } = useCompanies({ perPage: 1000, is_delete: false });
	const { data: skladsData } = useSklads({ perPage: 1000, filial: selectedFilial || undefined, is_delete: false });
	const { data: productsData } = useProducts({ limit: 1000, is_delete: false });
	const { data: categoriesData } = useProductCategories({ perPage: 1000, is_delete: false });
	const { data: modelsData, isLoading: isModelsLoading } = useProductModels(
		selectedBranch ? { limit: 1000, is_delete: false, branch: selectedBranch } : undefined,
	);
	const { data: typesData, isLoading: isTypesLoading } = useModelTypes(
		selectedModel ? { limit: 1000, is_delete: false, madel: selectedModel } : undefined,
	);
	const { data: sizesData } = useModelSizes({ perPage: 1000, is_delete: false });
	const { data: unitsData, isLoading: isUnitsLoading } = useUnits({ limit: 1000, is_active: true });
	const { data: productTypeSizesData, isLoading: isSizesLoading } = useProductTypeSizes(
		selectedType ? { limit: 1000, is_delete: false, product_type: selectedType } : undefined,
	);
	const { data: exchangeRatesData } = useExchangeRates(selectedFilial ? { filial: selectedFilial } : undefined);

	const users = usersData?.results || [];
	const suppliers = suppliersData?.results || [];
	const companies = companiesData?.results || [];
	const sklads = skladsData?.results || [];
	const products = productsData?.results || [];
	const categories = categoriesData?.results || [];
	const models = modelsData?.results || [];
	const types = typesData?.results || [];
	const sizes = sizesData?.results || [];
	const units = unitsData?.results || [];
	const productTypeSizes = productTypeSizesData?.results || [];
	const dollarRate = exchangeRatesData?.results?.[0]?.dollar || 12500;

	// Mutations
	const createPurchaseInvoice = useCreatePurchaseInvoice();
	const createProductHistory = useCreateProductHistory();
	const createSupplier = useCreateSupplier();
	const createModel = useCreateProductModel();
	const createProductCategory = useCreateProductCategory();
	const createType = useCreateModelType();
	const createUnit = useCreateUnit();
	const createProductTypeSize = useCreateProductTypeSize();

	// Autocomplete uchun category options
	const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

	// Autocomplete uchun model options (branch bo'yicha filtrlangan)
	const modelOptions = models.map((m) => ({ value: m.id, label: m.name }));

	// Autocomplete uchun type options (model bo'yicha filtrlangan)
	const typeOptions = types.map((t) => ({ value: t.id, label: t.name }));

	// Autocomplete uchun unit options
	const unitOptions = units.map((u) => ({ value: u.id, label: `${u.name} (${u.code})` }));

	// Autocomplete uchun size options (type bo'yicha filtrlangan)
	const sizeOptions = productTypeSizes.map((s) => ({ value: s.id, label: String(s.size) }));

	// Yangi bo'lim (category) qo'shish
	const handleCreateCategory = async (name: string) => {
		try {
			const result = await createProductCategory.mutateAsync({
				name,
				sorting: 0,
				is_delete: false,
			});
			return { id: result.id, name: result.name };
		} catch {
			return null;
		}
	};

	// Query client
	const queryClient = useQueryClient();

	// Yangi model qo'shish (tanlangan branch bilan)
	const handleCreateModel = async (name: string) => {
		if (!selectedBranch) return null;
		try {
			const result = await createModel.mutateAsync({
				name,
				branch: selectedBranch,
				sorting: 0,
				is_delete: false,
			});
			// Mos branch bo'yicha listni qayta yuklash
			await queryClient.invalidateQueries({
				queryKey: PRODUCT_MODEL_KEYS.list({ limit: 1000, is_delete: false, branch: selectedBranch }),
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
				sorting: 0,
				is_delete: false,
			});
			// Mos model bo'yicha listni qayta yuklash
			await queryClient.invalidateQueries({
				queryKey: modelTypeKeys.list({ limit: 1000, is_delete: false, madel: selectedModel }),
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
				queryKey: unitKeys.list({ limit: 1000, is_active: true }),
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
		if (!selectedType || !selectedUnit) return null;
		try {
			const result = await createProductTypeSize.mutateAsync({
				product_type: selectedType,
				size: parseFloat(sizeValue) || 0,
				type: selectedUnit, // O'lchov birligi (Unit ID)
				sorting: 0,
				is_delete: false,
			});
			// Mos type bo'yicha listni qayta yuklash
			await queryClient.invalidateQueries({
				queryKey: productTypeSizeKeys.list({ limit: 1000, is_delete: false, product_type: selectedType }),
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
	}, [selectedBranch]);

	// Model o'zgarganda type va size ni tozalash
	useEffect(() => {
		productForm.setValue('type', 0);
		productForm.setValue('size', 0);
	}, [selectedModel]);

	// Type o'zgarganda size ni tozalash
	useEffect(() => {
		productForm.setValue('size', 0);
	}, [selectedType]);

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('uz-UZ').format(value);
	};

	// Dollar formatlagich
	const formatDollar = (value: number) => {
		return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
	};

	// Mahsulot qo'shish dialogini ochish
	const openProductDialog = () => {
		productForm.reset({
			product: 0,
			reserve_limit: 100,
			is_weight: false,
			branch: 0,
			model: 0,
			type: 0,
			size: 0,
			unit: 0,
			count: 0,
			real_price: 0,
			unit_price: 0,
			wholesale_price: 0,
			min_price: 0,
			note: '',
		});
		setIsProductDialogOpen(true);
	};

	// Mahsulotni listga qo'shish
	const handleAddProduct = (values: ProductFormData) => {
		const branch = categories.find((c) => c.id === values.branch);
		const model = models.find((m) => m.id === values.model);
		const type = types.find((t) => t.id === values.type);
		const size = productTypeSizes.find((s) => s.id === values.size);
		const unit = units.find((u) => u.id === values.unit);

		// Product nomini branch + model + type + size orqali yasaymiz
		const productName =
			[branch?.name, model?.name, type?.name, size ? String(size.size) : undefined].filter(Boolean).join(' ') ||
			'Mahsulot';

		const newProduct: AddedProduct = {
			...values,
			id: tempProductId,
			product_name: productName,
			branch_name: branch?.name,
			model_name: model?.name,
			type_name: type?.name,
			size_name: size ? String(size.size) : undefined,
			unit_name: unit?.name,
		};

		setAddedProducts([...addedProducts, newProduct]);
		setTempProductId(tempProductId + 1);
		setIsProductDialogOpen(false);
	};

	// Mahsulotni listdan o'chirish
	const handleRemoveProduct = (id: number) => {
		setAddedProducts(addedProducts.filter((p) => p.id !== id));
	};

	// Jami summani hisoblash
	const totalSum = addedProducts.reduce((sum, p) => sum + p.count * p.real_price, 0);

	// Fakturani saqlash
	const handleSubmit = async (values: InvoiceFormData) => {
		console.log(464);

		if (addedProducts.length === 0) {
			return;
		}

		setIsSubmitting(true);

		try {
			// 1. Fakturani yaratish
			const invoice = await createPurchaseInvoice.mutateAsync({
				type: values.type ?? 0,
				supplier: values.supplier,
				filial: values.filial,
				sklad: values.sklad,
				date: values.date,
				employee: values.employee,
				product_count: addedProducts.length,
				all_product_summa: totalSum,
			});

			// 2. Har bir mahsulotni ProductHistory ga qo'shish
			for (const product of addedProducts) {
				await createProductHistory.mutateAsync({
					date: values.date,
					reserve_limit: product.reserve_limit,
					purchase_invoice: invoice.id,
					branch: product.branch,
					model: product.model,
					type: product.type,
					size: product.size,
					unit: product.unit,
					is_weight: product.is_weight,
					count: product.count,
					real_price: product.real_price,
					unit_price: product.unit_price,
					wholesale_price: product.wholesale_price,
					min_price: product.min_price,
					note: product.note,
					filial_id: values.filial,
				});
			}

			navigate('/purchase-invoices');
		} catch {
			// handled in hooks
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center gap-4'>
				<Button variant='ghost' size='icon' onClick={() => navigate('/purchase-invoices')}>
					<ArrowLeft className='h-5 w-5' />
				</Button>
				<div>
					<h1 className='text-xl font-bold tracking-tight'>Yangi tovar kirimi</h1>
				</div>
			</div>

			<div className='space-y-6'>
				{/* Faktura ma'lumotlari - yuqorida bir qatorda */}
				<Card>
					<CardHeader className='pb-4'>
						<CardTitle className='flex items-center gap-2 text-xl'>
							<ArrowDownCircle className='h-5 w-5 text-green-600' />
							Faktura ma'lumotlari
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Form {...invoiceForm}>
							<form className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end'>
								<FormField
									control={invoiceForm.control}
									name='date'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Sana</FormLabel>
											<FormControl>
												<DatePicker
													date={field.value ? new Date(field.value) : undefined}
													onDateChange={(date) =>
														field.onChange(date ? moment(date).format('YYYY-MM-DD') : '')
													}
													placeholder='Sanani tanlang'
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={invoiceForm.control}
									name='filial'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Filial</FormLabel>
											<Select
												onValueChange={(value) => field.onChange(Number(value))}
												value={field.value ? String(field.value) : ''}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder='Filialni tanlang' />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{user?.filials_detail?.map((c) => (
														<SelectItem key={c.id} value={String(c.id)}>
															{c.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
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
											<Select
												onValueChange={(value) => field.onChange(Number(value))}
												value={String(field.value)}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder='Turini tanlang' />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value='0'>Tovar kirimi</SelectItem>
													<SelectItem value='1'>Vozvrat</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={invoiceForm.control}
									name='supplier'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Ta'minotchi</FormLabel>
											<Select
												onValueChange={(value) => field.onChange(Number(value))}
												value={field.value ? String(field.value) : ''}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Ta'minotchini tanlang" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{suppliers.map((s) => (
														<SelectItem key={s.id} value={String(s.id)}>
															{s.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
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
											<Select
												onValueChange={(value) => field.onChange(Number(value))}
												value={field.value ? String(field.value) : ''}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder='Omborni tanlang' />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{sklads.map((s) => (
														<SelectItem key={s.id} value={String(s.id)}>
															{s.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
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
											<Select
												onValueChange={(value) => field.onChange(Number(value))}
												value={field.value ? String(field.value) : ''}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder='Xodimni tanlang' />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{users.map((u) => (
														<SelectItem key={u.id} value={String(u.id)}>
															{u.full_name || u.username}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Dollar kursi */}
								<div className='flex items-center gap-2 p-3 bg-muted rounded-lg h-10'>
									<DollarSign className='h-4 w-4 text-green-600' />
									<span className='text-sm'>Kurs:</span>
									<span className='font-semibold'>{formatCurrency(dollarRate)}</span>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>

				{/* Mahsulotlar - pastda full width */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<div>
								<CardTitle className='flex items-center gap-2'>
									<Package className='h-5 w-5' />
									Mahsulotlar
								</CardTitle>
								<CardDescription>Kiritilgan mahsulotlar ro'yxati</CardDescription>
							</div>
							<Button onClick={openProductDialog} className='gap-2'>
								<Plus className='h-4 w-4' />
								Mahsulot qo'shish
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{addedProducts.length === 0 ? (
							<div className='flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg'>
								<Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
								<p className='text-muted-foreground'>Mahsulotlar qo'shilmagan</p>
								<Button variant='outline' className='mt-4' onClick={openProductDialog}>
									<Plus className='h-4 w-4 mr-2' />
									Mahsulot qo'shish
								</Button>
							</div>
						) : (
							<>
								<div className='rounded-md border'>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>#</TableHead>
												<TableHead>Mahsulot</TableHead>
												<TableHead>Bo'lim</TableHead>
												<TableHead>Model</TableHead>
												<TableHead className='text-right'>Miqdori</TableHead>
												<TableHead className='text-right'>Narxi ($)</TableHead>
												<TableHead className='text-right'>Jami ($)</TableHead>
												<TableHead className='w-[50px]'></TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{addedProducts.map((p, index) => (
												<TableRow key={p.id}>
													<TableCell>{index + 1}</TableCell>
													<TableCell className='font-medium'>{p.product_name}</TableCell>
													<TableCell>{p.branch_name}</TableCell>
													<TableCell>{p.model_name}</TableCell>
													<TableCell className='text-right'>{p.count}</TableCell>
													<TableCell className='text-right'>
														${formatDollar(p.real_price)}
													</TableCell>
													<TableCell className='text-right font-semibold'>
														${formatDollar(p.count * p.real_price)}
													</TableCell>
													<TableCell>
														<Button
															variant='ghost'
															size='icon'
															className='h-8 w-8 text-destructive'
															onClick={() => handleRemoveProduct(p.id)}
														>
															<Trash2 className='h-4 w-4' />
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>

								{/* Jami */}
								<div className='mt-4 flex justify-end'>
									<div className='bg-muted p-4 rounded-lg'>
										<div className='flex items-center gap-4'>
											<span className='text-muted-foreground'>Mahsulotlar:</span>
											<Badge variant='outline'>{addedProducts.length} ta</Badge>
										</div>
										<div className='flex items-center gap-4 mt-2'>
											<span className='text-muted-foreground'>Jami summa:</span>
											<span className='text-xl font-bold text-green-600'>
												${formatDollar(totalSum)}
											</span>
										</div>
									</div>
								</div>
							</>
						)}

						{/* Saqlash tugmasi */}
						<div className='mt-6 flex justify-end'>
							<Button
								size='lg'
								disabled={addedProducts.length === 0 || isSubmitting}
								onClick={invoiceForm.handleSubmit(handleSubmit, (errors) => {
									console.log('Validation errors:', errors);
									// Xatolarni ko'rsatish
									const errorMessages = Object.entries(errors)
										.map(([key, value]) => `${key}: ${value?.message}`)
										.join('\n');
									if (errorMessages) {
										alert(`Iltimos, quyidagi maydonlarni to'ldiring:\n${errorMessages}`);
									}
								})}
							>
								{isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
								Saqlash
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Mahsulot qo'shish modal */}
			<Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
				<DialogContent className='w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle className='text-xl'>Yangi mahsulot qo'shish</DialogTitle>
						<DialogDescription>Mahsulot ma'lumotlarini kiriting</DialogDescription>
					</DialogHeader>
					<Form {...productForm}>
						<form onSubmit={productForm.handleSubmit(handleAddProduct)} className='space-y-3'>
							{/* Bo'lim va Brend */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
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
														selectedBranch ? 'Brendni tanlang' : "Avval bo'limni tanlang"
													}
													searchPlaceholder='Brend qidirish...'
													emptyText='Brend topilmadi'
													disabled={!selectedBranch}
													isLoading={isModelsLoading}
													allowCreate={!!selectedBranch}
													onCreateNew={handleCreateModel}
													createText="Yangi brend qo'shish"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							{/* Mahsulot nomi (Piyola, Kosa, Tarelka, Printer, Monitor) */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
									render={({ field }) => (
										<FormItem>
											<FormLabel>O'lcham</FormLabel>
											<div className='flex'>
												{/* Unit select - avval tanlanadi */}
												<Select
													value={selectedUnit ? String(selectedUnit) : ''}
													onValueChange={(val) => {
														if (val === 'create_new') {
															setIsUnitDialogOpen(true);
														} else {
															productForm.setValue('unit', Number(val));
														}
													}}
													disabled={!!selectedSize} // Size tanlagandan keyin disabled
												>
													<SelectTrigger className='w-[80px] rounded-r-none border-r-0'>
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
												<FormControl>
													<div className='flex-1'>
														<Autocomplete
															options={sizeOptions}
															value={field.value || undefined}
															onValueChange={(val) => field.onChange(Number(val))}
															placeholder={
																!selectedType
																	? 'Avval mahsulotni tanlang'
																	: !selectedUnit
																		? 'Avval birlikni tanlang'
																		: "O'lchamni tanlang"
															}
															searchPlaceholder="O'lcham qidirish..."
															emptyText="O'lcham topilmadi"
															disabled={!selectedType || !selectedUnit} // Type va Unit tanlanmasa disabled
															isLoading={isSizesLoading}
															allowCreate={!!selectedType && !!selectedUnit}
															onCreateNew={handleCreateSize}
															createText="Yangi o'lcham qo'shish"
															className='rounded-l-none border-l-0'
														/>
													</div>
												</FormControl>
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Zaxira limiti va Miqdori */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 items-end'>
								<FormField
									control={productForm.control}
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
													/>
												</FormControl>
												<span className='inline-flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground'>
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
									name='reserve_limit'
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Zaxira limiti{' '}
												<span className='text-destructive'>*(Xabar berish uchun)</span>
											</FormLabel>
											<div className='flex'>
												<FormControl>
													<Input type='number' {...field} className='rounded-r-none' />
												</FormControl>
												<span className='inline-flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground'>
													{units.find((u) => u.id === productForm.watch('unit'))?.code ||
														'birlik'}
												</span>
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Hidden product field - endi ishlatilmaydi */}
							<input type='hidden' {...productForm.register('product')} value={1} />

							{/* Narxlar - Dollar */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
													<Input
														type='number'
														step='0.01'
														placeholder='0.00'
														{...field}
														className='rounded-r-none'
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
									control={productForm.control}
									name='unit_price'
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
									control={productForm.control}
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
									control={productForm.control}
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

			{/* Yangi o'lchov birligi qo'shish dialog */}
			<Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
				<DialogContent className='sm:max-w-[400px]'>
					<DialogHeader>
						<DialogTitle>Yangi o'lchov birligi</DialogTitle>
						<DialogDescription>Yangi o'lchov birligini qo'shing</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Nomi</label>
							<Input
								placeholder='Masalan: Kilogram'
								value={newUnitName}
								onChange={(e) => setNewUnitName(e.target.value)}
							/>
						</div>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Kodi</label>
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
		</div>
	);
}
