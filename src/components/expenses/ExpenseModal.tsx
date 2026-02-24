import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import NumberInput from '../ui/NumberInput';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { expenseService } from '../../services/expenseService';
import { showError, showSuccess } from '../../lib/toast';
import { useAuthContext } from '../../contexts/AuthContext';
import { userService, type AppUser } from '../../services/user.service';
import { useExpenseCategories } from '../../hooks/api/useExpenseCategories';
import { Loader2 } from 'lucide-react';

interface ExpenseModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	initialData?: any | null;
}

export function ExpenseModal({ isOpen, onClose, onSuccess, initialData = null }: ExpenseModalProps) {
	const { user } = useAuthContext();
	const [isSubmitting, setIsSubmitting] = useState(false);

	interface FormValues {
		category?: string;
		summa_total_dollar?: string;
		summa_dollar?: string;
		summa_naqt?: string;
		summa_kilik?: string;
		summa_terminal?: string;
		summa_transfer?: string;
		date?: Date | undefined;
		note?: string;
		is_salary?: boolean;
		employee?: string;
	}

	const form = useForm<FormValues>({
		defaultValues: {
			category: initialData?.category?.toString() || '',
			summa_total_dollar: initialData?.summa_total_dollar?.toString() || '0',
			summa_dollar: initialData?.summa_dollar?.toString() || '0',
			summa_naqt: initialData?.summa_naqt?.toString() || '0',
			summa_kilik: initialData?.summa_kilik?.toString() || '0',
			summa_terminal: initialData?.summa_terminal?.toString() || '0',
			summa_transfer: initialData?.summa_transfer?.toString() || '0',
			date: initialData?.date ? new Date(initialData.date) : new Date(),
			note: initialData?.note || '',
			is_salary: initialData?.is_salary || false,
			employee: initialData?.employee?.toString() || '',
		},
	});

	const isSalary = form.watch('is_salary');

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
				const res = await userService.getUsers({ page_size: 100 });
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
			summa_total_dollar: initialData?.summa_total_dollar?.toString() || '0',
			summa_dollar: initialData?.summa_dollar?.toString() || '0',
			summa_naqt: initialData?.summa_naqt?.toString() || '0',
			summa_kilik: initialData?.summa_kilik?.toString() || '0',
			summa_terminal: initialData?.summa_terminal?.toString() || '0',
			summa_transfer: initialData?.summa_transfer?.toString() || '0',
			date: initialData?.date ? new Date(initialData.date) : new Date(),
			note: initialData?.note || '',
			is_salary: initialData?.is_salary || false,
			employee: initialData?.employee?.toString() || '',
		});
	}, [initialData, form]);

	const onSubmit = async (values: FormValues) => {
		setIsSubmitting(true);
		const payload = {
			filial: user?.order_filial || 0,
			category: values.category ? Number(values.category) : undefined,
			summa_total_dollar: Number(values.summa_total_dollar || 0),
			summa_dollar: Number(values.summa_dollar || 0),
			summa_naqt: Number(values.summa_naqt || 0),
			summa_kilik: Number(values.summa_kilik || 0),
			summa_terminal: Number(values.summa_terminal || 0),
			summa_transfer: Number(values.summa_transfer || 0),
			date: values.date ? values.date.toISOString().split('T')[0] : undefined,
			note: values.note || '',
			is_delete: false,
			is_salary: values.is_salary === true,
			employee: values.is_salary === true && values.employee ? Number(values.employee) : undefined,
		} as any;

		try {
			if (initialData && initialData.id) {
				await expenseService.updateExpense(initialData.id, payload);
				showSuccess('Xarajat yangilandi');
			} else {
				await expenseService.createExpense(payload);
				showSuccess("Xarajat qo'shildi");
			}
			onSuccess && onSuccess();
			onClose();
		} catch (error: any) {
			console.error('Expense save error', error);
			const msg = error?.response?.data?.detail || error?.message || 'Xatolik yuz berdi';
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
					<DialogDescription>
						{initialData?.id
							? 'Xarajat ma\'lumotlarini o\'zgartiring'
							: 'Yangi xarajat ma\'lumotlarini kiriting'}
					</DialogDescription>
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
												<label htmlFor='regular' className='text-sm font-normal cursor-pointer'>
													Oddiy xarajat
												</label>
											</div>
											<div className='flex items-center space-x-2'>
												<RadioGroupItem value='true' id='salary' />
												<label htmlFor='salary' className='text-sm font-normal cursor-pointer'>
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
										<Select value={field.value || undefined} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder='Kategoriyani tanlang' />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{isLoadingCategories ? (
													<div className='px-2 py-1.5 text-sm text-muted-foreground'>Yuklanmoqda...</div>
												) : categories.length === 0 ? (
													<div className='px-2 py-1.5 text-sm text-muted-foreground'>
														Kategoriya topilmadi
													</div>
												) : (
													categories.map((c) => (
														<SelectItem key={c.id} value={c.id.toString()}>
															{c.name}
														</SelectItem>
													))
												)}
											</SelectContent>
										</Select>
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
											<DatePicker date={field.value} onDateChange={field.onChange} className='w-full' />
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
										<FormLabel>Jami summa ($)</FormLabel>
										<FormControl>
											<NumberInput value={field.value ?? '0'} onChange={field.onChange} className='w-full' />
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
										<Select value={field.value || undefined} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder='Hodimni tanlang' />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{isLoadingEmployees ? (
													<div className='px-2 py-1.5 text-sm text-muted-foreground'>Yuklanmoqda...</div>
												) : employees.length === 0 ? (
													<div className='px-2 py-1.5 text-sm text-muted-foreground'>Hodim topilmadi</div>
												) : (
													employees.map((emp) => (
														<SelectItem key={emp.id} value={emp.id.toString()}>
															{emp.full_name}
															{emp.phone_number ? ` (${emp.phone_number})` : ''}
														</SelectItem>
													))
												)}
											</SelectContent>
										</Select>
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
											<NumberInput value={field.value ?? '0'} onChange={field.onChange} className='w-full' />
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
											<NumberInput value={field.value ?? '0'} onChange={field.onChange} className='w-full' />
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
											<NumberInput value={field.value ?? '0'} onChange={field.onChange} className='w-full' />
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
											<NumberInput value={field.value ?? '0'} onChange={field.onChange} className='w-full' />
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
											<NumberInput value={field.value ?? '0'} onChange={field.onChange} className='w-full' />
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
