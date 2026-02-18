import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrderHistoryProducts } from '@/hooks/api/useOrderHistoryProducts';
import { formatCurrency } from '@/lib/utils';
import moment from 'moment';

const OrderHistoryShow: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const { data, isLoading, error } = useOrderHistoryProducts(Number(id), true);

	const order = data?.order_history;
	const groups = data?.products || [];

	return (
		<div>
			<div className='mb-4 flex items-center justify-between'>
				<h1 className='text-2xl font-semibold'>Buyurtma #{id}</h1>
				<Link to='/order-history' className='text-sm text-blue-600'>
					Ro'yxatga qaytish
				</Link>
			</div>

			<Card>
				<div className='p-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
					<div className='p-3 border rounded'>
						<div className='text-xs text-muted-foreground'>Mijoz</div>
						<div className='font-semibold'>{order?.client_detail?.full_name}</div>
						<div className='text-sm text-muted-foreground'>{order?.client_detail?.phone_number}</div>
					</div>
					<div className='p-3 border rounded'>
						<div className='text-xs text-muted-foreground'>Sana va vaqt</div>
						<div className='font-semibold'>
							{order?.created_time ? moment(order.created_time).format('YYYY-MM-DD HH:mm:ss') : ''}
						</div>
					</div>
					<div className='p-3 border rounded'>
						<div className='text-xs text-muted-foreground'>Kassir</div>
						<div className='font-semibold'>{order?.created_by_detail?.full_name}</div>
					</div>
				</div>

				{/* Compact order info */}
				<div className='p-4'>
					<div className='mb-4 border rounded p-3'>
						<div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
							<div>
								<div className='text-xs text-muted-foreground'>Buyurtma ID</div>
								<div className='font-medium'>{order?.id}</div>
							</div>
							<div>
								<div className='text-xs text-muted-foreground'>Filial</div>
								<div className='font-medium'>{order?.order_filial_detail?.name ?? '-'}</div>
							</div>
							<div>
								<div className='text-xs text-muted-foreground'>Valyuta kursi</div>
								<div className='font-medium'>{order?.exchange_rate}</div>
							</div>

							<div>
								<div className='text-xs text-muted-foreground'>Mahsulotlar jami</div>
								<div className='font-medium'>
									{formatCurrency(Number(order?.all_product_summa || 0))}
								</div>
							</div>
							<div>
								<div className='text-xs text-muted-foreground'>Jami summa</div>
								<div className='font-medium'>
									{formatCurrency(Number(order?.summa_total_dollar || 0))}
								</div>
							</div>
							<div>
								<div className='text-xs text-muted-foreground'>To'langan (USD)</div>
								<div className='font-medium'>{formatCurrency(Number(order?.summa_dollar || 0))}</div>
							</div>
							<div>
								<div className='text-xs text-muted-foreground'>Naqd</div>
								<div className='font-medium'>{formatCurrency(Number(order?.summa_naqt || 0))}</div>
							</div>

							<div>
								<div className='text-xs text-muted-foreground'>O'tkazma</div>
								<div className='font-medium'>{formatCurrency(Number(order?.summa_transfer || 0))}</div>
							</div>
							<div>
								<div className='text-xs text-muted-foreground'>Chegirma</div>
								<div className='font-medium'>{formatCurrency(Number(order?.discount_amount || 0))}</div>
							</div>
							<div>
								<div className='text-xs text-muted-foreground'>Umumiy qarz</div>
								<div className='font-medium'>
									{formatCurrency(Number(order?.total_debt_client || 0))}
								</div>
							</div>

							<div>
								<div className='text-xs text-muted-foreground'>Holat</div>
								<div>
									{order?.is_karzinka ? (
										<span className='px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs'>
											Korzinkada
										</span>
									) : order?.order_status ? (
										<span className='px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs'>
											Yakunlangan
										</span>
									) : (
										<span className='px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs'>
											Yakunlanmagan
										</span>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{isLoading && <div>Yuklanmoqda...</div>}
				{error && <div className='text-red-600'>Mahsulotlarni yuklashda xato</div>}

				{groups.map((g: any) => {
					const modelTotalCount = g.product.reduce((s: number, it: any) => s + (it.count || 0), 0);
					const modelTotalSum = g.product.reduce(
						(s: number, it: any) => s + (Number(it.price_sum || 0) || 0),
						0,
					);

					return (
						<div key={g.model_id} className='mb-6'>
							<div className='bg-blue-50 px-4 py-2 font-semibold text-blue-700 rounded-t'>{g.model}</div>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-[40px]'>#</TableHead>
										<TableHead>Joyi</TableHead>
										<TableHead>Model</TableHead>
										<TableHead>Nomi</TableHead>
										<TableHead>O'lchami</TableHead>
										<TableHead>Tip</TableHead>
										<TableHead className='text-right'>Soni</TableHead>
										<TableHead className='text-right'>Berilgan soni</TableHead>
										<TableHead className='text-right'>Narxi ($)</TableHead>
										<TableHead className='text-right'>Asl Narxi ($)</TableHead>
										<TableHead className='text-right'>Foyda ($)</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{g.product.map((p: any, idx: number) => (
										<TableRow key={p.id}>
											<TableCell>{idx + 1}</TableCell>
											<TableCell>{p.branch_detail?.name ?? '-'}</TableCell>
											<TableCell>{p.model_detail?.name ?? g.model}</TableCell>
											<TableCell>{p.product_detail?.note ?? p.product}</TableCell>
											<TableCell>{p.size_detail?.size ?? p.size}</TableCell>
											<TableCell>{p.type_detail?.name ?? p.type}</TableCell>
											<TableCell className='text-right'>{p.count}</TableCell>
											<TableCell className='text-right'>{p.given_count}</TableCell>
											<TableCell className='text-right'>
												{formatCurrency(Number(p.price_dollar || p.price_sum || 0))}
											</TableCell>
											<TableCell className='text-right'>
												{formatCurrency(Number(p.real_price || 0))}
											</TableCell>
											<TableCell className='text-right text-emerald-600'>
												{formatCurrency(
													(Number(p.real_price || 0) - Number(p.unit_price || 0)) *
														(p.count || 0),
												)}
											</TableCell>
										</TableRow>
									))}
									<TableRow className='bg-muted/50 font-semibold'>
										<TableCell colSpan={6}>Jami:</TableCell>
										<TableCell className='text-right'>{modelTotalCount}</TableCell>
										<TableCell />
										<TableCell className='text-right'>{formatCurrency(modelTotalSum)}</TableCell>
										<TableCell />
										<TableCell />
									</TableRow>
								</TableBody>
							</Table>
						</div>
					);
				})}
			</Card>
		</div>
	);
};

export default OrderHistoryShow;
