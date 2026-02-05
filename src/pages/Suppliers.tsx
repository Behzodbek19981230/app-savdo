/**
 * Suppliers Page
 * /suppliers
 * Ta'minotchilar ro'yxati
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '@/hooks/api/useSupplier';
import { useRegions, useDistricts } from '@/hooks/api/useLocations';
import { useAuthContext } from '@/contexts/AuthContext';
import type { Supplier } from '@/types/supplier';
import {
	Search,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Plus,
	Edit,
	Trash2,
	Loader2,
	Truck,
	MapPin,
	Building2,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

type SortField = 'name' | 'region' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

// Form schema
const supplierSchema = z.object({
	name: z.string().min(1, 'Nom kiritilishi shart'),
	filial: z.coerce.number().positive('Filial tanlanishi shart'),
	region: z.coerce.number().positive('Viloyat tanlanishi shart'),
	district: z.coerce.number().positive('Tuman tanlanishi shart'),
	address: z.string().optional(),
	inn: z.coerce.number().optional(),
	note: z.string().optional(),
	is_active: z.boolean().default(true),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function Suppliers() {
	const { user } = useAuthContext();
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortField, setSortField] = useState<SortField>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	// Form
	const form = useForm<SupplierFormData>({
		resolver: zodResolver(supplierSchema),
		defaultValues: {
			name: '',
			filial: user?.filials_detail?.[0]?.id || 0,
			region: 0,
			district: 0,
			address: '',
			inn: undefined,
			note: '',
			is_active: true,
		},
	});

	const selectedRegion = form.watch('region');

	// Build ordering string for API
	const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;

	// Queries
	const { data, isLoading } = useSuppliers({
		page: currentPage,
		perPage: ITEMS_PER_PAGE,
		search: searchQuery || undefined,
		ordering,
		is_delete: false,
	});

	const { data: regionsData } = useRegions({ perPage: 100 });
	const { data: districtsData } = useDistricts(selectedRegion ? { region: selectedRegion, perPage: 100 } : undefined);

	const regions = regionsData?.results || [];
	const districts = districtsData?.results || [];

	// Mutations
	const createSupplier = useCreateSupplier();
	const updateSupplier = useUpdateSupplier();
	const deleteSupplier = useDeleteSupplier();

	const suppliers = data?.results || [];
	const pagination = data?.pagination;
	const totalPages = pagination?.lastPage || 1;

	// Reset district when region changes
	useEffect(() => {
		form.setValue('district', 0);
	}, [selectedRegion]);

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

	const handleOpenDialog = (item?: Supplier) => {
		if (item) {
			setEditingId(item.id);
			form.reset({
				name: item.name || '',
				filial: item.filial || user?.filials_detail?.[0]?.id || 0,
				region: item.region || 0,
				district: item.district || 0,
				address: item.address || '',
				inn: item.inn || undefined,
				note: item.note || '',
				is_active: item.is_active ?? true,
			});
		} else {
			setEditingId(null);
			form.reset({
				name: '',
				filial: user?.filials_detail?.[0]?.id || 0,
				region: 0,
				district: 0,
				address: '',
				inn: undefined,
				note: '',
				is_active: true,
			});
		}
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingId(null);
		form.reset();
	};

	const onSubmit = async (data: SupplierFormData) => {
		try {
			const submitData = {
				name: data.name,
				filial: data.filial,
				region: data.region,
				district: data.district,
				address: data.address,
				inn: data.inn,
				note: data.note,
				is_active: data.is_active,
				is_delete: false,
			};

			if (editingId) {
				await updateSupplier.mutateAsync({ id: editingId, data: submitData });
			} else {
				await createSupplier.mutateAsync(submitData);
			}
			handleCloseDialog();
		} catch (error) {
			console.error('Error saving supplier:', error);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;

		try {
			await deleteSupplier.mutateAsync(deletingId);
			setIsDeleteDialogOpen(false);
			setDeletingId(null);
		} catch (error) {
			console.error('Error deleting supplier:', error);
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
		if (createSupplier.isSuccess || updateSupplier.isSuccess) {
			setIsDialogOpen(false);
			setEditingId(null);
			form.reset();
		}
	}, [createSupplier.isSuccess, updateSupplier.isSuccess, form]);

	return (
		<div className='space-y-6'>
			{/* Main Card */}
			<Card>
				<CardHeader className='pb-4 flex flex-row items-center justify-between'>
					<div>
						<div className='flex items-center gap-2'>
							<Truck className='h-5 w-5 text-primary' />
							<CardTitle className='text-lg'>Ta'minotchilar</CardTitle>
						</div>
						<CardDescription>Jami {pagination?.total || suppliers.length} ta ta'minotchi</CardDescription>
					</div>
					<Button onClick={() => handleOpenDialog()}>
						<Plus className='mr-2 h-4 w-4' />
						Yangi ta'minotchi
					</Button>
				</CardHeader>
				<CardContent>
					{/* Search */}
					<div className='flex items-center gap-4 mb-4'>
						<div className='relative flex-1 max-w-sm'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
							<Input
								placeholder="Ta'minotchi qidirish..."
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
					) : suppliers.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-8 text-center'>
							<Truck className='h-12 w-12 text-muted-foreground/50 mb-3' />
							<p className='text-muted-foreground'>Ta'minotchilar topilmadi</p>
						</div>
					) : (
						<>
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='w-[50px]'>#</TableHead>
											<TableHead>
												<button
													className='flex items-center hover:text-foreground transition-colors'
													onClick={() => handleSort('name')}
												>
													Nomi
													{getSortIcon('name')}
												</button>
											</TableHead>
											<TableHead>Viloyat</TableHead>
											<TableHead>Tuman</TableHead>
											<TableHead>Manzil</TableHead>
											<TableHead>INN</TableHead>
											<TableHead>Holati</TableHead>
											<TableHead className='text-right'>Amallar</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{suppliers.map((supplier, index) => (
											<TableRow key={supplier.id}>
												<TableCell className='font-medium'>
													{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
												</TableCell>
												<TableCell className='font-medium'>{supplier.name}</TableCell>
												<TableCell>
													<div className='flex items-center gap-1'>
														<MapPin className='h-3 w-3 text-muted-foreground' />
														{supplier.region_detail?.name || '-'}
													</div>
												</TableCell>
												<TableCell>{supplier.district_detail?.name || '-'}</TableCell>
												<TableCell className='max-w-[200px] truncate'>
													{supplier.address || '-'}
												</TableCell>
												<TableCell>{supplier.inn || '-'}</TableCell>
												<TableCell>
													<Badge variant={supplier.is_active ? 'default' : 'secondary'}>
														{supplier.is_active ? 'Faol' : 'Nofaol'}
													</Badge>
												</TableCell>
												<TableCell className='text-right'>
													<div className='flex items-center justify-end gap-1'>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => handleOpenDialog(supplier)}
														>
															<Edit className='h-4 w-4' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															onClick={() => openDeleteDialog(supplier.id)}
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
											{[...Array(Math.min(5, totalPages))].map((_, i) => {
												let pageNum: number;
												if (totalPages <= 5) {
													pageNum = i + 1;
												} else if (currentPage <= 3) {
													pageNum = i + 1;
												} else if (currentPage >= totalPages - 2) {
													pageNum = totalPages - 4 + i;
												} else {
													pageNum = currentPage - 2 + i;
												}
												return (
													<PaginationItem key={pageNum}>
														<PaginationLink
															onClick={() => handlePageChange(pageNum)}
															isActive={currentPage === pageNum}
														>
															{pageNum}
														</PaginationLink>
													</PaginationItem>
												);
											})}
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

			{/* Add/Edit Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className='sm:max-w-[500px]'>
					<DialogHeader>
						<DialogTitle>
							{editingId ? "Ta'minotchini tahrirlash" : "Yangi ta'minotchi qo'shish"}
						</DialogTitle>
						<DialogDescription>
							{editingId
								? "Ta'minotchi ma'lumotlarini o'zgartiring"
								: "Yangi ta'minotchi ma'lumotlarini kiriting"}
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
							<FormField
								control={form.control}
								name='name'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nomi *</FormLabel>
										<FormControl>
											<Input placeholder="Ta'minotchi nomi" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name='filial'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Filial *</FormLabel>
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
												{user?.filials_detail?.map((f) => (
													<SelectItem key={f.id} value={String(f.id)}>
														{f.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className='grid grid-cols-2 gap-4'>
								<FormField
									control={form.control}
									name='region'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Viloyat *</FormLabel>
											<Select
												onValueChange={(value) => field.onChange(Number(value))}
												value={field.value ? String(field.value) : ''}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder='Viloyatni tanlang' />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{regions.map((r) => (
														<SelectItem key={r.id} value={String(r.id)}>
															{r.name}
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
									name='district'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tuman *</FormLabel>
											<Select
												onValueChange={(value) => field.onChange(Number(value))}
												value={field.value ? String(field.value) : ''}
												disabled={!selectedRegion}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={
																selectedRegion
																	? 'Tumanni tanlang'
																	: 'Avval viloyatni tanlang'
															}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{districts.map((d) => (
														<SelectItem key={d.id} value={String(d.id)}>
															{d.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name='address'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Manzil</FormLabel>
										<FormControl>
											<Input placeholder='Manzilni kiriting' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name='inn'
								render={({ field }) => (
									<FormItem>
										<FormLabel>INN</FormLabel>
										<FormControl>
											<Input
												type='number'
												placeholder='INN raqamini kiriting'
												{...field}
												onChange={(e) =>
													field.onChange(e.target.value ? Number(e.target.value) : undefined)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

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

							<FormField
								control={form.control}
								name='is_active'
								render={({ field }) => (
									<FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
										<div className='space-y-0.5'>
											<FormLabel>Faol holati</FormLabel>
											<p className='text-sm text-muted-foreground'>
												Ta'minotchi faol yoki nofaol
											</p>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>

							<DialogFooter>
								<Button type='button' variant='outline' onClick={handleCloseDialog}>
									Bekor qilish
								</Button>
								<Button type='submit' disabled={createSupplier.isPending || updateSupplier.isPending}>
									{(createSupplier.isPending || updateSupplier.isPending) && (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									)}
									{editingId ? 'Saqlash' : "Qo'shish"}
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
						<AlertDialogTitle>Ta'minotchini o'chirish</AlertDialogTitle>
						<AlertDialogDescription>
							Haqiqatan ham bu ta'minotchini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Bekor qilish</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{deleteSupplier.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							O'chirish
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
