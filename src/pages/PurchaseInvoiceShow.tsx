/**
 * PurchaseInvoiceShow Page
 * /purchase-invoices/:id
 * Faktura va unga tegishli mahsulotlar tarixi
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { usePurchaseInvoice } from '@/hooks/api/usePurchaseInvoice';
import { useProductHistories } from '@/hooks/api/useProductHistory';
import {
	ArrowLeft,
	Package,
	Calendar,
	User,
	Building2,
	Warehouse,
	Truck,
	DollarSign,
	FileText,
	Hash,
} from 'lucide-react';
import moment from 'moment';

export default function PurchaseInvoiceShow() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const invoiceId = Number(id);

	// Faktura ma'lumotlari
	const { data: invoice, isLoading: isInvoiceLoading } = usePurchaseInvoice(invoiceId);

	// Mahsulotlar tarixi (faktura bo'yicha)
	const { data: productHistoriesData, isLoading: isProductsLoading } = useProductHistories({
		purchase_invoice: invoiceId,
		perPage: 1000,
	});

	const productHistories = productHistoriesData?.results || [];

	// Valyuta formatlash
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('uz-UZ').format(value);
	};

	// Dollar formatlash
	const formatDollar = (value: number | string) => {
		const num = typeof value === 'string' ? parseFloat(value) : value;
		return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
	};

	// Jami summani hisoblash
	const totalSum = productHistories.reduce((sum, p) => {
		const price = typeof p.real_price === 'string' ? parseFloat(p.real_price) : p.real_price;
		return sum + p.count * (price || 0);
	}, 0);
	const totalCount = productHistories.reduce((sum, p) => sum + p.count, 0);

	if (isInvoiceLoading) {
		return (
			<div className='space-y-6'>
				<div className='flex items-center gap-4'>
					<Skeleton className='h-10 w-10' />
					<Skeleton className='h-8 w-64' />
				</div>
				<Skeleton className='h-48 w-full' />
				<Skeleton className='h-96 w-full' />
			</div>
		);
	}

	if (!invoice) {
		return (
			<div className='flex flex-col items-center justify-center py-20'>
				<FileText className='h-16 w-16 text-muted-foreground/50 mb-4' />
				<h2 className='text-xl font-semibold mb-2'>Faktura topilmadi</h2>
				<p className='text-muted-foreground mb-4'>Ushbu ID bilan faktura mavjud emas</p>
				<Button onClick={() => navigate('/purchase-invoices')}>
					<ArrowLeft className='mr-2 h-4 w-4' />
					Orqaga qaytish
				</Button>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Button variant='ghost' size='icon' onClick={() => navigate('/purchase-invoices')}>
						<ArrowLeft className='h-5 w-5' />
					</Button>
					<div>
						<h1 className='text-xl font-bold tracking-tight'>Faktura #{invoice.id}</h1>
						<p className='text-muted-foreground'>
							{moment(invoice.date).format('DD.MM.YYYY')} sanasida kiritilgan
						</p>
					</div>
				</div>
				<Badge variant={invoice.type === 0 ? 'default' : 'destructive'} className='text-sm'>
					{invoice.type === 0 ? 'Tovar kirimi' : 'Vozvrat'}
				</Badge>
			</div>

			{/* Faktura ma'lumotlari */}
			<Card>
				<CardHeader className='pb-4'>
					<CardTitle className='flex items-center gap-2 text-lg'>
						<FileText className='h-5 w-5 text-blue-600' />
						Faktura ma'lumotlari
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
						{/* Sana */}
						<div className='flex items-start gap-3'>
							<div className='p-2 bg-blue-100 rounded-lg'>
								<Calendar className='h-4 w-4 text-blue-600' />
							</div>
							<div>
								<p className='text-sm text-muted-foreground'>Sana</p>
								<p className='font-medium'>{moment(invoice.date).format('DD.MM.YYYY')}</p>
							</div>
						</div>

						{/* Ta'minotchi */}
						<div className='flex items-start gap-3'>
							<div className='p-2 bg-green-100 rounded-lg'>
								<Truck className='h-4 w-4 text-green-600' />
							</div>
							<div>
								<p className='text-sm text-muted-foreground'>Ta'minotchi</p>
								<p className='font-medium'>{invoice.supplier_detail?.name || '-'}</p>
							</div>
						</div>

						{/* Filial */}
						<div className='flex items-start gap-3'>
							<div className='p-2 bg-purple-100 rounded-lg'>
								<Building2 className='h-4 w-4 text-purple-600' />
							</div>
							<div>
								<p className='text-sm text-muted-foreground'>Filial</p>
								<p className='font-medium'>{invoice.filial_detail?.name || '-'}</p>
							</div>
						</div>

						{/* Ombor */}
						<div className='flex items-start gap-3'>
							<div className='p-2 bg-orange-100 rounded-lg'>
								<Warehouse className='h-4 w-4 text-orange-600' />
							</div>
							<div>
								<p className='text-sm text-muted-foreground'>Ombor</p>
								<p className='font-medium'>{invoice.sklad_detail?.name || '-'}</p>
							</div>
						</div>

						{/* Xodim */}
						<div className='flex items-start gap-3'>
							<div className='p-2 bg-cyan-100 rounded-lg'>
								<User className='h-4 w-4 text-cyan-600' />
							</div>
							<div>
								<p className='text-sm text-muted-foreground'>Xodim</p>
								<p className='font-medium'>{invoice.employee_detail?.fullname || '-'}</p>
							</div>
						</div>

						{/* Mahsulotlar soni */}
						<div className='flex items-start gap-3'>
							<div className='p-2 bg-indigo-100 rounded-lg'>
								<Hash className='h-4 w-4 text-indigo-600' />
							</div>
							<div>
								<p className='text-sm text-muted-foreground'>Mahsulotlar soni</p>
								<p className='font-medium'>{invoice.product_count} ta</p>
							</div>
						</div>

						{/* Jami summa */}
						<div className='flex items-start gap-3'>
							<div className='p-2 bg-emerald-100 rounded-lg'>
								<DollarSign className='h-4 w-4 text-emerald-600' />
							</div>
							<div>
								<p className='text-sm text-muted-foreground'>Jami summa</p>
								<p className='font-medium text-emerald-600'>
									${formatDollar(invoice.all_product_summa)}
								</p>
							</div>
						</div>
					</div>

					{/* To'lov ma'lumotlari */}
					{(invoice.given_summa_dollar > 0 ||
						invoice.given_summa_naqt > 0 ||
						invoice.given_summa_terminal > 0 ||
						invoice.given_summa_transfer > 0) && (
						<div className='mt-6 pt-6 border-t'>
							<h4 className='font-medium mb-4'>To'lov ma'lumotlari</h4>
							<div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
								{invoice.given_summa_dollar > 0 && (
									<div className='p-3 bg-green-50 rounded-lg'>
										<p className='text-xs text-muted-foreground'>Dollar</p>
										<p className='font-semibold text-green-600'>
											${formatDollar(invoice.given_summa_dollar)}
										</p>
									</div>
								)}
								{invoice.given_summa_naqt > 0 && (
									<div className='p-3 bg-blue-50 rounded-lg'>
										<p className='text-xs text-muted-foreground'>Naqd</p>
										<p className='font-semibold text-blue-600'>
											{formatCurrency(invoice.given_summa_naqt)} so'm
										</p>
									</div>
								)}
								{invoice.given_summa_terminal > 0 && (
									<div className='p-3 bg-purple-50 rounded-lg'>
										<p className='text-xs text-muted-foreground'>Terminal</p>
										<p className='font-semibold text-purple-600'>
											{formatCurrency(invoice.given_summa_terminal)} so'm
										</p>
									</div>
								)}
								{invoice.given_summa_transfer > 0 && (
									<div className='p-3 bg-orange-50 rounded-lg'>
										<p className='text-xs text-muted-foreground'>Transfer</p>
										<p className='font-semibold text-orange-600'>
											{formatCurrency(invoice.given_summa_transfer)} so'm
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Qarz ma'lumotlari */}
					{(invoice.total_debt_old > 0 || invoice.total_debt > 0) && (
						<div className='mt-6 pt-6 border-t'>
							<h4 className='font-medium mb-4'>Qarz ma'lumotlari</h4>
							<div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
								<div className='p-3 bg-gray-50 rounded-lg'>
									<p className='text-xs text-muted-foreground'>Eski qarz</p>
									<p className='font-semibold'>${formatDollar(invoice.total_debt_old)}</p>
								</div>
								<div className='p-3 bg-red-50 rounded-lg'>
									<p className='text-xs text-muted-foreground'>Qolgan qarz</p>
									<p className='font-semibold text-red-600'>${formatDollar(invoice.total_debt)}</p>
								</div>
								<div className='p-3 bg-amber-50 rounded-lg'>
									<p className='text-xs text-muted-foreground'>Bugungi qarz</p>
									<p className='font-semibold text-amber-600'>
										${formatDollar(invoice.total_debt_today)}
									</p>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Mahsulotlar ro'yxati */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Package className='h-5 w-5' />
						Mahsulotlar
					</CardTitle>
					<CardDescription>Fakturaga kiritilgan mahsulotlar ro'yxati</CardDescription>
				</CardHeader>
				<CardContent>
					{isProductsLoading ? (
						<div className='space-y-2'>
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className='h-12 w-full' />
							))}
						</div>
					) : productHistories.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg'>
							<Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
							<p className='text-muted-foreground'>Mahsulotlar topilmadi</p>
						</div>
					) : (
						<>
							<div className='rounded-md border'>
								<Table>
										<TableHeader>
											<TableRow>
												<TableHead className='w-[50px]'>#</TableHead>
												<TableHead>Bo'lim</TableHead>
												<TableHead>Kategoriya turi</TableHead>
												<TableHead>Brend</TableHead>
												<TableHead>Mahsulot</TableHead>
												<TableHead>O'lcham</TableHead>
												<TableHead>Filial</TableHead>
											<TableHead className='text-right'>Miqdori</TableHead>
											<TableHead className='text-right'>Narxi ($)</TableHead>
											<TableHead className='text-right'>Dona narxi ($)</TableHead>
											<TableHead className='text-right'>Optom narxi ($)</TableHead>
											<TableHead className='text-right'>Min narx ($)</TableHead>
											<TableHead className='text-right'>Jami ($)</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{productHistories.map((p, index) => {
											const realPrice =
												typeof p.real_price === 'string'
													? parseFloat(p.real_price)
													: p.real_price;
											return (
												<TableRow key={p.id}>
													<TableCell className='text-muted-foreground'>{index + 1}</TableCell>
													<TableCell>{p.branch_detail?.name || '-'}</TableCell>
													<TableCell>{p.branch_category_detail?.name ?? '-'}</TableCell>
													<TableCell>{p.model_detail?.name || '-'}</TableCell>
													<TableCell className='font-medium'>
														{p.type_detail?.name || '-'}
													</TableCell>
													<TableCell>{p.size_detail?.size ?? '-'}</TableCell>
													<TableCell>{p.filial_detail?.name || '-'}</TableCell>
													<TableCell className='text-right'>{p.count}</TableCell>
													<TableCell className='text-right'>
														${formatDollar(p.real_price)}
													</TableCell>
													<TableCell className='text-right'>
														${formatDollar(p.unit_price)}
													</TableCell>
													<TableCell className='text-right'>
														${formatDollar(p.wholesale_price)}
													</TableCell>
													<TableCell className='text-right'>
														${formatDollar(p.min_price)}
													</TableCell>
													<TableCell className='text-right font-semibold'>
														${formatDollar(p.count * (realPrice || 0))}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>

							{/* Jami */}
							<div className='mt-4 flex justify-end'>
								<div className='bg-muted p-4 rounded-lg min-w-[250px]'>
									<div className='flex items-center justify-between gap-4 mb-2'>
										<span className='text-muted-foreground'>Mahsulotlar:</span>
										<Badge variant='outline'>{productHistories.length} ta</Badge>
									</div>
									<div className='flex items-center justify-between gap-4 mb-2'>
										<span className='text-muted-foreground'>Jami miqdor:</span>
										<span className='font-medium'>{formatCurrency(totalCount)}</span>
									</div>
									<div className='flex items-center justify-between gap-4 pt-2 border-t'>
										<span className='text-muted-foreground'>Jami summa:</span>
										<span className='text-xl font-bold text-green-600'>
											${formatDollar(totalSum)}
										</span>
									</div>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
