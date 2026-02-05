/**
 * ExchangeRates Page
 * /exchange-rates
 * Superadmin uchun barcha filiallar dollar kurslari
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
	useExchangeRates,
	useCreateExchangeRate,
	useUpdateExchangeRate,
	useDeleteExchangeRate,
} from '@/hooks/api/useExchangeRate';
import { useCompanies } from '@/hooks/api/useCompanies';
import type { ExchangeRate } from '@/types/exchangeRate';
import { DollarSign, Loader2, Plus, Trash2, Edit, Building2 } from 'lucide-react';
import moment from 'moment';

// Form validation schema
const exchangeRateSchema = z.object({
	dollar: z.coerce.number().positive("Kurs musbat bo'lishi kerak"),
	filial: z.coerce.number().positive('Filial tanlanishi shart'),
});

type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>;

export default function ExchangeRates() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const form = useForm<ExchangeRateFormData>({
		resolver: zodResolver(exchangeRateSchema),
		defaultValues: { dollar: 0, filial: 0 },
	});

	// Barcha exchange ratelarni olish (filter yo'q - barchasi)
	const { data, isLoading } = useExchangeRates();
	const { data: companiesData } = useCompanies({ perPage: 1000, is_delete: false });

	const createExchangeRate = useCreateExchangeRate();
	const updateExchangeRate = useUpdateExchangeRate();
	const deleteExchangeRate = useDeleteExchangeRate();

	const exchangeRates = data?.results || [];
	const companies = companiesData?.results || [];

	const isMutating = createExchangeRate.isPending || updateExchangeRate.isPending || deleteExchangeRate.isPending;

	// Filial nomini topish
	const getFilialName = (filialId: number) => {
		const company = companies.find((c) => c.id === filialId);
		return company?.name || `Filial #${filialId}`;
	};

	const handleOpenDialog = (item?: ExchangeRate) => {
		if (item) {
			setEditingId(item.id);
			form.reset({ dollar: item.dollar, filial: item.filial });
		} else {
			setEditingId(null);
			form.reset({ dollar: 0, filial: 0 });
		}
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingId(null);
		form.reset();
	};

	const openDeleteDialog = (id: number) => {
		setDeletingId(id);
		setIsDeleteDialogOpen(true);
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			await deleteExchangeRate.mutateAsync(deletingId);
			setIsDeleteDialogOpen(false);
			setDeletingId(null);
		} catch {
			// handled in hook toast
		}
	};

	const onSubmit = async (values: ExchangeRateFormData) => {
		try {
			if (editingId) {
				await updateExchangeRate.mutateAsync({
					id: editingId,
					data: { dollar: values.dollar, filial: values.filial },
				});
			} else {
				await createExchangeRate.mutateAsync({
					dollar: values.dollar,
					filial: values.filial,
				});
			}
			handleCloseDialog();
		} catch {
			// handled in hook toast
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('uz-UZ').format(value);
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight'>Dollar kurslari</h1>
					<p className='text-muted-foreground'>Barcha filiallar uchun dollar kurslari</p>
				</div>
				<Button onClick={() => handleOpenDialog()} className='gap-2'>
					<Plus className='h-4 w-4' />
					Yangi kurs
				</Button>
			</div>

			{/* Table Card */}
			<Card>
				<CardHeader className='pb-4'>
					<div className='flex items-center gap-2'>
						<DollarSign className='h-5 w-5 text-green-600' />
						<CardTitle className='text-lg'>Kurslar ro'yxati</CardTitle>
					</div>
					<CardDescription>Jami {exchangeRates.length} ta kurs</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='flex items-center justify-center py-10'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
						</div>
					) : exchangeRates.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-10 text-center'>
							<DollarSign className='h-12 w-12 text-muted-foreground/50 mb-4' />
							<p className='text-muted-foreground'>Hozircha kurslar mavjud emas</p>
							<Button variant='outline' className='mt-4' onClick={() => handleOpenDialog()}>
								<Plus className='h-4 w-4 mr-2' />
								Birinchi kursni qo'shing
							</Button>
						</div>
					) : (
						<div className='rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-[60px]'>#</TableHead>
										<TableHead>Filial</TableHead>
										<TableHead>Dollar kursi</TableHead>
										<TableHead>Yangilangan</TableHead>
										<TableHead>Yangilagan foydalanuvchi</TableHead>
										<TableHead className='text-right w-[120px]'>Amallar</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{exchangeRates.map((rate, index) => (
										<TableRow key={rate.id}>
											<TableCell className='font-medium'>{index + 1}</TableCell>
											<TableCell>
												<div className='flex items-center gap-2'>
													<Building2 className='h-4 w-4 text-muted-foreground' />
													{getFilialName(rate.filial)}
												</div>
											</TableCell>
											<TableCell>
												<span className='font-semibold text-green-600'>
													{formatCurrency(rate.dollar)} so'm
												</span>
											</TableCell>
											<TableCell className='text-muted-foreground'>
												{rate.updated_time
													? moment(rate.updated_time).format('DD.MM.YYYY HH:mm')
													: '-'}
											</TableCell>
											<TableCell className='text-muted-foreground'>
												{rate.updated_by_detail
													? rate.updated_by_detail?.fullname ||
														rate.updated_by_detail?.email ||
														'-'
													: '-'}
											</TableCell>
											<TableCell className='text-right'>
												<div className='flex items-center justify-end gap-1'>
													<Button
														variant='ghost'
														size='icon'
														className='h-8 w-8'
														onClick={() => handleOpenDialog(rate)}
													>
														<Edit className='h-4 w-4' />
													</Button>
													<Button
														variant='ghost'
														size='icon'
														className='h-8 w-8 text-destructive hover:text-destructive'
														onClick={() => openDeleteDialog(rate.id)}
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
					)}
				</CardContent>
			</Card>

			{/* Create/Edit Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle>{editingId ? 'Kursni tahrirlash' : 'Yangi kurs'}</DialogTitle>
						<DialogDescription>
							{editingId ? 'Dollar kursini yangilang' : 'Filial uchun dollar kursini kiriting'}
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
							<FormField
								control={form.control}
								name='filial'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Filial</FormLabel>
										<Select
											onValueChange={(value) => field.onChange(Number(value))}
											value={field.value ? String(field.value) : ''}
											disabled={!!editingId}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder='Filial tanlang' />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{companies.map((company) => (
													<SelectItem key={company.id} value={String(company.id)}>
														{company.name}
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
								name='dollar'
								render={({ field }) => (
									<FormItem>
										<FormLabel>1 USD = ? UZS</FormLabel>
										<FormControl>
											<Input
												type='number'
												placeholder='Masalan: 12500'
												{...field}
												min={0}
												step={0.01}
											/>
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
						<AlertDialogTitle>Kursni o'chirish</AlertDialogTitle>
						<AlertDialogDescription>
							Haqiqatan ham bu kursni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Bekor qilish</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
							disabled={deleteExchangeRate.isPending}
						>
							{deleteExchangeRate.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							O'chirish
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
