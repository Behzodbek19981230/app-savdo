import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
	Loader2,
	Banknote,
	CreditCard,
	ChevronLeft,
	Printer,
	User,
	Upload,
	AlertTriangle,
	Check,
	X,
	Pencil,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { renderReceiptHtml } from '@/components/Receipt';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
	DialogClose,
	DialogTrigger,
} from '@/components/ui/dialog';
import { OrderResponse, orderService } from '@/services';
import { orderHistoryProductService } from '@/services/orderHistoryProduct.service';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ProductByModel {
	model_id: number;
	model: string;
	product: any[];
}

interface OrderProductsByModelResponse {
	order_history: OrderResponse;
	products: ProductByModel[];
}

/** Inline editable cell for given_count */
function GivenCountCell({
	productId,
	count,
	givenCount,
	onUpdated,
}: {
	productId: number;
	count: number;
	givenCount: number;
	onUpdated: (productId: number, newValue: number) => void;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [value, setValue] = useState(String(givenCount));
	const [isSaving, setIsSaving] = useState(false);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const isDifferent = givenCount !== count;

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleSave = async () => {
		const parsed = Number(value);
		if (isNaN(parsed) || parsed < 0) {
			setValue(String(givenCount));
			setIsEditing(false);
			return;
		}
		if (parsed === givenCount) {
			setIsEditing(false);
			return;
		}
		setIsSaving(true);
		try {
			await orderHistoryProductService.updateGivenCount(productId, parsed);
			onUpdated(productId, parsed);
			toast({ title: 'Yangilandi', description: `Berilgan soni: ${parsed}` });
		} catch (err: any) {
			console.error(err);
			toast({ title: 'Xatolik', description: 'Berilgan sonini yangilashda xatolik', variant: 'destructive' });
			setValue(String(givenCount));
		} finally {
			setIsSaving(false);
			setIsEditing(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') handleSave();
		if (e.key === 'Escape') {
			setValue(String(givenCount));
			setIsEditing(false);
		}
	};

	if (isEditing) {
		return (
			<div className='flex items-center justify-end gap-1'>
				<Input
					ref={inputRef}
					type='number'
					min={0}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleSave}
					disabled={isSaving}
					className='h-7 w-20 text-right text-xs px-1.5'
				/>
				{isSaving && <Loader2 className='h-3.5 w-3.5 animate-spin text-muted-foreground' />}
			</div>
		);
	}

	return (
		<div
			className='flex items-center justify-end gap-1.5 cursor-pointer group/cell'
			onClick={() => setIsEditing(true)}
			title='Bosib tahrirlang'
		>
			<Badge variant={isDifferent ? 'destructive' : 'default'}>{givenCount}</Badge>
			{isDifferent && (
				<AlertTriangle
					className='h-4.5 w-4.5 text-red-500 flex-shrink-0'
					title={`Soni: ${count}, Berilgan: ${givenCount}`}
				/>
			)}
			<span className='inline-flex items-center justify-center h-7 w-6 rounded bg-muted/80 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity'>
				<Pencil className='h-3.5 w-3.5' />
			</span>
		</div>
	);
}

export function OrderShowPage() {
	const { id } = useParams<{ id: string }>();
	const [data, setData] = useState<OrderProductsByModelResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const printRef = useRef<HTMLDivElement | null>(null);

	const handleBack = () => window.history.back();

	/** Update given_count locally after successful API call */
	const handleGivenCountUpdated = (productId: number, newValue: number) => {
		setData((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				products: prev.products.map((group) => ({
					...group,
					product: group.product.map((p: any) => (p.id === productId ? { ...p, given_count: newValue } : p)),
				})),
			};
		});
	};

	const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
	const [receiptHtmlPreview, setReceiptHtmlPreview] = useState<string>('');

	const buildReceiptHtml = (role: 'hodim' | 'mijoz') => {
		try {
			const items = products.flatMap((g) =>
				g.product.map((p: any) => {
					const usd = Number(p.price_dollar || 0);
					const priceUz = usd * (Number(order_history.exchange_rate) || 1);
					const count = Number(p.count || 0);
					return {
						id: p.id,
						modelName: g.model,
						name: p.branch_category_detail?.name || p.type_detail?.name || '-',
						joy: p.sklad_detail?.name || 'Ombor',
						quantity: count,
						unit: p.type_detail?.name || p.unit || '-',
						price: priceUz,
						totalPrice: priceUz * count,
						stock: p.stock || 0,
					} as any;
				}),
			);

			const totalAmount = Number(order_history.all_product_summa || 0);
			const usdRate = Number(order_history.exchange_rate) || 1;
			const totalPaidUZS =
				Number(order_history.summa_naqt || 0) +
				Number(order_history.summa_dollar || 0) * usdRate +
				Number(order_history.summa_transfer || 0) +
				Number(order_history.summa_terminal || 0);

			return renderReceiptHtml({
				items,
				totalAmount,
				usdAmount: (totalAmount / usdRate).toFixed(2),
				usdRate,
				customer: {
					name: order_history.client_detail?.full_name || '',
				},
				kassirName: order_history.created_by_detail?.full_name || '',
				orderNumber: String(order_history.id),
				date: order_history.created_time ? new Date(order_history.created_time) : new Date(),
				paidAmount: totalPaidUZS,
				remainingDebt: Number(order_history.client_detail?.total_debt || 0) * usdRate,
				filialLogo: order_history.order_filial_detail?.logo || null,
				filialName: order_history.order_filial_detail?.name || 'Elegant',
				filialAddress: order_history.order_filial_detail?.address || '',
				filialPhone: order_history.order_filial_detail?.phone_number || '',
				hodimLayout: role === 'hodim',
			});
		} catch (e) {
			console.error('Failed to build receipt html', e);
			return '';
		}
	};

	const openPrintPreview = (role: 'hodim' | 'mijoz') => {
		const html = buildReceiptHtml(role);
		setReceiptHtmlPreview(html);
		setIsPrintDialogOpen(true);
	};

	const printPreview = () => {
		if (!receiptHtmlPreview) return;
		const w = window.open('', '_blank', 'width=900,height=700');
		if (!w) return;
		w.document.write(receiptHtmlPreview);
		w.document.close();
		w.focus();
		setTimeout(() => {
			try {
				w.print();
				w.close();
			} catch (e) {
				console.error('Print failed', e);
			}
		}, 300);
	};

	useEffect(() => {
		const loadData = async () => {
			if (!id) return;
			setIsLoading(true);
			try {
				const response = await orderService.getOrderProductsByModel(parseInt(id));
				setData(response);
			} catch (error: any) {
				console.error('Failed to load order data:', error);
				const errorMessage =
					error?.response?.data?.detail || error?.message || "Ma'lumotlarni yuklashda xatolik";
				toast({
					title: 'Xatolik',
					description: errorMessage,
					variant: 'destructive',
				});
			} finally {
				setIsLoading(false);
			}
		};
		loadData();
	}, [id]);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-full'>
				<Loader2 className='w-8 h-8 animate-spin text-indigo-600' />
			</div>
		);
	}

	if (!data) {
		return <div className='p-6 text-center text-gray-500'>Ma'lumotlar topilmadi</div>;
	}

	const { order_history, products } = data;
	const usdRate = order_history?.exchange_rate != null ? Number(order_history.exchange_rate) : 0;
	const totalPaidUZS =
		Number(order_history.summa_naqt || 0) +
		Number(order_history.summa_dollar || 0) * usdRate +
		Number(order_history.summa_transfer || 0) +
		Number(order_history.summa_terminal || 0);
	const totalPaidUSD = usdRate ? totalPaidUZS / usdRate : 0;

	return (
		<div ref={printRef} className='h-full overflow-y-auto p-4 sm:p-6'>
			{/* Order History Ma'lumotlari */}
			<div className='bg-white dark:bg-card rounded-lg shadow-md dark:shadow-md border border-border p-3 sm:p-4 mb-4'>
				<div className='flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 pb-2 border-b border-border'>
					{/* Left: client name + phone */}
					<div className='flex items-center gap-3 min-w-0'>
						<div className='min-w-0'>
							<div className='text-xs font-semibold text-gray-800 dark:text-foreground truncate'>
								{order_history.client_detail?.full_name || "Noma'lum"}
							</div>
							<div className='text-xs text-gray-500 dark:text-muted-foreground truncate'>
								{order_history.client_detail?.phone_number || ''}
							</div>
						</div>
					</div>

					{/* Center: timestamp (hidden on very small screens) */}
					<div className='hidden sm:block text-xs text-gray-500 dark:text-muted-foreground'>
						<div className='text-xs text-gray-500 dark:text-muted-foreground'>Qo'shilgan vaqti:</div>

						{new Date(order_history.created_time).toLocaleTimeString('ru-RU', {
							day: '2-digit',
							month: '2-digit',
							year: '2-digit',
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
						})}
					</div>

					{/* Right: compact actions */}
					<div className='flex items-center gap-2'>
						<Button
							variant='ghost'
							size='sm'
							className='px-2 py-2 flex items-center gap-2'
							onClick={handleBack}
						>
							<ChevronLeft className='h-4 w-4 text-rose-600' />
							<span className='text-xs text-rose-700 dark:text-rose-300'>Orqaga</span>
						</Button>

						<Button
							variant='outline'
							size='sm'
							className='px-2 py-2 flex items-center gap-2'
							onClick={() => openPrintPreview('hodim')}
						>
							<Printer className='h-4 w-4 text-indigo-600' />
							<span className='text-xs text-indigo-700'>Hodim uchun</span>
						</Button>

						<Button
							variant='outline'
							size='sm'
							className='px-2 py-2 flex items-center gap-2'
							onClick={() => openPrintPreview('mijoz')}
						>
							<User className='h-4 w-4 text-emerald-600' />
							<span className='text-xs text-emerald-700'>Mijoz uchun</span>
						</Button>
					</div>
				</div>

				{/* Print Preview Dialog for Hodim */}
				<Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
					<DialogContent className='max-w-5xl w-[95vw] sm:w-[90vw] lg:w-[80vw]'>
						<div className='overflow-auto max-h-[70vh] my-2'>
							{receiptHtmlPreview ? (
								<div dangerouslySetInnerHTML={{ __html: receiptHtmlPreview }} />
							) : (
								<div className='p-4 text-xs text-muted-foreground'>Preview mavjud emas</div>
							)}
						</div>
						<DialogFooter>
							<div className='flex items-center gap-2 ml-auto'>
								<Button variant='secondary' onClick={printPreview}>
									<Printer className='h-4 w-4 mr-2' />
									Chop etish
								</Button>
								<Button variant='ghost' onClick={() => setIsPrintDialogOpen(false)}>
									Yopish
								</Button>
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3'>
					{/* Kassir */}
					<div className='bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/20 dark:to-emerald-500/20 p-2 rounded border border-green-200 dark:border-green-500/30'>
						<p className='text-[10px] font-semibold text-green-600 dark:text-green-400 mb-1 uppercase tracking-wide'>
							Kassir
						</p>
						<p className='font-bold text-gray-800 dark:text-foreground text-xs mb-0.5'>
							{order_history.created_by_detail?.full_name || "Noma'lum"}
						</p>
						<p className='text-xs text-gray-600 dark:text-muted-foreground'>
							{order_history.created_by_detail?.phone_number || ''}
						</p>
					</div>

					{/* Filial */}
					<div className='bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/20 p-2 rounded border border-amber-200 dark:border-amber-500/30'>
						<p className='text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wide'>
							Filial
						</p>
						<p className='font-bold text-gray-800 dark:text-foreground text-xs'>
							{order_history.order_filial_detail?.name || "Noma'lum"}
						</p>
					</div>

					{/* Valyuta kursi */}
					<div className='bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-500/20 dark:to-teal-500/20 p-2 rounded border border-cyan-200 dark:border-cyan-500/30'>
						<p className='text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 mb-1 uppercase tracking-wide'>
							Valyuta kursi
						</p>
						<p className='font-bold text-gray-800 dark:text-foreground text-xs'>
							1 USD = {Number(usdRate).toLocaleString()} UZS
						</p>
					</div>

					{/* Status */}
					<div className='bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-500/20 dark:to-slate-500/20 p-2 rounded border border-gray-200 dark:border-gray-500/30'>
						<p className='text-[10px] font-semibold text-gray-600 dark:text-muted-foreground mb-1 uppercase tracking-wide'>
							Holat
						</p>
						<div className='space-y-0.5'>
							<div className='flex items-center gap-1.5'>
								<span
									className={`w-1.5 h-1.5 rounded-full ${
										order_history.status_order_dukon
											? 'bg-green-500'
											: 'bg-gray-300 dark:bg-gray-600'
									}`}
								></span>
								<span className='text-xs text-gray-700 dark:text-foreground'>
									Dukon: {order_history.status_order_dukon ? 'Tayyor' : 'Kutilmoqda'}
								</span>
							</div>
							<div className='flex items-center gap-1.5'>
								<span
									className={`w-1.5 h-1.5 rounded-full ${
										order_history.status_order_sklad
											? 'bg-green-500'
											: 'bg-gray-300 dark:bg-gray-600'
									}`}
								></span>
								<span className='text-xs text-gray-700 dark:text-foreground'>
									Sklad: {order_history.status_order_sklad ? 'Tayyor' : 'Kutilmoqda'}
								</span>
							</div>
						</div>
					</div>

					{/* Jami summa */}
					<div className='bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/20 dark:to-blue-500/20 p-2 rounded border-2 border-indigo-300 dark:border-indigo-500/30'>
						<p className='text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wide'>
							Jami summa
						</p>
						<p className='font-bold text-indigo-700 dark:text-indigo-300 text-base mb-0.5'>
							{formatNumber(Number(order_history.all_product_summa || 0) / usdRate)} USD
						</p>
						<p className='text-xs font-semibold text-indigo-600 dark:text-indigo-300'>
							{Number(order_history.all_product_summa || 0).toLocaleString()} UZS
						</p>
					</div>

					{/* Chegirma */}
					<div className='bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-500/20 dark:to-red-500/20 p-2 rounded border border-rose-200 dark:border-rose-500/30'>
						<p className='text-[10px] font-semibold text-rose-600 dark:text-rose-400 mb-1 uppercase tracking-wide'>
							Chegirma
						</p>
						<p className='font-bold text-rose-700 dark:text-rose-300 text-base'>
							{Number(order_history.discount_amount || 0).toLocaleString()} UZS
						</p>
						{Number(order_history.discount_amount || 0) > 0 && (
							<p className='text-[10px] text-rose-600 dark:text-rose-400 mt-0.5'>
								{(
									(Number(order_history.discount_amount) /
										Number(order_history.all_product_summa || 1)) *
									100
								).toFixed(1)}
								%
							</p>
						)}
					</div>

					{/* To'lanishi kerak */}
					{/* To'lanishi kerak va Jami to'landi yonma-yon */}
					{(Number(order_history.all_product_summa || 0) - Number(order_history.discount_amount || 0) > 0 ||
						totalPaidUZS > 0) && (
						<div className='bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-500/20 dark:to-green-500/20 p-2 rounded border-2 border-emerald-300 dark:border-emerald-500/30'>
							<p className='text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wide'>
								To'lanishi kerak
							</p>
							<p className='font-bold text-emerald-700 dark:text-emerald-300 text-base mb-0.5'>
								{formatNumber(
									(Number(order_history.all_product_summa || 0) -
										Number(order_history.discount_amount || 0)) /
										usdRate,
								)}{' '}
								USD
							</p>
							<p className='text-xs font-semibold text-emerald-600 dark:text-emerald-300'>
								{(
									Number(order_history.all_product_summa || 0) -
									Number(order_history.discount_amount || 0)
								).toLocaleString()}{' '}
								UZS
							</p>
						</div>
					)}

					{/* Jami to'landi */}
					<div className='bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/20 dark:to-blue-500/20 p-2 rounded border-2 border-indigo-300 dark:border-indigo-500/30'>
						<p className='text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wide'>
							Jami to'landi
						</p>
						<div className='text-right'>
							<div className='font-bold text-lg sm:text-xl text-indigo-700 dark:text-indigo-300'>
								{totalPaidUSD ? formatNumber(totalPaidUSD) : '0.00'} USD
							</div>
							<div className='text-xs sm:text-base text-gray-500 dark:text-muted-foreground'>
								{totalPaidUZS.toLocaleString()} UZS
							</div>
						</div>
					</div>
					{/* Qarz ma'lumotlari */}
					<div className='bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-500/20 dark:to-pink-500/20 p-2 rounded border border-red-200 dark:border-red-500/30'>
						<p className='text-[10px] font-semibold text-red-600 dark:text-red-400 mb-2 uppercase tracking-wide'>
							Qarz ma'lumotlari
						</p>
						<p className='font-bold text-red-700 dark:text-red-300 text-base'>
							{formatNumber(Number(order_history.client_detail?.total_debt || 0))} USD
						</p>
						<p className='text-xs text-red-600 dark:text-red-300 mt-0.5'>
							{(Number(order_history.client_detail?.total_debt || 0) * usdRate).toLocaleString()} UZS
						</p>
					</div>

					{/* Foyda */}
					{Number(order_history.all_profit_dollar || 0) > 0 && (
						<div className='bg-gradient-to-br from-lime-50 to-green-50 dark:from-lime-500/20 dark:to-green-500/20 p-2 rounded border border-lime-200 dark:border-lime-500/30'>
							<p className='text-[10px] font-semibold text-lime-600 dark:text-lime-400 mb-1 uppercase tracking-wide'>
								Foyda
							</p>
							<p className='font-bold text-lime-700 dark:text-lime-300 text-base'>
								{formatNumber(Number(order_history.all_profit_dollar))} USD
							</p>
							<p className='text-xs text-lime-600 dark:text-lime-300 mt-0.5'>
								{(Number(order_history.all_profit_dollar) * usdRate).toLocaleString()} UZS
							</p>
						</div>
					)}

					{/* To'lov usullari */}
					<div className='md:col-span-2 lg:col-span-3 xl:col-span-5'>
						<p className='text-[10px] font-semibold text-gray-600 dark:text-muted-foreground mb-2 uppercase tracking-wide'>
							To'lov usullari
						</p>
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2'>
							{Number(order_history.summa_dollar || 0) > 0 && (
								<div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200 dark:border-border'>
									<div className='bg-gradient-to-r from-green-700 to-emerald-800 text-white p-1.5 sm:p-2 flex justify-between items-center'>
										<div className='flex items-center space-x-1.5'>
											<div className='bg-green-100 p-1 rounded'>
												<Banknote className='text-green-700 w-3 h-3' />
											</div>
											<span className='font-medium text-[10px] sm:text-xs'>US dollar naqd</span>
										</div>
									</div>
									<div className='p-1.5 sm:p-2 bg-white dark:bg-card'>
										<div className='text-right flex items-center justify-end gap-1'>
											<p className='font-semibold text-xs text-gray-800 dark:text-foreground'>
												{formatNumber(Number(order_history.summa_dollar))}
											</p>
											<span className='text-[10px] font-medium text-gray-500 dark:text-muted-foreground'>
												USD
											</span>
											<p className='text-[10px] text-gray-600 dark:text-muted-foreground mt-0.5'>
												({Number(order_history.summa_dollar) * usdRate} UZS)
											</p>
										</div>
									</div>
								</div>
							)}
							{Number(order_history.summa_naqt || 0) > 0 && (
								<div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200 dark:border-border'>
									<div className='bg-gradient-to-r from-lime-500 to-green-600 text-white p-1.5 sm:p-2 flex justify-between items-center'>
										<div className='flex items-center space-x-1.5'>
											<div className='bg-lime-100 p-1 rounded'>
												<Banknote className='text-lime-700 w-3 h-3' />
											</div>
											<span className='font-medium text-[10px] sm:text-xs'>Naqd</span>
										</div>
									</div>
									<div className='p-1.5 sm:p-2 bg-white dark:bg-card'>
										<div className='text-right flex items-center justify-end gap-1'>
											<p className='font-semibold text-xs text-gray-800 dark:text-foreground'>
												{Number(order_history.summa_naqt).toLocaleString()}
											</p>
											<span className='text-[10px] font-medium text-gray-500 dark:text-muted-foreground'>
												UZS
											</span>
										</div>
									</div>
								</div>
							)}

							{Number(order_history.summa_transfer || 0) > 0 && (
								<div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200 dark:border-border'>
									<div className='bg-gradient-to-r from-blue-400 to-cyan-500 text-white p-1.5 sm:p-2 flex justify-between items-center'>
										<div className='flex items-center space-x-1.5'>
											<div className='bg-blue-100 p-1 rounded'>
												<CreditCard className='text-blue-700 w-3 h-3' />
											</div>
											<span className='font-medium text-[10px] sm:text-xs'>Plastik perevod</span>
										</div>
									</div>
									<div className='p-1.5 sm:p-2 bg-white dark:bg-card'>
										<div className='text-right flex items-center justify-end gap-1'>
											<p className='font-semibold text-xs text-gray-800 dark:text-foreground'>
												{Number(order_history.summa_transfer).toLocaleString()}
											</p>
											<span className='text-[10px] font-medium text-gray-500 dark:text-muted-foreground'>
												UZS
											</span>
										</div>
									</div>
								</div>
							)}
							{Number(order_history.summa_terminal || 0) > 0 && (
								<div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200 dark:border-border'>
									<div className='bg-gradient-to-r from-blue-400 to-cyan-500 text-white p-1.5 sm:p-2 flex justify-between items-center'>
										<div className='flex items-center space-x-1.5'>
											<div className='bg-blue-100 p-1 rounded'>
												<CreditCard className='text-blue-700 w-3 h-3' />
											</div>
											<span className='font-medium text-[10px] sm:text-xs'>Terminal</span>
										</div>
									</div>
									<div className='p-1.5 sm:p-2 bg-white dark:bg-card'>
										<div className='text-right flex items-center justify-end gap-1'>
											<p className='font-semibold text-xs text-gray-800 dark:text-foreground'>
												{Number(order_history.summa_terminal).toLocaleString()}
											</p>
											<span className='text-[10px] font-medium text-gray-500 dark:text-muted-foreground'>
												UZS
											</span>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Qaytim */}
					{(Number(order_history.zdacha_dollar || 0) > 0 || Number(order_history.zdacha_som || 0) > 0) && (
						<div className='bg-gradient-to-br from-yellow-50 to-amber-50 dark:bg-muted/50 p-2 rounded border border-yellow-200 dark:border-border md:col-span-2 lg:col-span-3 xl:col-span-5'>
							<p className='text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 mb-2 uppercase tracking-wide'>
								Qaytim
							</p>
							<div className='grid grid-cols-2 gap-2'>
								{Number(order_history.zdacha_dollar || 0) > 0 && (
									<div className='bg-white dark:bg-card p-2 rounded border border-yellow-100 dark:border-border'>
										<p className='text-[10px] text-gray-500 dark:text-muted-foreground mb-0.5'>
											Qaytim dollarda
										</p>
										<p className='font-bold text-gray-800 dark:text-foreground text-xs'>
											{formatNumber(Number(order_history.zdacha_dollar))} USD
										</p>
									</div>
								)}
								{Number(order_history.zdacha_som || 0) > 0 && (
									<div className='bg-white dark:bg-card p-2 rounded border border-yellow-100 dark:border-border'>
										<p className='text-[10px] text-gray-500 dark:text-muted-foreground mb-0.5'>
											Qaytim so'mda
										</p>
										<p className='font-bold text-gray-800 dark:text-foreground text-xs'>
											{Number(order_history.zdacha_som).toLocaleString()} UZS
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Izoh */}
					{order_history.note && (
						<div className='bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-500/20 dark:to-gray-500/20 p-2 rounded border border-slate-200 dark:border-slate-500/30 md:col-span-2 lg:col-span-3 xl:col-span-5'>
							<p className='text-[10px] font-semibold text-slate-600 dark:text-muted-foreground mb-1 uppercase tracking-wide'>
								Izoh
							</p>
							<p className='text-xs text-gray-800 dark:text-foreground whitespace-pre-wrap'>
								{order_history.note}
							</p>
						</div>
					)}

					{/* Yetkazib beruvchi */}
					{order_history.driver_info && (
						<div className='bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-500/20 dark:to-cyan-500/20 p-2 rounded border border-teal-200 dark:border-teal-500/30 md:col-span-2 lg:col-span-3 xl:col-span-5'>
							<p className='text-[10px] font-semibold text-teal-600 dark:text-teal-400 mb-1 uppercase tracking-wide'>
								Yetkazib beruvchi
							</p>
							<p className='text-xs text-gray-800 dark:text-foreground whitespace-pre-wrap'>
								{order_history.driver_info}
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Productlar - Model bo'yicha guruhlangan */}
			{products.length > 0 && (
				<div className='bg-white dark:bg-card rounded-lg shadow-md dark:shadow-md border border-border overflow-hidden'>
					<div className='overflow-x-auto'>
						<table className='w-full border-collapse text-xs'>
							<thead>
								<tr className='bg-gray-50 dark:bg-muted/50 border-b border-gray-200 dark:border-border'>
									<th className='px-1.5 py-2 sm:px-1.5 sm:py-2 text-left text-xs font-semibold text-gray-700 dark:text-foreground whitespace-nowrap'>
										#
									</th>
									<th className='px-1.5 py-2 sm:px-1.5 sm:py-2 text-left text-xs font-semibold text-gray-700 dark:text-foreground whitespace-nowrap'>
										Model
									</th>

									<th className='px-1.5 py-2 sm:px-1.5 sm:py-2 text-left text-xs font-semibold text-gray-700 dark:text-foreground whitespace-nowrap'>
										Joyi
									</th>
									<th className='px-1.5 py-2 sm:px-1.5 sm:py-2 text-left text-xs font-semibold text-gray-700 dark:text-foreground whitespace-nowrap'>
										Nomi
									</th>
									<th className='px-1.5 py-2 sm:px-1.5 sm:py-2 text-left text-xs font-semibold text-gray-700 dark:text-foreground whitespace-nowrap'>
										O'lchami
									</th>
									<th className='px-1.5 py-2 sm:px-1.5 sm:py-2 text-left text-xs font-semibold text-gray-700 dark:text-foreground whitespace-nowrap'>
										Tip
									</th>
									<th className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-right text-xs font-semibold text-gray-700 dark:text-foreground whitespace-nowrap'>
										Soni
									</th>
									<th className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-right text-xs font-semibold text-gray-700 dark:text-foreground whitespace-nowrap'>
										Berilgan soni
									</th>
									<th className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-right text-xs font-semibold text-gray-700 dark:text-foreground whitespace-nowrap'>
										Narxi ($)
									</th>
									<th className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-right text-xs font-semibold text-gray-700 dark:text-foreground whitespace-nowrap'>
										Asl Narxi ($)
									</th>
									<th className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-right text-xs font-semibold text-gray-700 dark:text-foreground whitespace-nowrap'>
										Foyda ($)
									</th>
								</tr>
							</thead>
							<tbody className='[&_tr:nth-child(even)]:bg-muted/30'>
								{products.map((group) => {
									let productIndex = 0;

									return group.product.map((product, idx) => {
										productIndex++;
										const realPrice = Number(product.real_price || 0);
										const priceDollar = Number(product.price_dollar || 0);
										const count = Number(product.count || 0);
										const profit = (priceDollar - realPrice) * count;

										return (
											<tr
												key={product.id}
												className='border-b border-gray-100 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors even:bg-muted/30'
											>
												<td className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-xs text-gray-600 dark:text-muted-foreground'>
													{productIndex}
												</td>
												{idx === 0 && (
													<td
														rowSpan={group.product.length}
														className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-xs text-gray-800 dark:text-foreground align-top'
													>
														<div className='flex items-start gap-2'>
															<span>{group.model}</span>
														</div>
													</td>
												)}

												<td className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-xs text-gray-800 dark:text-foreground'>
													{product.sklad_detail?.name || 'Ombor'}
												</td>
												<td className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-xs text-gray-800 dark:text-foreground'>
													{product.branch_category_detail?.name ||
														product.type_detail?.name ||
														'-'}
												</td>
												<td className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-xs text-gray-800 dark:text-foreground'>
													{product.size_detail?.size || '-'}
												</td>
												<td className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-xs text-gray-800 dark:text-foreground'>
													{product.type_detail?.name || '-'}
												</td>
												<td className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-xs text-gray-800 dark:text-foreground text-right'>
													{count}
												</td>
												<td className='px-1.5 py-0 sm:px-1.5 sm:py-0'>
													<GivenCountCell
														productId={product.id}
														count={count}
														givenCount={Number(product.given_count || 0)}
														onUpdated={handleGivenCountUpdated}
													/>
												</td>
												<td className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-xs text-gray-800 dark:text-foreground text-right'>
													{priceDollar.toFixed(2)}
												</td>
												<td className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-xs text-gray-800 dark:text-foreground text-right'>
													{realPrice.toFixed(2)}
												</td>
												<td className='px-1.5 py-0 sm:px-1.5 sm:py-0 text-xs font-semibold text-green-600 dark:text-green-400 text-right'>
													{profit.toFixed(2)}
												</td>
											</tr>
										);
									});
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
