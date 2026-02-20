import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Banknote, CreditCard, ChevronLeft, Printer, User, Upload } from 'lucide-react';
import { renderReceiptHtml } from '@/components/Receipt';
import { OrderResponse, orderService } from '@/services';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface ProductByModel {
	model_id: number;
	model: string;
	product: any[];
}

interface OrderProductsByModelResponse {
	order_history: OrderResponse;
	products: ProductByModel[];
}

export function OrderShowPage() {
	const { id } = useParams<{ id: string }>();
	const [data, setData] = useState<OrderProductsByModelResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const printRef = useRef<HTMLDivElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const handleBack = () => window.history.back();

	const printFor = (title: string) => {
		const content = printRef.current?.innerHTML;
		if (!content) return;
		const w = window.open('', '_blank', 'width=900,height=700');
		if (!w) return;
		w.document.write(`<!doctype html><html><head><title>${title}</title>`);
		w.document.write('</head><body>');
		w.document.write(
			`<h3 style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">${title}</h3>`,
		);
		w.document.write(content);
		w.document.write('</body></html>');
		w.document.close();
		w.focus();
		// give the new window a moment to render
		setTimeout(() => {
			try {
				w.print();
				w.close();
			} catch (e) {
				console.error('Print failed', e);
			}
		}, 300);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0] ?? null;
		setSelectedFile(f);
	};

	const handleUploadPdf = async () => {
		if (!selectedFile || !id) return;
		setIsUploading(true);
		try {
			const fd = new FormData();
			fd.append('file', selectedFile);

			// TODO: replace URL with real endpoint for uploading order PDFs
			// Example: await fetch(`/api/orders/${id}/upload-pdf`, { method: 'POST', body: fd });
			console.log('Would upload file for order', id, selectedFile.name);
			toast({ title: 'Fayl yuklandi', description: selectedFile.name, variant: 'success' });
			setSelectedFile(null);
			if (fileInputRef.current) fileInputRef.current.value = '';
		} catch (err) {
			console.error(err);
			toast({ title: 'Xatolik', description: 'Fayl yuklanmadi', variant: 'destructive' });
		} finally {
			setIsUploading(false);
		}
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
			<div className='bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 sm:p-4 mb-4'>
				<div className='flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700'>
					{/* Left: client name + phone */}
					<div className='flex items-center gap-3 min-w-0'>
						<div className='min-w-0'>
							<div className='text-sm font-semibold text-gray-800 dark:text-slate-100 truncate'>
								{order_history.client_detail?.full_name || "Noma'lum"}
							</div>
							<div className='text-xs text-gray-500 dark:text-gray-300 truncate'>
								{order_history.client_detail?.phone_number || ''}
							</div>
						</div>
					</div>

					{/* Center: timestamp (hidden on very small screens) */}
					<div className='hidden sm:block text-xs text-gray-500 dark:text-gray-400'>
						<div className='text-xs text-gray-500 dark:text-gray-400'>Qo'shilgan vaqti:</div>

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
							className='px-2 py-1 flex items-center gap-2'
							onClick={handleBack}
						>
							<ChevronLeft className='h-4 w-4 text-rose-600' />
							<span className='text-sm text-rose-700 dark:text-rose-300'>Orqaga</span>
						</Button>

						<Button
							variant='outline'
							size='sm'
							className='px-2 py-1 flex items-center gap-2'
							onClick={() => printFor(`Hodim uchun - Order #${order_history.id}`)}
						>
							<Printer className='h-4 w-4 text-indigo-600' />
							<span className='text-sm text-indigo-700'>Hodim uchun</span>
						</Button>

						<Button
							variant='outline'
							size='sm'
							className='px-2 py-1 flex items-center gap-2'
							onClick={() => {
								// Build printable receipt HTML using the Receipt helper
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
												quantity: count,
												unit: p.type_detail?.name || p.unit || '-',
												price: priceUz,
												totalPrice: priceUz * count,
											};
										}),
									);

									const totalAmount = Number(order_history.all_product_summa || 0);
									const usdRate = Number(order_history.exchange_rate) || 1;
									const totalPaidUZS =
										Number(order_history.summa_naqt || 0) +
										Number(order_history.summa_dollar || 0) * usdRate +
										Number(order_history.summa_transfer || 0) +
										Number(order_history.summa_terminal || 0);

									const receiptHtml = renderReceiptHtml({
										items,
										totalAmount,
										usdAmount: (totalAmount / usdRate).toFixed(2),
										usdRate,
										customer: {
											name: order_history.client_detail?.full_name || '',
										} as any,
										kassirName: order_history.created_by_detail?.full_name || '',
										orderNumber: String(order_history.id),
										date: new Date(order_history.created_time),
										paidAmount: totalPaidUZS,
										remainingDebt: Number(order_history.client_detail?.total_debt || 0) * usdRate,
										filialLogo: order_history.order_filial_detail?.logo || null,
									});

									const w = window.open('', '_blank', 'width=900,height=700');
									if (!w) return;
									w.document.write(receiptHtml);
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
								} catch (err) {
									console.error('Receipt print error', err);
								}
							}}
						>
							<User className='h-4 w-4 text-emerald-600' />
							<span className='text-sm text-emerald-700'>Mijoz uchun</span>
						</Button>

						{/* Upload PDF for hodim */}
						<div className='flex items-center gap-2'>
							<input
								type='file'
								accept='application/pdf'
								ref={fileInputRef}
								onChange={handleFileChange}
								className='hidden'
								id='order-pdf-upload'
							/>
							<label htmlFor='order-pdf-upload'>
								<Button variant='ghost' size='sm' className='px-2 py-1 flex items-center gap-2'>
									<Upload className='h-4 w-4 text-sky-600' />
									<span className='text-sm text-sky-700'>Fayl tanla</span>
								</Button>
							</label>
							{selectedFile && (
								<Button
									variant='secondary'
									size='sm'
									className='px-2 py-1 flex items-center gap-2'
									onClick={handleUploadPdf}
									disabled={isUploading}
								>
									<Upload className='h-4 w-4' />
									<span className='text-sm'>
										{isUploading ? 'Yuklanmoqda...' : selectedFile.name}
									</span>
								</Button>
							)}
						</div>
					</div>
				</div>

				<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3'>
					{/* Kassir */}
					<div className='bg-gradient-to-br from-green-50 to-emerald-50 p-2 rounded border border-green-200 dark:from-slate-800 dark:to-slate-700 dark:border-slate-700'>
						<p className='text-[10px] font-semibold text-green-600 mb-1 uppercase tracking-wide'>Kassir</p>
						<p className='font-bold text-gray-800 dark:text-slate-100 text-sm mb-0.5'>
							{order_history.created_by_detail?.full_name || "Noma'lum"}
						</p>
						<p className='text-xs text-gray-600 dark:text-gray-300'>
							{order_history.created_by_detail?.phone_number || ''}
						</p>
					</div>

					{/* Filial */}
					<div className='bg-gradient-to-br from-amber-50 to-orange-50 p-2 rounded border border-amber-200 dark:from-slate-800 dark:to-slate-700 dark:border-slate-700'>
						<p className='text-[10px] font-semibold text-amber-600 mb-1 uppercase tracking-wide'>Filial</p>
						<p className='font-bold text-gray-800 dark:text-slate-100 text-sm'>
							{order_history.order_filial_detail?.name || "Noma'lum"}
						</p>
					</div>

					{/* Valyuta kursi */}
					<div className='bg-gradient-to-br from-cyan-50 to-teal-50 p-2 rounded border border-cyan-200 dark:from-slate-800 dark:to-slate-700 dark:border-slate-700'>
						<p className='text-[10px] font-semibold text-cyan-600 mb-1 uppercase tracking-wide'>
							Valyuta kursi
						</p>
						<p className='font-bold text-gray-800 dark:text-slate-100 text-sm'>
							1 USD = {Number(usdRate).toLocaleString()} UZS
						</p>
					</div>

					{/* Status */}
					<div className='bg-gradient-to-br from-gray-50 to-slate-50 p-2 rounded border border-gray-200 dark:from-slate-800 dark:to-slate-700 dark:border-slate-700'>
						<p className='text-[10px] font-semibold text-gray-600 dark:text-gray-300 mb-1 uppercase tracking-wide'>
							Status
						</p>
						<div className='space-y-0.5'>
							<div className='flex items-center gap-1.5'>
								<span
									className={`w-1.5 h-1.5 rounded-full ${
										order_history.status_order_dukon ? 'bg-green-500' : 'bg-gray-300'
									}`}
								></span>
								<span className='text-xs text-gray-700 dark:text-gray-200'>
									Dukon: {order_history.status_order_dukon ? 'Tayyor' : 'Kutilmoqda'}
								</span>
							</div>
							<div className='flex items-center gap-1.5'>
								<span
									className={`w-1.5 h-1.5 rounded-full ${
										order_history.status_order_sklad ? 'bg-green-500' : 'bg-gray-300'
									}`}
								></span>
								<span className='text-xs text-gray-700 dark:text-gray-200'>
									Sklad: {order_history.status_order_sklad ? 'Tayyor' : 'Kutilmoqda'}
								</span>
							</div>
						</div>
					</div>

					{/* Jami summa */}
					<div className='bg-gradient-to-br from-indigo-50 to-blue-50 p-2 rounded border-2 border-indigo-300 dark:from-slate-800 dark:to-slate-700 dark:border-slate-700'>
						<p className='text-[10px] font-semibold text-indigo-600 mb-1 uppercase tracking-wide'>
							Jami summa
						</p>
						<p className='font-bold text-indigo-700 dark:text-indigo-200 text-base mb-0.5'>
							{(Number(order_history.all_product_summa || 0) / usdRate).toFixed(2)} USD
						</p>
						<p className='text-xs font-semibold text-indigo-600 dark:text-indigo-200'>
							{Number(order_history.all_product_summa || 0).toLocaleString()} UZS
						</p>
					</div>

					{/* Chegirma */}
					<div className='bg-gradient-to-br from-rose-50 to-red-50 p-2 rounded border border-rose-200 dark:from-slate-800 dark:to-slate-700 dark:border-slate-700'>
						<p className='text-[10px] font-semibold text-rose-600 mb-1 uppercase tracking-wide'>Chegirma</p>
						<p className='font-bold text-rose-700 dark:text-rose-200 text-base'>
							{Number(order_history.discount_amount || 0).toLocaleString()} UZS
						</p>
						{Number(order_history.discount_amount || 0) > 0 && (
							<p className='text-[10px] text-rose-600 mt-0.5'>
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
						<div className='bg-gradient-to-br from-emerald-50 to-green-50 p-2 rounded border-2 border-emerald-300 dark:from-slate-800 dark:to-slate-700 dark:border-slate-700'>
							<p className='text-[10px] font-semibold text-emerald-600 mb-1 uppercase tracking-wide'>
								To'lanishi kerak
							</p>
							<p className='font-bold text-emerald-700 dark:text-emerald-200 text-base mb-0.5'>
								{(
									(Number(order_history.all_product_summa || 0) -
										Number(order_history.discount_amount || 0)) /
									usdRate
								).toFixed(2)}{' '}
								USD
							</p>
							<p className='text-xs font-semibold text-emerald-600 dark:text-emerald-200'>
								{(
									Number(order_history.all_product_summa || 0) -
									Number(order_history.discount_amount || 0)
								).toLocaleString()}{' '}
								UZS
							</p>
						</div>
					)}

					{/* Jami to'landi */}
					<div className='bg-gradient-to-br from-indigo-50 to-blue-50 p-2 rounded border-2 border-indigo-300 dark:from-slate-800 dark:to-slate-700 dark:border-slate-700'>
						<p className='text-[10px] font-semibold text-indigo-600 mb-1 uppercase tracking-wide'>
							Jami to'landi
						</p>
						<div className='text-right'>
							<div className='font-bold text-lg sm:text-xl text-indigo-700'>
								{totalPaidUSD ? totalPaidUSD.toFixed(2) : '0.00'} USD
							</div>
							<div className='text-sm sm:text-base text-gray-500'>
								{totalPaidUZS.toLocaleString()} UZS
							</div>
						</div>
					</div>
					{/* Qarz ma'lumotlari */}
					<div className='bg-gradient-to-br from-red-50 to-pink-50 p-2 rounded border border-red-200 dark:from-slate-800 dark:to-slate-700 dark:border-slate-700 '>
						<p className='text-[10px] font-semibold text-red-600 mb-2 uppercase tracking-wide'>
							Qarz ma'lumotlari
						</p>
						<p className='font-bold text-red-700 dark:text-red-200 text-base'>
							{Number(order_history.client_detail?.total_debt || 0).toFixed(2)} USD
						</p>
						<p className='text-xs text-red-600 dark:text-red-200 mt-0.5'>
							{(Number(order_history.client_detail?.total_debt || 0) * usdRate).toLocaleString()} UZS
						</p>
					</div>

					{/* Foyda */}
					{Number(order_history.all_profit_dollar || 0) > 0 && (
						<div className='bg-gradient-to-br from-lime-50 to-green-50 p-2 rounded border border-lime-200 dark:from-slate-800 dark:to-slate-700 dark:border-slate-700'>
							<p className='text-[10px] font-semibold text-lime-600 mb-1 uppercase tracking-wide dark:text-lime-200'>
								Foyda
							</p>
							<p className='font-bold text-lime-700 dark:text-lime-200 text-base'>
								{Number(order_history.all_profit_dollar).toFixed(2)} USD
							</p>
							<p className='text-xs text-lime-600 dark:text-lime-200 mt-0.5'>
								{(Number(order_history.all_profit_dollar) * usdRate).toLocaleString()} UZS
							</p>
						</div>
					)}

					{/* To'lov usullari */}
					<div className='md:col-span-2 lg:col-span-3 xl:col-span-5'>
						<p className='text-[10px] font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide'>
							To'lov usullari
						</p>
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2'>
							{Number(order_history.summa_dollar || 0) > 0 && (
								<div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200'>
									<div className='bg-gradient-to-r from-green-700 to-emerald-800 text-white p-1.5 sm:p-2 flex justify-between items-center'>
										<div className='flex items-center space-x-1.5'>
											<div className='bg-green-100 p-1 rounded'>
												<Banknote className='text-green-700 w-3 h-3' />
											</div>
											<span className='font-medium text-[10px] sm:text-xs'>US dollar naqd</span>
										</div>
									</div>
									<div className='p-1.5 sm:p-2 bg-white dark:bg-slate-800'>
										<div className='text-right flex items-center justify-end gap-1'>
											<p className='font-semibold text-sm text-gray-800 dark:text-slate-100'>
												{Number(order_history.summa_dollar).toFixed(2)}
											</p>
											<span className='text-[10px] font-medium text-gray-500'>USD</span>
											<p className='text-[10px] text-gray-600 dark:text-gray-300 mt-0.5'>
												({Number(order_history.summa_dollar) * usdRate} UZS)
											</p>
										</div>
									</div>
								</div>
							)}
							{Number(order_history.summa_naqt || 0) > 0 && (
								<div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200'>
									<div className='bg-gradient-to-r from-lime-500 to-green-600 text-white p-1.5 sm:p-2 flex justify-between items-center'>
										<div className='flex items-center space-x-1.5'>
											<div className='bg-lime-100 p-1 rounded'>
												<Banknote className='text-lime-700 w-3 h-3' />
											</div>
											<span className='font-medium text-[10px] sm:text-xs'>Naqd</span>
										</div>
									</div>
									<div className='p-1.5 sm:p-2 bg-white dark:bg-slate-800'>
										<div className='text-right flex items-center justify-end gap-1'>
											<p className='font-semibold text-sm text-gray-800 dark:text-slate-100'>
												{Number(order_history.summa_naqt).toLocaleString()}
											</p>
											<span className='text-[10px] font-medium text-gray-500'>UZS</span>
										</div>
									</div>
								</div>
							)}

							{Number(order_history.summa_transfer || 0) > 0 && (
								<div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200'>
									<div className='bg-gradient-to-r from-blue-400 to-cyan-500 text-white p-1.5 sm:p-2 flex justify-between items-center'>
										<div className='flex items-center space-x-1.5'>
											<div className='bg-blue-100 p-1 rounded'>
												<CreditCard className='text-blue-700 w-3 h-3' />
											</div>
											<span className='font-medium text-[10px] sm:text-xs'>Plastik perevod</span>
										</div>
									</div>
									<div className='p-1.5 sm:p-2 bg-white dark:bg-slate-800'>
										<div className='text-right flex items-center justify-end gap-1'>
											<p className='font-semibold text-sm text-gray-800 dark:text-slate-100'>
												{Number(order_history.summa_transfer).toLocaleString()}
											</p>
											<span className='text-[10px] font-medium text-gray-500'>UZS</span>
										</div>
									</div>
								</div>
							)}
							{Number(order_history.summa_terminal || 0) > 0 && (
								<div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200'>
									<div className='bg-gradient-to-r from-blue-400 to-cyan-500 text-white p-1.5 sm:p-2 flex justify-between items-center'>
										<div className='flex items-center space-x-1.5'>
											<div className='bg-blue-100 p-1 rounded'>
												<CreditCard className='text-blue-700 w-3 h-3' />
											</div>
											<span className='font-medium text-[10px] sm:text-xs'>Terminal</span>
										</div>
									</div>
									<div className='p-1.5 sm:p-2 bg-white dark:bg-slate-800'>
										<div className='text-right flex items-center justify-end gap-1'>
											<p className='font-semibold text-sm text-gray-800 dark:text-slate-100'>
												{Number(order_history.summa_terminal).toLocaleString()}
											</p>
											<span className='text-[10px] font-medium text-gray-500'>UZS</span>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Qaytim */}
					{(Number(order_history.zdacha_dollar || 0) > 0 || Number(order_history.zdacha_som || 0) > 0) && (
						<div className='bg-gradient-to-br from-yellow-50 to-amber-50 p-2 rounded border border-yellow-200 md:col-span-2 lg:col-span-3 xl:col-span-5'>
							<p className='text-[10px] font-semibold text-yellow-600 mb-2 uppercase tracking-wide'>
								Qaytim
							</p>
							<div className='grid grid-cols-2 gap-2'>
								{Number(order_history.zdacha_dollar || 0) > 0 && (
									<div className='bg-white dark:bg-slate-800 p-2 rounded border border-yellow-100 dark:border-slate-700'>
										<p className='text-[10px] text-gray-500 mb-0.5'>Qaytim dollarda</p>
										<p className='font-bold text-gray-800 text-xs'>
											{Number(order_history.zdacha_dollar).toFixed(2)} USD
										</p>
									</div>
								)}
								{Number(order_history.zdacha_som || 0) > 0 && (
									<div className='bg-white dark:bg-slate-800 p-2 rounded border border-yellow-100 dark:border-slate-700'>
										<p className='text-[10px] text-gray-500 mb-0.5'>Qaytim so'mda</p>
										<p className='font-bold text-gray-800 text-xs'>
											{Number(order_history.zdacha_som).toLocaleString()} UZS
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Izoh */}
					{order_history.note && (
						<div className='bg-gradient-to-br from-slate-50 to-gray-50 p-2 rounded border border-slate-200 dark:from-slate-800 dark:to-slate-700 dark:border-slate-700 md:col-span-2 lg:col-span-3 xl:col-span-5'>
							<p className='text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide'>
								Izoh
							</p>
							<p className='text-xs text-gray-800 dark:text-slate-100 whitespace-pre-wrap'>
								{order_history.note}
							</p>
						</div>
					)}

					{/* Yetkazib beruvchi */}
					{order_history.driver_info && (
						<div className='bg-gradient-to-br from-teal-50 to-cyan-50 p-2 rounded border border-teal-200 dark:from-slate-800 dark:to-slate-700 dark:border-slate-700 md:col-span-2 lg:col-span-3 xl:col-span-5'>
							<p className='text-[10px] font-semibold text-teal-600 mb-1 uppercase tracking-wide'>
								Yetkazib beruvchi
							</p>
							<p className='text-xs text-gray-800 dark:text-slate-100 whitespace-pre-wrap'>
								{order_history.driver_info}
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Productlar - Model bo'yicha guruhlangan */}
			<div className='bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full border-collapse text-sm'>
						<thead>
							<tr className='bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700'>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									#
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									Joyi
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									Model
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									Nomi
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									O'lchami
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									Tip
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									Soni
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									Berilgan soni
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									Narxi ($)
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									Asl Narxi ($)
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									Foyda ($)
								</th>
							</tr>
						</thead>
						<tbody>
							{products.map((group, groupIndex) => {
								let productIndex = 0;
								const groupTotal = {
									count: 0,
									given_count: 0,
									price_dollar: 0,
									real_price: 0,
									profit: 0,
								};

								return (
									<>
										{/* Model Header */}
										<tr
											key={`header-${group.model_id}`}
											className='bg-blue-100 dark:bg-slate-800 border-b border-blue-200 dark:border-slate-700'
										>
											<td
												colSpan={11}
												className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-blue-800'
											>
												{group.model}
											</td>
										</tr>

										{/* Products */}
										{group.product.map((product) => {
											productIndex++;
											const realPrice = Number(product.real_price || 0);
											const priceDollar = Number(product.price_dollar || 0);
											const count = Number(product.count || 0);
											const profit = (priceDollar - realPrice) * count;

											groupTotal.count += count;
											groupTotal.given_count += Number(product.given_count || 0);
											groupTotal.price_dollar += priceDollar * count;
											groupTotal.real_price += realPrice * count;
											groupTotal.profit += profit;

											return (
												<tr
													key={product.id}
													className='border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors'
												>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-600 dark:text-gray-300'>
														{productIndex}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 dark:text-slate-100'>
														{product.sklad_detail?.name || 'Ombor'}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 dark:text-slate-100'>
														{group.model}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 dark:text-slate-100'>
														{product.branch_category_detail?.name ||
															product.type_detail?.name ||
															'-'}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 dark:text-slate-100'>
														{product.size_detail?.size || '-'}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 dark:text-slate-100'>
														{product.type_detail?.name || '-'}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 dark:text-slate-100 text-right'>
														{count}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 dark:text-slate-100 text-right'>
														{product.given_count || 0}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 dark:text-slate-100 text-right'>
														{priceDollar.toFixed(2)}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 dark:text-slate-100 text-right'>
														{realPrice.toFixed(2)}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-green-600 text-right'>
														{profit.toFixed(2)}
													</td>
												</tr>
											);
										})}

										{/* Group Total */}
										<tr className='bg-gray-100 dark:bg-slate-800 border-b-2 border-gray-300 dark:border-gray-700'>
											<td
												colSpan={6}
												className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-gray-700'
											>
												Jami:
											</td>
											<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-gray-700 text-right'>
												{groupTotal.count}
											</td>
											<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-gray-700 text-right'>
												{groupTotal.given_count}
											</td>
											<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-gray-700 text-right'>
												{groupTotal.price_dollar.toFixed(2)}
											</td>
											<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-gray-700 text-right'>
												{groupTotal.real_price.toFixed(2)}
											</td>
											<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-green-600 text-right'>
												{groupTotal.profit.toFixed(2)}
											</td>
										</tr>
									</>
								);
							})}

							{/* Grand Total */}
							<tr className='bg-gray-300 dark:bg-slate-700 border-t-2 border-gray-400 dark:border-gray-600'>
								<td
									colSpan={6}
									className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800 dark:text-slate-100'
								>
									Jami:
								</td>
								<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800 dark:text-slate-100 text-right'>
									{products.reduce(
										(sum, g) => sum + g.product.reduce((s, p) => s + Number(p.count || 0), 0),
										0,
									)}
								</td>
								<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800 dark:text-slate-100 text-right'>
									{products.reduce(
										(sum, g) => sum + g.product.reduce((s, p) => s + Number(p.given_count || 0), 0),
										0,
									)}
								</td>
								<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800 dark:text-slate-100 text-right'>
									{products
										.reduce(
											(sum, g) =>
												sum +
												g.product.reduce(
													(s, p) => s + Number(p.price_dollar || 0) * Number(p.count || 0),
													0,
												),
											0,
										)
										.toFixed(2)}
								</td>
								<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800 dark:text-slate-100 text-right'>
									{products
										.reduce(
											(sum, g) =>
												sum +
												g.product.reduce(
													(s, p) => s + Number(p.real_price || 0) * Number(p.count || 0),
													0,
												),
											0,
										)
										.toFixed(2)}
								</td>
								<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-green-700 dark:text-green-300 text-right'>
									{products
										.reduce(
											(sum, g) =>
												sum +
												g.product.reduce((s, p) => {
													const profit =
														(Number(p.price_dollar || 0) - Number(p.real_price || 0)) *
														Number(p.count || 0);
													return s + profit;
												}, 0),
											0,
										)
										.toFixed(2)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
