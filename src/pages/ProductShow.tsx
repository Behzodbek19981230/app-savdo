import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useProduct } from '@/hooks/api/useProducts';
import {
  normalizeProductImages,
  useCreateProductImage,
  useDeleteProductImage,
  useProductImages,
  useUpdateProductImage,
} from '@/hooks/api/useProductImages';
import { ArrowLeft, ImagePlus, Loader2, Pencil, Trash2, Upload } from 'lucide-react';

type PreviewFile = { file: File; url: string };

export default function ProductShow() {
  const { id } = useParams();
  const productId = Number(id || 0);

  const { data: product, isLoading: productLoading } = useProduct(productId);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pending, setPending] = useState<PreviewFile[]>([]);

  const { data: imagesData, isLoading: imagesLoading } = useProductImages(
    productId
      ? {
          product: productId,
          perPage: 1000,
          is_delete: false,
        }
      : undefined
  );

  const images = useMemo(() => normalizeProductImages(imagesData), [imagesData]);

  const createImage = useCreateProductImage();
  const updateImage = useUpdateProductImage();
  const deleteImage = useDeleteProductImage();
  const isMutating = createImage.isPending || updateImage.isPending || deleteImage.isPending;

  const selectedImage = useMemo(() => {
    if (!images.length) return null;
    const found = selectedId ? images.find((x) => x.id === selectedId) : undefined;
    return found || images[0];
  }, [images, selectedId]);

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
    if (!productId) return;
    if (pending.length === 0) return;

    for (const p of pending) {
      await createImage.mutateAsync({ product: productId, file: p.file });
    }
    clearPending();
  };

  const handleReplace = async (imageId: number, file: File) => {
    if (!productId) return;
    await updateImage.mutateAsync({ id: imageId, product: productId, file });
    setEditingId(null);
  };

  const handleDelete = async (imageId: number) => {
    if (!productId) return;
    await deleteImage.mutateAsync({ id: imageId, product: productId });
    if (selectedId === imageId) setSelectedId(null);
    if (editingId === imageId) setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon">
            <Link to="/products" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mahsulot</h1>
            <p className="text-muted-foreground">
              {product ? (
                <span className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">ID: {product.id}</Badge>
                  <span>
                    {product.model_detail?.name || '-'} • {product.category_detail?.name || '-'}
                  </span>
                </span>
              ) : (
                'Yuklanmoqda...'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Product info */}
        <Card>
          <CardHeader>
            <CardTitle>Ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent>
            {productLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Yuklanmoqda...
              </div>
            ) : !product ? (
              <div className="text-muted-foreground">Mahsulot topilmadi</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-muted-foreground">Kategoriya</div>
                <div className="font-medium">{product.category_detail?.name || product.category}</div>

                <div className="text-muted-foreground">Model</div>
                <div className="font-medium">{product.model_detail?.name || product.model}</div>

                <div className="text-muted-foreground">Model turi</div>
                <div className="font-medium">{product.model_type_detail?.name || product.model_type}</div>

                <div className="text-muted-foreground">Model o'lchami</div>
                <div className="font-medium">{product.model_size_detail?.size || product.model_size}</div>

                <div className="text-muted-foreground">O'lcham</div>
                <div className="font-medium">{product.size}</div>

                <div className="text-muted-foreground">Soni</div>
                <div className="font-medium">{product.count}</div>

                <div className="text-muted-foreground">Narx</div>
                <div className="font-medium">{new Intl.NumberFormat('uz-UZ').format(product.price)} so'm</div>

                <div className="text-muted-foreground">Haqiqiy narx</div>
                <div className="font-medium">
                  {new Intl.NumberFormat('uz-UZ').format(product.real_price)} so'm
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images gallery */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Rasmlar (Gallery)</CardTitle>
              <Badge variant="outline">{images.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="relative overflow-hidden">
                {imagesLoading ? (
                  <div className="h-[420px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !selectedImage ? (
                  <div className="h-[420px] flex flex-col items-center justify-center gap-3 text-center p-6">
                    <ImagePlus className="h-10 w-10 text-muted-foreground/60" />
                    <div>
                      <div className="font-medium">Rasm yo'q</div>
                      <div className="text-sm text-muted-foreground">O'ng tomondan rasm yuklang</div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[420px] w-full bg-black/5">
                    <img src={selectedImage.file} alt="Product" className="h-full w-full object-contain" />
                  </div>
                )}
              </Card>

              <div className="flex flex-col gap-4 min-h-0">
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">Rasm yuklash</div>
                    <Input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => addPendingFiles(e.target.files)}
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={pickFiles} disabled={!productId}>
                        <Upload className="mr-2 h-4 w-4" />
                        Tanlash
                      </Button>
                      <Button
                        type="button"
                        onClick={handleUpload}
                        disabled={!productId || pending.length === 0 || isMutating}
                      >
                        {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yuklash ({pending.length})
                      </Button>
                    </div>
                  </div>

                  {pending.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Tanlangan fayllar</div>
                        <Button type="button" variant="ghost" size="sm" onClick={clearPending}>
                          Tozalash
                        </Button>
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {pending.slice(0, 8).map((p) => (
                          <div key={p.url} className="aspect-square rounded-md overflow-hidden border bg-muted">
                            <img src={p.url} alt="Preview" className="h-full w-full object-cover" />
                          </div>
                        ))}
                        {pending.length > 8 && (
                          <div className="aspect-square rounded-md border flex items-center justify-center text-sm text-muted-foreground">
                            +{pending.length - 8}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="p-4 min-h-0">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Gallery</div>
                    <Badge variant="outline">{images.length}</Badge>
                  </div>

                  <ScrollArea className="mt-3 h-[260px]">
                    <div className="grid grid-cols-3 gap-2 pr-3">
                      {images.map((img) => {
                        const isSelected = selectedImage?.id === img.id;
                        return (
                          <button
                            key={img.id}
                            type="button"
                            className={cn(
                              'relative aspect-square rounded-md overflow-hidden border bg-muted text-left',
                              isSelected && 'ring-2 ring-primary'
                            )}
                            onClick={() => setSelectedId(img.id)}
                          >
                            <img src={img.file} alt="Image" className="h-full w-full object-cover" />
                            <div className="absolute inset-x-1 bottom-1 flex gap-1 justify-end">
                              <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingId(img.id);
                                }}
                                title="Tahrirlash"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                className="h-7 w-7"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  await handleDelete(img.id);
                                }}
                                title="O'chirish"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>

                            {editingId === img.id && (
                              <div
                                className="absolute inset-0 bg-black/60 flex items-center justify-center p-2"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingId(null);
                                }}
                              >
                                <label
                                  className="w-full cursor-pointer rounded-md bg-background p-3 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="font-medium mb-1">Rasmni almashtirish</div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
