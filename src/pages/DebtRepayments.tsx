import { useState, Fragment, useMemo } from 'react';
import { Loader2, Plus, Trash2, Search, RotateCcw, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DateRangePicker } from '@/components/ui/date-picker';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthContext } from '@/contexts/AuthContext';
import apiClient from '@/lib/api/client';
import { clientService } from '@/services/client.service';
import { userService } from '@/services/user.service';
import { useDebtRepaymentsGrouped, useDeleteDebtRepayment } from '@/hooks/api/useDebtRepayments';
import { formatCurrency } from '@/lib/utils';
import DebtRepaymentModal from '@/components/Kassa/DebtRepaymentModal';

export default function DebtRepaymentsPage() {
	const { selectedFilialId } = useAuthContext();
	const today = new Date();
	const oneMonthAgo = new Date(today);
	oneMonthAgo.setMonth(today.getMonth() - 1);

	const [draftDateFrom, setDraftDateFrom] = useState<Date | undefined>(oneMonthAgo);
	const [draftDateTo, setDraftDateTo] = useState<Date | undefined>(today);
	const [appliedDateFrom, setAppliedDateFrom] = useState<Date | undefined>(oneMonthAgo);
	const [appliedDateTo, setAppliedDateTo] = useState<Date | undefined>(today);

	const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
	const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
	const [clientOptions, setClientOptions] = useState<any[]>([]);
	const [employeeOptions, setEmployeeOptions] = useState<any[]>([]);
	const [appliedClientId, setAppliedClientId] = useState<number | null>(null);
	const [appliedEmployeeId, setAppliedEmployeeId] = useState<number | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const {
		data: groupedData,
		isLoading,
		error,
		refetch,
	} = useDebtRepaymentsGrouped(
		selectedFilialId
			? {
					filial: selectedFilialId,
					date_from: appliedDateFrom ? format(appliedDateFrom, 'yyyy-MM-dd') : undefined,
					date_to: appliedDateTo ? format(appliedDateTo, 'yyyy-MM-dd') : undefined,
					client: appliedClientId ?? undefined,
					employee: appliedEmployeeId ?? undefined,
				}
			: undefined,
	);

	const deleteMutation = useDeleteDebtRepayment();

	const handleModalSuccess = () => {
		// refresh listing after a successful create in modal
		refetch?.();
		setIsModalOpen(false);
	};

	const groups = Array.isArray(groupedData) ? groupedData : groupedData?.data || [];

	const overallTotals = useMemo(() => {
		let totalCount = 0;
		let totalPaid = 0;
		let totalOldDebt = 0;
		let totalNewDebt = 0;

		for (const group of groups) {
			const items = group.items || [];
			totalCount += items.length;
			for (const item of items) {
				totalPaid += Number(item.summa_total_dollar || 0);
				totalOldDebt += Number(item.old_total_debt_client || 0);
				totalNewDebt += Number(item.total_debt_client || 0);
			}
		}

		return { totalCount, totalPaid, totalOldDebt, totalNewDebt };
	}, [groups]);

	const handleDelete = (id: number) => {
		if (!confirm("Qarz to'lovini o'chirishni tasdiqlaysizmi?")) return;
		deleteMutation.mutate(id);
	};

	const openPdf = async (id: number) => {
		try {
			const response = await apiClient.get(`/pdf/debt-repayment/${id}/client`, { responseType: 'blob' });
			const blob = new Blob([response.data], { type: 'application/pdf' });
			const url = URL.createObjectURL(blob);
			window.open(url, '_blank');
		} catch (e) {
			console.error('PDF yuklab olishda xatolik:', e);
		}
	};

	const onSearchClients = async (q: string) => {
		const res = await clientService.getClients({ search: q || '', per_page: 50 } as any);
		const items = res.results || [];
		setClientOptions(
			items.map((c: any) => ({ id: String(c.id), label: c.full_name || c.phone_number, value: String(c.id) })),
		);
	};

	const onSearchEmployees = async (q: string) => {
		const res = await userService.getUsers({ search: q || '', limit: 100 } as any);
		const items = res.results || [];
		setEmployeeOptions(
			items.map((u: any) => ({ id: String(u.id), label: u.full_name || u.username, value: String(u.id) })),
		);
	};

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader className='pb-4'>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='text-lg'>To'langan qarzlar</CardTitle>
						</div>
						<div className='flex items-center gap-2'>
							<DateRangePicker
								dateFrom={draftDateFrom}
								dateTo={draftDateTo}
								onDateFromChange={(d) => setDraftDateFrom(d)}
								onDateToChange={(d) => setDraftDateTo(d)}
							/>

							<div className='w-56'>
								<Autocomplete
									options={clientOptions}
									value={selectedClientId ? String(selectedClientId) : ''}
									onChange={(v) => setSelectedClientId(v ? Number(v) : null)}
									onSearchChange={onSearchClients}
									placeholder="Mijoz bo'yicha filtrlash"
								/>
							</div>

							<div className='w-56'>
								<Autocomplete
									options={employeeOptions}
									value={selectedEmployeeId ? String(selectedEmployeeId) : ''}
									onChange={(v) => setSelectedEmployeeId(v ? Number(v) : null)}
									onSearchChange={onSearchEmployees}
									placeholder="Xodim bo'yicha filtrlash"
								/>
							</div>

							<div className='flex items-center gap-1.5'>
								<Button
									type='button'
									onClick={() => {
										setAppliedDateFrom(draftDateFrom);
										setAppliedDateTo(draftDateTo);
										setAppliedClientId(selectedClientId);
										setAppliedEmployeeId(selectedEmployeeId);
									}}
									className='h-8 px-3'
								>
									<Search className='mr-2 h-4 w-4' /> Filter
								</Button>
								<Button
									type='button'
									variant='outline'
									onClick={() => {
										setDraftDateFrom(oneMonthAgo);
										setDraftDateTo(today);
										setAppliedDateFrom(oneMonthAgo);
										setAppliedDateTo(today);
										setSelectedClientId(null);
										setSelectedEmployeeId(null);
										setAppliedClientId(null);
										setAppliedEmployeeId(null);
									}}
									className='h-8 px-3'
								>
									<RotateCcw className='mr-2 h-4 w-4' /> Tozalash
								</Button>
								<Button
									type='button'
									className='h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white'
									onClick={() => setIsModalOpen(true)}
								>
									<Plus className='mr-2 h-4 w-4' /> Qarz to'lash
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className='overflow-x-auto'>
						{isLoading ? (
							<div className='flex items-center justify-center py-8'>
								<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
							</div>
						) : error ? (
							<div className='flex items-center justify-center py-8'>
								<p className='text-red-600'>Ma'lumotlarni yuklashda xatolik yuz berdi</p>
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>#</TableHead>
										<TableHead>Sana</TableHead>
										<TableHead>Mijoz</TableHead>
										<TableHead>Xodim</TableHead>
										<TableHead>Eski qarz($)</TableHead>
										<TableHead>Yangi qarz($)</TableHead>
										<TableHead>To'landi($)</TableHead>
										<TableHead>Holati</TableHead>
										<TableHead>Amallar</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{groups.length === 0 || groups.every((g: any) => (g.items?.length || 0) === 0) ? (
										<TableRow>
											<TableCell colSpan={9} className='text-center py-12 text-gray-400'>
												Ma'lumotlar yo'q
											</TableCell>
										</TableRow>
									) : (
										groups.map((group: any, gIdx: number) => (
											<Fragment key={`group-${group.date ?? gIdx}`}>
												{group.items.map((item: any, idx: number) => (
													<TableRow key={item.id} className='hover:bg-muted/50'>
														<TableCell>{idx + 1}</TableCell>
														{idx === 0 && (
															<TableCell
																rowSpan={group.items.length}
																className='font-medium align-top px-3 py-2'
															>
																<div>
																	<div className='text-sm font-bold text-blue-700'>
																		{group.date || 'Barcha sanalar'}
																	</div>
																</div>
															</TableCell>
														)}
														<TableCell>
															{item.client_detail?.full_name || `ID: ${item.client}`}
														</TableCell>
														<TableCell>
															{item.employee_detail?.full_name ||
																(item.employee ? `ID: ${item.employee}` : '-')}
														</TableCell>
														<TableCell>
															{formatCurrency(Number(item.old_total_debt_client || 0))}
														</TableCell>
														<TableCell>
															{formatCurrency(Number(item.total_debt_client || 0))}
														</TableCell>
														<TableCell>
															{formatCurrency(Number(item.summa_total_dollar || 0))}
														</TableCell>
														<TableCell>
															<span
																className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${item.debt_status ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
															>
																{item.debt_status ? "To'langan" : 'Kutilmoqda'}
															</span>
														</TableCell>
														<TableCell>
															<div className='flex items-center gap-2'>
																<Button
																	size='icon'
																	variant='default'
																	className='h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white'
																	onClick={() => openPdf(item.id)}
																>
																	<Printer size={14} />
																</Button>
																<Button
																	size='icon'
																	variant='ghost'
																	className='text-red-600'
																	onClick={() => handleDelete(item.id)}
																>
																	<Trash2 size={14} />
																</Button>
															</div>
														</TableCell>
													</TableRow>
												))}
											</Fragment>
										))
									)}

									{groups.length > 0 && overallTotals.totalCount > 0 && (
										<TableRow className='bg-blue-50 font-semibold'>
											<TableCell>Jami</TableCell>
											<TableCell />
											<TableCell />
											<TableCell />
											<TableCell className=''>
												{formatCurrency(overallTotals.totalOldDebt)}
											</TableCell>
											<TableCell className=''>
												{formatCurrency(overallTotals.totalNewDebt)}
											</TableCell>
											<TableCell className=' text-green-700'>
												{formatCurrency(overallTotals.totalPaid)}
											</TableCell>
											<TableCell colSpan={2} />
										</TableRow>
									)}
								</TableBody>
							</Table>
						)}
					</div>
				</CardContent>
			</Card>
			<DebtRepaymentModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					refetch?.();
				}}
				onSuccess={handleModalSuccess}
			/>
		</div>
	);
}
