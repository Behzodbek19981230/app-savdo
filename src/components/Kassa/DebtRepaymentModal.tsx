import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';
import NumberInput from '@/components/ui/NumberInput';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { Autocomplete } from '@/components/ui/autocomplete';
import { debtRepaymentService } from '@/services/debtRepayment.service';
import { clientService } from '@/services/client.service';
import { showError, showSuccess } from '@/lib/toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { useExchangeRates } from '@/hooks/api/useExchangeRate';
import { formatCurrency } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function DebtRepaymentModal({ isOpen, onClose, onSuccess }: Props) {
	const { user, selectedFilialId } = useAuthContext();
	const [clients, setClients] = useState<any[]>([]);
	const [selectedClient, setSelectedClient] = useState<any | null>(null);
	const [isSearching, setIsSearching] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [debtStatus, setDebtStatus] = useState(true);

	const { data: exchangeRatesData } = useExchangeRates(selectedFilialId ? { filial: selectedFilialId } : undefined);
	const exchangeRate = exchangeRatesData?.results?.[0]?.dollar || 1;

	type DebtRepaymentFormValues = {
		filial: number;
		client: number;
		employee: number;
		exchange_rate: number;
		date: Date;
		note: string;
		old_total_debt_client: number;
		total_debt_client: number;
		summa_total_dollar: string;
		summa_dollar: string;
		summa_naqt: string;
		summa_kilik: string;
		summa_terminal: string;
		summa_transfer: string;
		discount_amount: string;
		zdacha_dollar: string;
		zdacha_som: string;
		is_delete: boolean;
		debt_status: boolean;
	};

	const form = useForm<DebtRepaymentFormValues>({
		defaultValues: {
			filial: selectedFilialId || 0,
			client: 0,
			employee: user?.id || 0,
			exchange_rate: exchangeRate,
			date: new Date(),
			note: '',
			old_total_debt_client: 0,
			total_debt_client: 0,
			summa_total_dollar: '0.00',
			summa_dollar: '0',
			summa_naqt: '0',
			summa_kilik: '0',
			summa_terminal: '0',
			summa_transfer: '0',
			discount_amount: '0',
			zdacha_dollar: '0',
			zdacha_som: '0',
			is_delete: false,
			debt_status: debtStatus,
		},
	});

	const { control, handleSubmit, reset, setValue, watch, getValues, setError, clearErrors } = form;

	const summaDollar = watch('summa_dollar');
	const summaNaqt = watch('summa_naqt');
	const summaTransfer = watch('summa_transfer');
	const summaTerminal = watch('summa_terminal');
	const summaKilik = watch('summa_kilik');
	const discountAmount = watch('discount_amount');
	const zdachaDollar = watch('zdacha_dollar');

	useEffect(() => {
		const d = Number(summaDollar || 0);
		const s = Number(summaNaqt || 0);
		const transfer = Number(summaTransfer || 0);
		const terminal = Number(summaTerminal || 0);
		const kilik = Number(summaKilik || 0);
		const disc = Number(discountAmount || 0);
		const zdD = Number(zdachaDollar || 0);
		const rate = exchangeRate || 1;

		const total = d + (s + transfer + terminal + kilik) / rate - disc - zdD;
		const final = Math.max(0, total);
		const formatted = Number.isFinite(final) ? final.toFixed(2) : '0.00';
		if (getValues('summa_total_dollar') !== formatted) {
			setValue('summa_total_dollar', formatted, { shouldDirty: true, shouldValidate: true });
		}
	}, [
		summaDollar,
		summaNaqt,
		summaTransfer,
		summaTerminal,
		summaKilik,
		discountAmount,
		zdachaDollar,
		exchangeRate,
		setValue,
		getValues,
	]);

	useEffect(() => {
		setValue('exchange_rate', exchangeRate, { shouldDirty: false, shouldValidate: false });
	}, [exchangeRate, setValue]);

	const searchClients = useCallback(async (q: string) => {
		setIsSearching(true);
		try {
			const res = await clientService.getClients({ search: q || '', per_page: 50 } as any);
			const items = res.results || [];
			setClients(items.filter((c: any) => c.is_active && !c.is_delete));
		} catch (e) {
			console.error(e);
			setClients([]);
		} finally {
			setIsSearching(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen) searchClients('');
		else {
			setSelectedClient(null);
			reset();
			setDebtStatus(true);
		}
	}, [isOpen, searchClients, reset]);

	const handleClientSelect = async (val: string) => {
		if (!val) {
			setSelectedClient(null);
			return;
		}
		try {
			const id = Number(val);
			const resp = await clientService.getClientById(id);
			setSelectedClient(resp);
		} catch (e) {
			showError("Mijoz ma'lumotlarini yuklashda xatolik");
		}
	};

	useEffect(() => {
		// keep debt_status in sync with form value
		setValue('debt_status', debtStatus);
	}, [debtStatus, setValue]);

	const onSubmit = async (data: any) => {
		if (!selectedClient) return showError('Mijozni tanlang');
		if (!selectedFilialId) return showError("Filial ma'lumotlari topilmadi");

		setIsSubmitting(true);
		clearErrors();
		try {
			const oldTotalDebt = selectedClient.total_debt ? Number(selectedClient.total_debt) : 0;

			const summa_naqt = Number(data.summa_naqt || 0);
			const summa_dollar = Number(data.summa_dollar || 0);
			const summa_transfer = Number(data.summa_transfer || 0);
			const summa_terminal = Number(data.summa_terminal || 0);
			const summa_kilik = Number(data.summa_kilik || 0);
			const discount_amount = Number(data.discount_amount || 0);

			const totalPaid = summa_naqt + summa_dollar * exchangeRate + summa_transfer + summa_terminal + summa_kilik;
			const newTotalDebt = Math.max(0, oldTotalDebt - totalPaid + discount_amount);

			const payload = {
				filial: selectedFilialId,
				client: selectedClient.id,
				employee: user?.id || 0,
				exchange_rate: exchangeRate,
				date: data.date
					? data.date instanceof Date
						? data.date.toISOString().split('T')[0]
						: data.date
					: new Date().toISOString().split('T')[0],
				note: data.note,
				old_total_debt_client: oldTotalDebt,
				total_debt_client: newTotalDebt,
				summa_total_dollar: Number(data.summa_total_dollar || 0),
				summa_dollar: summa_dollar,
				summa_naqt: summa_naqt,
				summa_kilik: summa_kilik,
				summa_terminal: summa_terminal,
				summa_transfer: summa_transfer,
				discount_amount: discount_amount,
				zdacha_dollar: Number(data.zdacha_dollar || 0),
				zdacha_som: Number(data.zdacha_som || 0),
				is_delete: Boolean(data.is_delete) || false,
				debt_status: Boolean(data.debt_status !== undefined ? data.debt_status : debtStatus),
			};

			await debtRepaymentService.createDebtRepayment(payload);
			showSuccess("Qarz muvaffaqiyatli to'landi");
			onSuccess?.();
			onClose();
		} catch (e: any) {
			const data = e;
			const fieldMessages = data?.message;

			if (fieldMessages && typeof fieldMessages === 'object') {
				for (const [field, message] of Object.entries(fieldMessages as Record<string, unknown>)) {
					if (typeof message === 'string' && message.trim().length > 0) {
						setError(field as keyof DebtRepaymentFormValues, { type: 'server', message });
					}
				}
			}

			const toastTextCandidate =
				typeof data?.errorMessage === 'string'
					? data.errorMessage
					: typeof data?.detail === 'string'
						? data.detail
						: typeof e?.message === 'string'
							? e.message
							: undefined;
			showError(toastTextCandidate || "Qarz to'lashda xatolik");
		} finally {
			setIsSubmitting(false);
		}
	};

	const autocompleteOptions = clients.map((c) => ({
		value: String(c.id),
		label: `${c.full_name}${c.phone_number ? ` (${c.phone_number})` : ''}`,
	}));

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='sm:max-w-3xl max-h-[90vh] overflow-hidden'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						Qarz to'lash{' '}
						<div className='hidden sm:flex items-center gap-2 bg-white/60 px-2 py-1 rounded'>
							<span className='text-xs text-gray-700'>Kurs:</span>
							<span className='text-sm font-bold text-indigo-700'>
								{formatCurrency(Number(exchangeRate))} UZS
							</span>
						</div>
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
							<FormField
								control={control}
								name='client'
								render={() => (
									<FormItem>
										<FormLabel>Mijoz</FormLabel>
										<FormControl>
											<Autocomplete
												options={autocompleteOptions}
												value={selectedClient?.id?.toString() || ''}
												onValueChange={(v) => {
													handleClientSelect(String(v));
													setValue('client', Number(v) || 0, {
														shouldDirty: true,
														shouldValidate: true,
													});
												}}
												onSearchChange={searchClients}
												placeholder='Mijozni tanlang...'
												emptyText='Mijoz topilmadi'
												isLoading={isSearching}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className='flex items-end'>
								<div className='w-full'>
									<div className='text-sm font-medium text-destructive'>Qarzi ($)</div>
									<div className='px-2 py-1.5 bg-red-50 border border-red-200 rounded-lg mt-2'>
										<span className='text-sm font-bold text-red-700'>
											{selectedClient
												? Number(selectedClient.total_debt || 0).toFixed(2)
												: '0.00'}
										</span>
									</div>
								</div>
							</div>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
							<FormField
								control={control}
								name='date'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sana</FormLabel>
										<FormControl>
											<DatePicker
												date={field.value}
												onDateChange={field.onChange}
												className='w-full [&>button]:h-8'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={control}
								name='discount_amount'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Chegirma</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value}
												onChange={(v) => field.onChange(v)}
												allowDecimal
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
							<FormField
								control={control}
								name='summa_total_dollar'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Jami summa ($)</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value}
												onChange={(v) => field.onChange(v)}
												allowDecimal
												disabled
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={control}
								name='summa_dollar'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Summa ($)</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value}
												onChange={(v) => field.onChange(v)}
												allowDecimal
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={control}
								name='summa_naqt'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Summa so'm</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value}
												onChange={(v) => field.onChange(v)}
												allowDecimal
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
							<FormField
								control={control}
								name='summa_transfer'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Transfer</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value}
												onChange={(v) => field.onChange(v)}
												allowDecimal
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={control}
								name='summa_terminal'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Terminal</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value}
												onChange={(v) => field.onChange(v)}
												allowDecimal
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={control}
								name='summa_kilik'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Kilik</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value}
												onChange={(v) => field.onChange(v)}
												allowDecimal
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-3 gap-3 items-end'>
							<FormField
								control={control}
								name='zdacha_dollar'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Zdacha ($)</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value}
												onChange={(v) => field.onChange(v)}
												allowDecimal
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={control}
								name='zdacha_som'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Zdacha so'm</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value}
												onChange={(v) => field.onChange(v)}
												allowDecimal
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormItem className='flex items-center gap-3'>
								<FormLabel>Qarz holati</FormLabel>
								<Switch
									checked={debtStatus}
									onCheckedChange={(v) => {
										setDebtStatus(Boolean(v));
										setValue('debt_status', Boolean(v), {
											shouldDirty: true,
											shouldValidate: true,
										});
									}}
								/>
							</FormItem>
						</div>

						<FormField
							control={control}
							name='note'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Izoh</FormLabel>
									<FormControl>
										<Textarea
											rows={3}
											value={field.value}
											onChange={(e) => field.onChange(e.target.value)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type='button' variant='outline' onClick={onClose} disabled={isSubmitting}>
								Bekor qilish
							</Button>
							<Button type='submit' disabled={isSubmitting || !selectedClient}>
								{isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
								{isSubmitting ? 'Toʻlanmoqda...' : 'Qarzni toʻlash'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
