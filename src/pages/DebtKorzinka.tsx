import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useDebtKorzinka } from '@/hooks/api/useDebtKorzinka';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, Eye, Trash2, RotateCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { debtRepaymentService } from '@/services/debtRepayment.service';
import { ORDER_HISTORY_KEYS } from '@/hooks/api/useOrderHistory';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useDeleteDebtKorzinka } from '@/hooks/api/useDeleteDebtKorzinka';
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
import moment from 'moment';
import { formatCurrency } from '@/lib/utils';

const DebtKorzinkaPage: React.FC = () => {
	const { selectedFilialId } = useAuthContext();
	const { data, isLoading, error } = useDebtKorzinka({ filial: selectedFilialId ?? undefined }, true);
	const rawGroups = data?.results || data?.data || [];
	const dateGroups = Array.isArray(rawGroups) ? rawGroups : [];
	// Normalize: if API returned a flat results array (items) instead of grouped-by-date objects,
	// wrap them into a single group with `items` so the UI can work uniformly.
	const groups =
		dateGroups.length > 0 && !('items' in dateGroups[0])
			? [
					{
						date: dateGroups[0]?.created_time || dateGroups[0]?.date || '',
						count: dateGroups.length,
						items: dateGroups,
					},
				]
			: dateGroups;
	const navigate = useNavigate();
	const deleteMutation = useDeleteDebtKorzinka();

	const queryClient = useQueryClient();
	const { toast } = useToast();
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
	const [restoringId, setRestoringId] = useState<number | null>(null);

	const openDeleteDialog = (id: number) => {
		setDeletingId(id);
		setIsDeleteDialogOpen(true);
	};

	const openRestoreDialog = (id: number) => {
		setRestoringId(id);
		setIsRestoreDialogOpen(true);
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			await deleteMutation.mutateAsync(deletingId);
			setIsDeleteDialogOpen(false);
			setDeletingId(null);
		} catch (err) {
			// error toast handled by hook
		}
	};

	const handleRestore = async () => {
		if (!restoringId) return;
		try {
			await debtRepaymentService.restoreKorzinka(restoringId);
			toast({ title: 'Qayta tiklandi', description: "Qarz qayta ro'yxatga qo'shildi", variant: 'success' });
			queryClient.invalidateQueries({ queryKey: ['debt-repayment-korzinka'], exact: false });
			queryClient.invalidateQueries({ queryKey: ORDER_HISTORY_KEYS.all });
			setIsRestoreDialogOpen(false);
			setRestoringId(null);
		} catch (err: any) {
			console.error(err);
			toast({ title: 'Xatolik', description: err?.message || 'Qayta tiklashda xatolik', variant: 'destructive' });
		}
	};

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<CardTitle>Qarzlar - Korzinka</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='flex items-center justify-center py-10'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
						</div>
					) : error ? (
						<div className='text-red-600'>Korzinka ma'lumotlarini olishda xato</div>
					) : groups.length === 0 ? (
						<div className='text-muted-foreground text-center py-8'>Korzinkada qarz topilmadi</div>
					) : (
						<div className='rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-[60px]'>t/r</TableHead>
										<TableHead>Sanasi</TableHead>
										<TableHead>Mijoz</TableHead>
										<TableHead>Xodim</TableHead>
										<TableHead className='text-right'>Summa</TableHead>
										<TableHead>Holati</TableHead>
										<TableHead className='text-right'>Amallar</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{groups.map((group: any, groupIdx: number) => {
										const items = Array.isArray(group.items) ? group.items : [];
										const totalSumma = items.reduce(
											(sum: number, item: any) =>
												sum + parseFloat(item.summa || item.amount || '0'),
											0,
										);

										return (
											<>
												<TableRow
													key={`summary-${group.date}`}
													className='bg-muted/50 font-semibold'
												>
													<TableCell></TableCell>
													<TableCell>{moment(group.date).format('YYYY-MM-DD')}</TableCell>
													<TableCell></TableCell>
													<TableCell></TableCell>
													<TableCell className='text-right'>
														{formatCurrency(totalSumma)}
													</TableCell>
													<TableCell></TableCell>
													<TableCell></TableCell>
												</TableRow>

												{items.map((it: any, idx: number) => (
													<TableRow
														key={it.id}
														className={it.status === false ? 'bg-red-50' : ''}
													>
														<TableCell className='font-medium'>{idx + 1}</TableCell>
														<TableCell>
															{it.created_time
																? moment(it.created_time).format('YYYY-MM-DD HH:mm')
																: group.date}
														</TableCell>
														<TableCell>
															{it.client_detail?.full_name || `#${it.client}`}
														</TableCell>
														<TableCell>{it.created_by_detail?.full_name || '-'}</TableCell>
														<TableCell className='text-right text-blue-600 font-semibold'>
															<Link to={`/debt-repayment/karzinka/${it.id}`}>
																{formatCurrency(it.summa || it.amount || 0)}
															</Link>
														</TableCell>
														<TableCell>
															{it.is_karzinka ? (
																<span className='px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs'>
																	Korzinkada
																</span>
															) : it.status ? (
																<span className='px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs'>
																	Yakunlangan
																</span>
															) : (
																<span className='px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs'>
																	Yakunlanmagan
																</span>
															)}
														</TableCell>
														<TableCell className='text-right'>
															<div className='flex items-center justify-end gap-1'>
																<Button
																	variant='ghost'
																	size='icon'
																	onClick={() => openRestoreDialog(it.id)}
																	title='Qayta tiklash'
																>
																	<RotateCw className='h-4 w-4 text-emerald-600' />
																</Button>
																<Button
																	variant='ghost'
																	size='icon'
																	onClick={() => openDeleteDialog(it.id)}
																>
																	<Trash2 className='h-4 w-4 text-destructive' />
																</Button>
															</div>
														</TableCell>
													</TableRow>
												))}
											</>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}

					{/* Restore Confirmation Modal */}
					<AlertDialog open={isRestoreDialogOpen} onOpenChange={(open) => setIsRestoreDialogOpen(open)}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Qarzni qayta tiklash</AlertDialogTitle>
								<AlertDialogDescription>
									Ushbu qarzni yana qarzlar ro'yxatiga qo'shmoqchimisiz?
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Bekor qilish</AlertDialogCancel>
								<AlertDialogAction onClick={handleRestore} disabled={false}>
									Qayta tiklash
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>

					{/* Delete Confirmation Modal */}
					<AlertDialog
						open={isDeleteDialogOpen}
						onOpenChange={(open) => {
							setIsDeleteDialogOpen(open);
							if (!open) setDeletingId(null);
						}}
					>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
								<AlertDialogDescription>
									Bu amalni qaytarib bo'lmaydi. Korzinkadan qarz o'chiriladi.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Bekor qilish</AlertDialogCancel>
								<AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isLoading}>
									{deleteMutation.isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
									O'chirish
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</CardContent>
			</Card>
		</div>
	);
};

export default DebtKorzinkaPage;
