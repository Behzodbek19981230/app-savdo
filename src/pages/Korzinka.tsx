import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useKorzinka } from '@/hooks/api/useKorzinka';
import { Loader2, Eye, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useDeleteOrderHistory } from '@/hooks/api/useDeleteOrderHistory';
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

const KorzinkaPage: React.FC = () => {
	const { data, isLoading, error } = useKorzinka(undefined, true);
	const dateGroups = data?.results || data?.data || [];
	const navigate = useNavigate();
	const deleteMutation = useDeleteOrderHistory();
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const openDeleteDialog = (id: number) => {
		setDeletingId(id);
		setIsDeleteDialogOpen(true);
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

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<CardTitle>Korzinka - Buyurtmalar</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='flex items-center justify-center py-10'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
						</div>
					) : error ? (
						<div className='text-red-600'>Korzinka ma'lumotlarini olishda xato</div>
					) : dateGroups.length === 0 ? (
						<div className='text-muted-foreground text-center py-8'>Korzinkada buyurtma topilmadi</div>
					) : (
						<div className='rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-[60px]'>t/r</TableHead>
										<TableHead>Sanasi</TableHead>
										<TableHead>Mijoz</TableHead>
										<TableHead>Xodim</TableHead>
										<TableHead className='text-right'>Zakaz (summa)</TableHead>
										<TableHead>Holati</TableHead>
										<TableHead className='text-right'>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{dateGroups.map((group: any, groupIdx: number) => {
										const totalSumma = group.items.reduce(
											(sum: number, item: any) =>
												sum + parseFloat(item.summa_total_dollar || '0'),
											0,
										);

										return (
											<>
												<TableRow
													key={`summary-${group.date}`}
													className='bg-muted/50 font-semibold'
												>
													<TableCell></TableCell>
													<TableCell>
														Jami {moment(group.date).format('YYYY-MM-DD')} ({group.count})
													</TableCell>
													<TableCell></TableCell>
													<TableCell></TableCell>
													<TableCell className='text-right'>
														{formatCurrency(totalSumma)}
													</TableCell>
													<TableCell></TableCell>
													<TableCell></TableCell>
												</TableRow>

												{group.items.map((it: any, idx: number) => (
													<TableRow
														key={it.id}
														className={it.order_status === false ? 'bg-red-50' : ''}
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
															<Link to={`/order-history/${it.id}`}>
																{formatCurrency(
																	it.summa_total_dollar || it.all_product_summa || 0,
																)}
															</Link>
														</TableCell>
														<TableCell>
															{it.is_karzinka ? (
																<span className='px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs'>
																	Korzinkada
																</span>
															) : it.order_status ? (
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
																{it?.order && (
																	<Button
																		variant='ghost'
																		size='icon'
																		onClick={() =>
																			navigate(`/order-history/${it.order}`)
																		}
																	>
																		<Eye className='h-4 w-4' />
																	</Button>
																)}
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
									Bu amalni qaytarib bo'lmaydi. Korzinkadan buyurtma o'chiriladi.
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

export default KorzinkaPage;
