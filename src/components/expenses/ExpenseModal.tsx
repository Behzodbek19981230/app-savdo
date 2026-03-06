import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import NumberInput from '../ui/NumberInput';
import { DatePicker } from '../ui/date-picker';
import { Autocomplete } from '../ui/autocomplete';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { CreateExpensePayload, Expense, expenseService } from '../../services/expenseService';
import { showError, showSuccess } from '../../lib/toast';
import { useAuthContext } from '../../contexts/AuthContext';
import { userService, type AppUser } from '../../services/user.service';
import { useExpenseCategories } from '../../hooks/api/useExpenseCategories';
import { useExchangeRates } from '../../hooks/api/useExchangeRate';
import { Loader2 } from 'lucide-react';
import moment from 'moment';
import { AxiosError } from 'axios';

// Validation schema
const expenseSchema = z
	.object({
		category: z.string().min(1, 'Kategoriya tanlanishi shart'),
		summa_total_dollar: z.coerce.number().min(0, "Jami summa 0 dan kichik bo'lishi mumkin emas"),
		summa_dollar: z.coerce.number().min(0, "Summa 0 dan kichik bo'lishi mumkin emas"),
		summa_naqt: z.coerce.number().min(0, "Summa 0 dan kichik bo'lishi mumkin emas"),
		summa_kilik: z.coerce.number().min(0, "Summa 0 dan kichik bo'lishi mumkin emas"),
		summa_terminal: z.coerce.number().min(0, "Summa 0 dan kichik bo'lishi mumkin emas"),
		summa_transfer: z.coerce.number().min(0, "Summa 0 dan kichik bo'lishi mumkin emas"),
		date: z.date({ required_error: 'Sana kiritilishi shart' }),
		note: z.string().optional(),
		is_salary: z.boolean().default(false),
		employee: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.is_salary === true) {
			if (!data.employee || data.employee === '' || Number(data.employee) <= 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Oylik xarajat uchun hodim tanlanishi shart',
					path: ['employee'],
				});
			}
		}
	});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	initialData?: Expense | null;
}

export function ExpenseModal({ isOpen, onClose, onSuccess, initialData = null }: ExpenseModalProps) {
	const { user, selectedFilialId } = useAuthContext();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<ExpenseFormValues>({
		resolver: zodResolver(expenseSchema),
		defaultValues: {
			category: initialData?.category?.toString() || '',
			summa_total_dollar: initialData?.summa_total_dollar || 0,
			summa_dollar: initialData?.summa_dollar || 0,
			summa_naqt: initialData?.summa_naqt || 0,
			summa_kilik: initialData?.summa_kilik || 0,
			summa_terminal: initialData?.summa_terminal || 0,
			summa_transfer: initialData?.summa_transfer || 0,
			date: initialData?.date ? new Date(initialData.date) : new Date(),
			note: initialData?.note || '',
			is_salary: initialData?.is_salary || false,
			employee: initialData?.employee?.toString() || '',
		},
	});

	const isSalary = form.watch('is_salary');

	// Get dollar exchange rate
	const userFilialId = selectedFilialId || user?.companies?.[0];
	const { data: exchangeRatesData } = useExchangeRates(userFilialId ? { filial: userFilialId } : undefined);
	const dollarRate = exchangeRatesData?.results?.[0]?.dollar || 12500;

	// Watch all summa fields for auto-calculation
	const summaDollar = form.watch('summa_dollar') || 0;
	const summaNaqt = form.watch('summa_naqt') || 0;
	const summaKilik = form.watch('summa_kilik') || 0;
	const summaTerminal = form.watch('summa_terminal') || 0;
	const summaTransfer = form.watch('summa_transfer') || 0;

	// Auto-calculate total dollar based on inputs
	useEffect(() => {
		if (!isOpen) return;
		const totalInSom = summaNaqt + summaKilik + summaTerminal + summaTransfer;
		const totalInDollar = summaDollar + totalInSom / dollarRate;
		form.setValue('summa_total_dollar', parseFloat(totalInDollar.toFixed(2)), { shouldValidate: false });
	}, [summaDollar, summaNaqt, summaKilik, summaTerminal, summaTransfer, dollarRate, form, isOpen]);

	// Get categories from API using hook
	const { data: categoriesData, isLoading: isLoadingCategories } = useExpenseCategories({
		limit: 1000,
		is_delete: false,
	});
	const categories = categoriesData?.results || [];

	const [employees, setEmployees] = useState<AppUser[]>([]);
	const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		const loadEmployees = async () => {
			setIsLoadingEmployees(true);
			try {
				const res = await userService.getUsers({ limit: 100 });
				setEmployees(res.results || []);
			} catch (err) {
				console.error('Failed to load employees', err);
				setEmployees([]);
			} finally {
				setIsLoadingEmployees(false);
			}
		};
		loadEmployees();
	}, [isOpen]);

	useEffect(() => {
		form.reset({
			category: initialData?.category?.toString() || '',
			summa_total_dollar: initialData?.summa_total_dollar || 0,
			summa_dollar: initialData?.summa_dollar || 0,
			summa_naqt: initialData?.summa_naqt || 0,
			summa_kilik: initialData?.summa_kilik || 0,
			summa_terminal: initialData?.summa_terminal || 0,
			summa_transfer: initialData?.summa_transfer || 0,
			date: initialData?.date ? new Date(initialData.date) : new Date(),
			note: initialData?.note || '',
			is_salary: initialData?.is_salary || false,
			employee: initialData?.employee?.toString() || '',
		});
	}, [initialData, form]);

	const onSubmit = async (values: ExpenseFormValues) => {
		setIsSubmitting(true);
		const payload: CreateExpensePayload = {
			filial: user?.order_filial || 0,
			category: values.category ? Number(values.category) : undefined,
			summa_total_dollar: values.summa_total_dollar,
			summa_dollar: values.summa_dollar,
			summa_naqt: values.summa_naqt,
			summa_kilik: values.summa_kilik,
			summa_terminal: values.summa_terminal,
			summa_transfer: values.summa_transfer,
			date: values.date ? moment(values.date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
			note: values.note || '',
			is_delete: false,
			is_salary: values.is_salary === true,
			employee: values.is_salary === true && values.employee ? Number(values.employee) : undefined,
		};

		try {
			if (initialData && initialData.id) {
				await expenseService.updateExpense(initialData.id, payload);
				showSuccess('Xarajat yangilandi');
			} else {
				await expenseService.createExpense(payload);
				showSuccess("Xarajat qo'shildi");
			}
			onSuccess?.();
			onClose();
		} catch (error: unknown) {
			console.error('Expense save error', error);
			const msg =
				(error as AxiosError<{ detail: string }>)?.response?.data?.detail ||
				(error as Error)?.message ||
				'Xatolik yuz berdi';
			showError(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='sm:max-w-3xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>{initialData?.id ? 'Xarajatni tahrirlash' : 'Yangi xarajat'}</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						{/* Is Salary Radio Button */}
						<FormField
							control={form.control}
							name='is_salary'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Xarajat turi</FormLabel>
									<FormControl>
										<RadioGroup
											value={field.value ? 'true' : 'false'}
											onValueChange={(value) => field.onChange(value === 'true')}
											className='flex gap-6'
										>
											<div className='flex items-center space-x-2'>
												<RadioGroupItem value='false' id='regular' />
												<label htmlFor='regular' className='text-xs font-normal cursor-pointer'>
													Oddiy xarajat
												</label>
											</div>
											<div className='flex items-center space-x-2'>
												<RadioGroupItem value='true' id='salary' />
												<label htmlFor='salary' className='text-xs font-normal cursor-pointer'>
													Oylik
												</label>
											</div>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
							<FormField
								control={form.control}
								name='category'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Kategoriya</FormLabel>
										<FormControl>
											<Autocomplete
												options={categories.map((c) => ({
													value: c.id.toString(),
													label: c.name,
												}))}
												value={field.value || undefined}
												onValueChange={(v) => field.onChange(String(v))}
												placeholder='Kategoriyani tanlang'
												isLoading={isLoadingCategories}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name='date'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sana</FormLabel>
										<FormControl>
											<DatePicker
												date={field.value}
												onDateChange={field.onChange}
												className='w-full'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name='summa_total_dollar'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Jami summa ($) *</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value?.toString() ?? '0'}
												onChange={(value) => field.onChange(Number(value) || 0)}
												className='w-full'
												disabled
												readOnly
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Employee Selection - Only shown when is_salary is true */}
						{isSalary && (
							<FormField
								control={form.control}
								name='employee'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Hodim</FormLabel>
										<FormControl>
											<Autocomplete
												options={employees.map((emp) => ({
													value: emp.id.toString(),
													label: `${emp.full_name}${emp.phone_number ? ` (${emp.phone_number})` : ''}`,
												}))}
												value={field.value || undefined}
												onValueChange={(v) => field.onChange(String(v))}
												placeholder='Hodimni tanlang'
												isLoading={isLoadingEmployees}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
							<FormField
								control={form.control}
								name='summa_dollar'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Summa ($)</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value?.toString() ?? '0'}
												onChange={(value) => field.onChange(Number(value) || 0)}
												className='w-full'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name='summa_naqt'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Summa so'm</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value?.toString() ?? '0'}
												onChange={(value) => field.onChange(Number(value) || 0)}
												className='w-full'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name='summa_kilik'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Summa kilik</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value?.toString() ?? '0'}
												onChange={(value) => field.onChange(Number(value) || 0)}
												className='w-full'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
							<FormField
								control={form.control}
								name='summa_terminal'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Summa terminal</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value?.toString() ?? '0'}
												onChange={(value) => field.onChange(Number(value) || 0)}
												className='w-full'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name='summa_transfer'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Summa transfer</FormLabel>
										<FormControl>
											<NumberInput
												value={field.value?.toString() ?? '0'}
												onChange={(value) => field.onChange(Number(value) || 0)}
												className='w-full'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name='note'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Izoh</FormLabel>
									<FormControl>
										<Textarea placeholder='Izoh kiriting' rows={4} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type='button' variant='outline' onClick={onClose} disabled={isSubmitting}>
								Bekor qilish
							</Button>
							<Button type='submit' disabled={isSubmitting}>
								{isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
								{initialData?.id ? 'Saqlash' : "Qo'shish"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

export default ExpenseModal;
