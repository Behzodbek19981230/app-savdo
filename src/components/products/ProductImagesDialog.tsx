import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Product } from '@/services/product.service';
import {
	normalizeProductImages,
	useCreateProductImage,
	useDeleteProductImage,
	useProductImages,
	useUpdateProductImage,
} from '@/hooks/api/useProductImages';
import { ImagePlus, Loader2, Pencil, Trash2, Upload } from 'lucide-react';

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	product: Product | null;
};

type PreviewFile = {
	file: File;
	url: string;
};

export function ProductImagesDialog({ open, onOpenChange, product }: Props) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [pending, setPending] = useState<PreviewFile[]>([]);

	const { data, isLoading } = useProductImages(
		product?.id
			? {
					product: product.id,
					perPage: 1000,
					is_delete: false,
			  }
			: undefined
	);

	const images = useMemo(() => normalizeProductImages(data), [data]);

	const createImage = useCreateProductImage();
	const updateImage = useUpdateProductImage();
	const deleteImage = useDeleteProductImage();

	const isMutating = createImage.isPending || updateImage.isPending || deleteImage.isPending;

	const selectedImage = useMemo(() => {
		if (!images.length) return null;
		const found = selectedId ? images.find((x) => x.id === selectedId) : undefined;
		return found || images[0];
	}, [images, selectedId]);

	useEffect(() => {
		// dialog yopilganda state'larni tozalash
		if (!open) {
			setSelectedId(null);
			setEditingId(null);
			setPending((prev) => {
				prev.forEach((p) => URL.revokeObjectURL(p.url));
				return [];
			});
		}
	}, [open]);

	useEffect(() => {
		// product o'zgarganda tanlangan rasmni reset qilish
		setSelectedId(null);
		setEditingId(null);
	}, [product?.id]);

	const pickFiles = () => inputRef.current?.click();

	const addPendingFiles = (files: FileList | null) => {
		if (!files || files.length === 0) return;
		const next: PreviewFile[] = Array.from(files)
			.filter((f) => f.type.startsWith('image/'))
			.map((file) => ({ file, url: URL.createObjectURL(file) }));
		setPending((prev) => [...prev, ...next]);
	};

	const clearPending = () => {
		setPending((prev) => {
			prev.forEach((p) => URL.revokeObjectURL(p.url));
			return [];
		});
	};

	const handleUpload = async () => {
		if (!product?.id) return;
		if (pending.length === 0) return;

		// 1 file = 1 request (backend format)
		for (const p of pending) {
			await createImage.mutateAsync({ product: product.id, file: p.file });
		}
		clearPending();
	};

	const handleReplace = async (id: number, file: File) => {
		if (!product?.id) return;
		await updateImage.mutateAsync({ id, product: product.id, file });
		setEditingId(null);
	};

	const handleDelete = async (id: number) => {
		if (!product?.id) return;
		await deleteImage.mutateAsync({ id, product: product.id });
		if (selectedId === id) setSelectedId(null);
		if (editingId === id) setEditingId(null);
	};

	const productTitle = product
		? `${product.model_detail?.name || 'Product'} • ${product.category_detail?.name || product.category}`
		: 'Product';

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='w-[96vw] max-w-6xl max-h-[92vh] overflow-hidden p-0'>
				<div className='p-6 pb-3 border-b'>
					<DialogHeader>
						<DialogTitle>Rasmlar (Gallery)</DialogTitle>
						<DialogDescription>
							{product ? (
								<span className='flex flex-wrap items-center gap-2'>
									<Badge variant='secondary'>ID: {product.id}</Badge>
									<span className='text-muted-foreground'>{productTitle}</span>
								</span>
							) : (
								'Avval product tanlang'
							)}
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className='p-6 pt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr] h-[calc(92vh-120px)]'>
					{/* Left: big preview */}
					<Card className='relative overflow-hidden'>
						{isLoading ? (
							<div className='h-full flex items-center justify-center'>
								<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
							</div>
						) : !selectedImage ? (
							<div className='h-full flex flex-col items-center justify-center gap-3 text-center p-6'>
								<ImagePlus className='h-10 w-10 text-muted-foreground/60' />
								<div>
									<div className='font-medium'>Rasm yo'q</div>
									<div className='text-sm text-muted-foreground'>O'ng tomondan rasm yuklang</div>
								</div>
							</div>
						) : (
							<div className='h-full w-full bg-black/5'>
								<img src={selectedImage.file} alt='Product' className='h-full w-full object-contain' />
							</div>
						)}
					</Card>

					{/* Right: upload + thumbnails */}
					<div className='flex flex-col gap-4 min-h-0'>
						<Card className='p-4'>
							<div className='flex items-center justify-between gap-3'>
								<div className='font-medium'>Rasm yuklash</div>
								<Input
									ref={inputRef}
									type='file'
									accept='image/*'
									multiple
									className='hidden'
									onChange={(e) => addPendingFiles(e.target.files)}
								/>
								<div className='flex gap-2'>
									<Button type='button' variant='outline' onClick={pickFiles} disabled={!product?.id}>
										<Upload className='mr-2 h-4 w-4' />
										Tanlash
									</Button>
									<Button
										type='button'
										onClick={handleUpload}
										disabled={!product?.id || pending.length === 0 || isMutating}
									>
										{isMutating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
										Yuklash ({pending.length})
									</Button>
								</div>
							</div>

							{pending.length > 0 && (
								<div className='mt-3'>
									<div className='flex items-center justify-between'>
										<div className='text-sm text-muted-foreground'>Tanlangan fayllar</div>
										<Button type='button' variant='ghost' size='sm' onClick={clearPending}>
											Tozalash
										</Button>
									</div>
									<div className='mt-2 grid grid-cols-4 gap-2'>
										{pending.slice(0, 8).map((p) => (
											<div
												key={p.url}
												className='aspect-square rounded-md overflow-hidden border bg-muted'
											>
												<img src={p.url} alt='Preview' className='h-full w-full object-cover' />
											</div>
										))}
										{pending.length > 8 && (
											<div className='aspect-square rounded-md border flex items-center justify-center text-sm text-muted-foreground'>
												+{pending.length - 8}
											</div>
										)}
									</div>
								</div>
							)}
						</Card>

						<Card className='p-4 min-h-0'>
							<div className='flex items-center justify-between'>
								<div className='font-medium'>Gallery</div>
								<Badge variant='outline'>{images.length}</Badge>
							</div>

							<ScrollArea className='mt-3 h-[420px]'>
								<div className='grid grid-cols-3 gap-2 pr-3'>
									{images.map((img) => {
										const isSelected = selectedImage?.id === img.id;
										return (
											<button
												key={img.id}
												type='button'
												className={cn(
													'relative aspect-square rounded-md overflow-hidden border bg-muted text-left',
													isSelected && 'ring-2 ring-primary'
												)}
												onClick={() => setSelectedId(img.id)}
											>
												<img
													src={img.file}
													alt='Image'
													className='h-full w-full object-cover'
												/>
												<div className='absolute inset-x-1 bottom-1 flex gap-1 justify-end'>
													<Button
														type='button'
														size='icon'
														variant='secondary'
														className='h-7 w-7'
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															setEditingId(img.id);
														}}
														title='Tahrirlash'
													>
														<Pencil className='h-3.5 w-3.5' />
													</Button>
													<Button
														type='button'
														size='icon'
														variant='secondary'
														className='h-7 w-7'
														onClick={async (e) => {
															e.preventDefault();
															e.stopPropagation();
															await handleDelete(img.id);
														}}
														title="O'chirish"
													>
														<Trash2 className='h-3.5 w-3.5 text-destructive' />
													</Button>
												</div>

												{editingId === img.id && (
													<div
														className='absolute inset-0 bg-black/60 flex items-center justify-center p-2'
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															setEditingId(null);
														}}
													>
														<label
															className='w-full cursor-pointer rounded-md bg-background p-3 text-sm'
															onClick={(e) => e.stopPropagation()}
														>
															<div className='font-medium mb-1'>Rasmni almashtirish</div>
															<input
																type='file'
																accept='image/*'
																className='w-full'
																onChange={async (e) => {
																	const f = e.target.files?.[0];
																	if (f) await handleReplace(img.id, f);
																}}
															/>
														</label>
													</div>
												)}
											</button>
										);
									})}
								</div>
							</ScrollArea>
						</Card>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
