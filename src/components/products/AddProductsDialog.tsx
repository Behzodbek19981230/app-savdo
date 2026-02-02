/**
 * Add Products Dialog Component
 * Kategoriya bo'yicha mahsulotlarni qo'shish dialogi
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Loader2, Edit } from 'lucide-react';
import { useProductCategories } from '@/hooks/api/useProductCategories';
import { useProductModels } from '@/hooks/api/useProductModels';
import { useModelTypes } from '@/hooks/api/useModelTypes';
import { useModelSizes } from '@/hooks/api/useModelSizes';
import { useCreateProduct, useProducts } from '@/hooks/api/useProducts';

interface AddProductsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Product item schema
const productItemSchema = z.object({
    model: z.number({ required_error: 'Model majburiy' }).int().positive(),
    model_type: z.number({ required_error: 'Model turi majburiy' }).int().positive(),
    model_size: z.number({ required_error: 'Model o\'lchami majburiy' }).int().positive(),
    count: z.number({ required_error: 'Soni majburiy' }).int().min(0),
    real_price: z.number({ required_error: 'Haqiqiy narx majburiy' }).min(0),
    price: z.number({ required_error: 'Sotuv narxi majburiy' }).min(0),
    description: z.string().max(1000).optional(),
    sorting: z.number().int().nullable().optional(),
});

type ProductItemFormData = z.infer<typeof productItemSchema>;

interface ProductItem extends ProductItemFormData {
    id: string; // temporary ID for frontend
}

export function AddProductsDialog({ open, onOpenChange }: AddProductsDialogProps) {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Queries
    const { data: categoriesData } = useProductCategories({
        perPage: 1000,
        is_delete: false,
    });

    const { data: modelsData } = useProductModels({
        perPage: 1000,
        is_delete: false,
    });

    const { data: modelTypesData } = useModelTypes({
        perPage: 1000,
        is_delete: false,
    });

    const { data: modelSizesData } = useModelSizes({
        perPage: 1000,
        is_delete: false,
    });

    // Fetch products filtered by category
    const { data: existingProductsData, isLoading: isLoadingProducts } = useProducts({
        category: selectedCategory || undefined,
        perPage: 1000,
        is_delete: false,
    });

    const createProduct = useCreateProduct();

    const categories = categoriesData?.results || [];
    const models = modelsData?.results || [];
    const modelTypes = modelTypesData?.results || [];
    const modelSizes = modelSizesData?.results || [];
    const existingProducts = existingProductsData?.results || [];

    // Set default category when dialog opens
    useEffect(() => {
        if (open && categoriesData?.results && categoriesData.results.length > 0 && !selectedCategory) {
            setSelectedCategory(categoriesData.results[0].id);
        }
    }, [open, categoriesData?.results, selectedCategory]);

    // Form for product item
    const form = useForm<ProductItemFormData>({
        resolver: zodResolver(productItemSchema),
        defaultValues: {
            model: 0,
            model_type: 0,
            model_size: 0,
            count: 0,
            real_price: 0,
            price: 0,
            sorting: null,
        },
    });

    const handleCategoryChange = (categoryId: string) => {
        const id = parseInt(categoryId);
        setSelectedCategory(id);
        // Clear manually added products when category changes
        setProducts([]);
        setIsAddingNew(false);
        setEditingProduct(null);
    };

    const handleAddNew = () => {
        setIsAddingNew(true);
        setEditingProduct(null);
        form.reset({
            model: 0,
            model_type: 0,
            model_size: 0,
            count: 0,
            real_price: 0,
            price: 0,
            sorting: null,
        });
    };

    const handleEditItem = (item: ProductItem) => {
        setIsAddingNew(false);
        setEditingProduct(item);
        form.reset({
            model: item.model,
            model_type: item.model_type,
            model_size: item.model_size,
            count: item.count,
            real_price: item.real_price,
            price: item.price,
            sorting: item.sorting,
        });
    };

    const handleCancelEdit = () => {
        setIsAddingNew(false);
        setEditingProduct(null);
        form.reset();
    };

    const onSubmitItem = (data: ProductItemFormData) => {
        if (editingProduct) {
            // Update existing item
            setProducts(products.map(p => p.id === editingProduct.id ? { ...data, id: p.id } : p));
        } else {
            // Add new item
            const newItem: ProductItem = {
                ...data,
                id: `temp-${Date.now()}`,
            };
            setProducts([...products, newItem]);
        }
        handleCancelEdit();
    };

    const handleDeleteItem = (id: string) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deletingId) {
            setProducts(products.filter(p => p.id !== deletingId));
            setDeletingId(null);
            setIsDeleteDialogOpen(false);
        }
    };

    const handleSaveAll = async () => {
        if (!selectedCategory || products.length === 0) return;

        setIsSaving(true);
        try {
            // Save all products
            for (const product of products) {
                await createProduct.mutateAsync({
                    category: selectedCategory,
                    model: product.model,
                    model_type: product.model_type,
                    model_size: product.model_size,
                    count: product.count,
                    real_price: product.real_price,
                    price: product.price,
                    sorting: product.sorting,
                });
            }

            // Reset and close
            handleClose();
        } catch (error) {
            console.error('Error saving products:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setSelectedCategory(null);
        setProducts([]);
        setEditingProduct(null);
        setIsAddingNew(false);
        onOpenChange(false);
    };

    const getModelName = (modelId: number) => {
        return models.find(m => m.id === modelId)?.name || '-';
    };

    const getModelTypeName = (modelTypeId: number) => {
        return modelTypes.find(mt => mt.id === modelTypeId)?.name || '-';
    };

    const getModelSizeName = (modelSizeId: number) => {
        return modelSizes.find(ms => ms.id === modelSizeId)?.size.toString() || '-';
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Mahsulotlar qo'shish</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Category Select */}
                        <div className="flex items-end gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">
                                    Kategoriya *
                                </label>
                                <Select
                                    value={selectedCategory?.toString()}
                                    onValueChange={handleCategoryChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kategoriyani tanlang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleAddNew}
                                disabled={!selectedCategory || isAddingNew || editingProduct !== null}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Mahsulot qo'shish
                            </Button>
                        </div>

                        {/* Products Table */}
                        <div className="border rounded-lg">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmitItem)}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Model</TableHead>
                                                <TableHead>Model turi</TableHead>
                                                <TableHead>Model o'lchami</TableHead>
                                                <TableHead>Soni</TableHead>
                                                <TableHead>Haqiqiy narx (so'mda)</TableHead>
                                                <TableHead>Sotuv narxi (so'mda)</TableHead>
                                                <TableHead>Tavsif</TableHead>
                                                <TableHead className="w-[140px]">Amallar</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingProducts ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-8">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                <>
                                                    {/* Add/Edit Form Row */}
                                                    {(isAddingNew || editingProduct) && (
                                                        <TableRow className="bg-blue-50 dark:bg-blue-950">
                                                            <TableCell>
                                                                <FormField
                                                                    control={form.control}
                                                                    name="model"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <Select
                                                                                onValueChange={(value) => field.onChange(parseInt(value))}
                                                                                value={field.value?.toString()}
                                                                            >
                                                                                <FormControl>
                                                                                    <SelectTrigger className="h-9">
                                                                                        <SelectValue placeholder="Tanlang" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    {models.map((model) => (
                                                                                        <SelectItem key={model.id} value={model.id.toString()}>
                                                                                            {model.name}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <FormField
                                                                    control={form.control}
                                                                    name="model_type"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <Select
                                                                                onValueChange={(value) => field.onChange(parseInt(value))}
                                                                                value={field.value?.toString()}
                                                                            >
                                                                                <FormControl>
                                                                                    <SelectTrigger className="h-9">
                                                                                        <SelectValue placeholder="Tanlang" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    {modelTypes.map((modelType) => (
                                                                                        <SelectItem key={modelType.id} value={modelType.id.toString()}>
                                                                                            {modelType.name}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <FormField
                                                                    control={form.control}
                                                                    name="model_size"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <Select
                                                                                onValueChange={(value) => field.onChange(parseInt(value))}
                                                                                value={field.value?.toString()}
                                                                            >
                                                                                <FormControl>
                                                                                    <SelectTrigger className="h-9">
                                                                                        <SelectValue placeholder="Tanlang" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    {modelSizes.map((modelSize) => (
                                                                                        <SelectItem key={modelSize.id} value={modelSize.id.toString()}>
                                                                                            {modelSize.size}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <FormField
                                                                    control={form.control}
                                                                    name="count"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormControl>
                                                                                <Input
                                                                                    type="number"
                                                                                    placeholder="0"
                                                                                    className="h-9"
                                                                                    {...field}
                                                                                    onChange={(e) => {
                                                                                        const value = e.target.value;
                                                                                        field.onChange(value === '' ? 0 : parseInt(value));
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <FormField
                                                                    control={form.control}
                                                                    name="real_price"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormControl>
                                                                                <Input
                                                                                    type="number"
                                                                                    placeholder="0"
                                                                                    className="h-9"
                                                                                    {...field}
                                                                                    onChange={(e) => {
                                                                                        const value = e.target.value;
                                                                                        field.onChange(value === '' ? 0 : parseFloat(value));
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <FormField
                                                                    control={form.control}
                                                                    name="price"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormControl>
                                                                                <Input
                                                                                    type="number"
                                                                                    placeholder="0"
                                                                                    className="h-9"
                                                                                    {...field}
                                                                                    onChange={(e) => {
                                                                                        const value = e.target.value;
                                                                                        field.onChange(value === '' ? 0 : parseFloat(value));
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <FormField
                                                                    control={form.control}
                                                                    name="description"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormControl>
                                                                                <Input
                                                                                    type="text"
                                                                                    placeholder="Tavsif..."
                                                                                    className="h-9"
                                                                                    {...field}
                                                                                />
                                                                            </FormControl>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-1">
                                                                    <Button type="submit" size="sm" className="h-9">
                                                                        Saqlash
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-9"
                                                                        onClick={handleCancelEdit}
                                                                    >
                                                                        Bekor
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}

                                                    {/* Empty State */}
                                                    {!isAddingNew && !editingProduct && existingProducts.length === 0 && products.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                                {selectedCategory
                                                                    ? 'Mahsulotlar yo\'q. "Mahsulot qo\'shish" tugmasini bosing.'
                                                                    : 'Kategoriyani tanlang va mahsulot qo\'shing.'}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}

                                                    {/* Existing products from API */}
                                                    {existingProducts.map((product) => (
                                                        <TableRow key={`existing-${product.id}`} className="bg-muted/30">
                                                            <TableCell className="font-medium">
                                                                {product.model_detail?.name || '-'}
                                                            </TableCell>
                                                            <TableCell>{product.model_type_detail?.name || '-'}</TableCell>
                                                            <TableCell>{product.model_size_detail?.size || '-'}</TableCell>
                                                            <TableCell>{product.count}</TableCell>
                                                            <TableCell>{formatPrice(product.real_price)}</TableCell>
                                                            <TableCell className="text-green-600 font-medium">
                                                                {formatPrice(product.price)}
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                                                {product.description || '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-xs text-muted-foreground">
                                                                    Mavjud
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}

                                                    {/* Newly added products */}
                                                    {products.map((product) => (
                                                        <TableRow key={product.id}>
                                                            <TableCell className="font-medium">
                                                                {getModelName(product.model)}
                                                            </TableCell>
                                                            <TableCell>{getModelTypeName(product.model_type)}</TableCell>
                                                            <TableCell>{getModelSizeName(product.model_size)}</TableCell>
                                                            <TableCell>{product.count}</TableCell>
                                                            <TableCell>{formatPrice(product.real_price)}</TableCell>
                                                            <TableCell className="text-green-600 font-medium">
                                                                {formatPrice(product.price)}
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                                                {product.description || '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleEditItem(product)}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDeleteItem(product.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </>
                                            )}
                                        </TableBody>
                                    </Table>
                                </form>
                            </Form>
                        </div>

                        {/* Footer */}
                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Bekor qilish
                            </Button>
                            <Button
                                onClick={handleSaveAll}
                                disabled={products.length === 0 || isSaving}
                            >
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Hammasini saqlash ({products.length})
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu mahsulot ro'yxatdan o'chiriladi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
