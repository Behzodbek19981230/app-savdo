/**
 * Products Page
 * Mahsulotlar sahifasi
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import {
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Plus,
    Eye,
    Edit,
    Image as ImageIcon,
    Trash2,
    Loader2,
    Package,
    X,
    FilterX,
    ZoomIn,
    ZoomOut,
    RotateCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/api/useProducts';
import { ProductImagesDialog } from '@/components/products/ProductImagesDialog';
import { AddProductsDialog } from '@/components/products/AddProductsDialog';
import { useProductCategories } from '@/hooks/api/useProductCategories';
import { useProductModels } from '@/hooks/api/useProductModels';
import { useModelTypes } from '@/hooks/api/useModelTypes';
import { useModelSizes } from '@/hooks/api/useModelSizes';
import { type Product, ProductType, ProductTypeLabels } from '@/services/product.service';
import { productSchema, type ProductFormData } from '@/lib/validations/product';
import { ModelSizeTypeLabels } from '@/services';

const ITEMS_PER_PAGE = 10;

type SortField = 'category' | 'model' | 'price' | 'count' | 'sorting' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function Products() {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isImagesDialogOpen, setIsImagesDialogOpen] = useState(false);
    const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [imagesProduct, setImagesProduct] = useState<Product | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Filters
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterModel, setFilterModel] = useState<string>('');
    const [filterModelType, setFilterModelType] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');

    // Form
    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            category: 0,
            model: 0,
            model_type: 0,
            model_size: 0,
            size: 0,
            type: ProductType.DONA,
            count: 0,
            real_price: 0,
            price: 0,
            sorting: null,
        },
    });

    // Build ordering string for API
    const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;

    // Queries
    const { data, isLoading } = useProducts({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        ordering,
        is_delete: false,
        category: filterCategory && filterCategory !== 'all' ? parseInt(filterCategory) : undefined,
        model: filterModel && filterModel !== 'all' ? parseInt(filterModel) : undefined,
        model_type: filterModelType && filterModelType !== 'all' ? parseInt(filterModelType) : undefined,
        type: filterType && filterType !== 'all' ? filterType : undefined,
    });

    const { data: categoriesData } = useProductCategories({
        perPage: 1000,
        is_delete: false,
    });

    const { data: modelsData } = useProductModels({
        limit: 1000,
        is_delete: false,
    });

    const { data: modelTypesData } = useModelTypes({
        limit: 1000,
        is_delete: false,
    });

    const { data: modelSizesData } = useModelSizes({
        perPage: 1000,
        is_delete: false,
    });

    // Mutations
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const deleteProduct = useDeleteProduct();

    const products = data?.results || [];
    const pagination = data?.pagination;
    const totalPages = pagination?.lastPage || 1;
    const categories = categoriesData?.results || [];
    const models = modelsData?.results || [];
    const modelTypes = modelTypesData?.results || [];
    const modelSizes = modelSizesData?.results || [];

    const isMutating = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending;

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortField(null);
                setSortDirection(null);
            } else {
                setSortDirection('asc');
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className='h-4 w-4 ml-2 text-muted-foreground' />;
        }
        if (sortDirection === 'asc') {
            return <ArrowUp className='h-4 w-4 ml-2' />;
        }
        return <ArrowDown className='h-4 w-4 ml-2' />;
    };

    const handleOpenDialog = (item?: Product) => {
        if (item) {
            setEditingId(item.id);
            form.reset({
                category: item.category || 0,
                model: item.model || 0,
                model_type: item.model_type || 0,
                model_size: item.model_size || 0,
                size: item.size || 0,
                type: item.type || ProductType.DONA,
                count: item.count || 0,
                real_price: item.real_price || 0,
                price: item.price || 0,
                sorting: item.sorting,
                discription: item.discription || '',
            });
        } else {
            setEditingId(null);
            form.reset({
                category: 0,
                model: 0,
                model_type: 0,
                model_size: 0,
                size: 0,
                type: ProductType.DONA,
                count: 0,
                real_price: 0,
                price: 0,
                sorting: null,
                discription: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleOpenImagesDialog = (item: Product) => {
        setImagesProduct(item);
        setIsImagesDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingId(null);
        form.reset();
    };

    const onSubmit = async (data: ProductFormData) => {
        try {
            const submitData = {
                category: data.category,
                model: data.model,
                model_type: data.model_type,
                model_size: data.model_size,
                discription: data.discription,
                count: data.count,
                real_price: data.real_price,
                price: data.price,
                sorting: data.sorting,
            };

            if (editingId) {
                await updateProduct.mutateAsync({ id: editingId, data: submitData });
            } else {
                await createProduct.mutateAsync(submitData);
            }
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;

        try {
            await deleteProduct.mutateAsync(deletingId);
            setIsDeleteDialogOpen(false);
            setDeletingId(null);
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const openDeleteDialog = (id: number) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Close dialog after successful mutation
    useEffect(() => {
        if (createProduct.isSuccess || updateProduct.isSuccess) {
            setIsDialogOpen(false);
            setEditingId(null);
            form.reset();
        }
    }, [createProduct.isSuccess, updateProduct.isSuccess, form]);

    const renderPaginationItems = () => {
        const items = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        const endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            items.push(
                <PaginationItem key='1'>
                    <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
                        1
                    </PaginationLink>
                </PaginationItem>,
            );
            if (startPage > 2) {
                items.push(<PaginationEllipsis key='ellipsis-start' />);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                        {i}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(<PaginationEllipsis key='ellipsis-end' />);
            }
            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        return items;
    };

    const getCategoryName = (categoryId: number) => {
        const category = categories.find((c) => c.id === categoryId);
        return category?.name || '-';
    };

    const getModelName = (modelId: number) => {
        const model = models.find((m) => m.id === modelId);
        return model?.name || '-';
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
    };

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold tracking-tight'>Mahsulotlar</h1>
                    <p className='text-muted-foreground'>Barcha mahsulotlarni boshqaring</p>
                </div>
                <Button onClick={() => navigate('/products/add')}>
                    <Plus className='mr-2 h-4 w-4' />
                    Mahsulotlar qo'shish
                </Button>
            </div>

            {/* Main Card */}
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                            <Package className='h-6 w-6 text-primary' />
                            <div>
                                <CardTitle>Barcha mahsulotlar</CardTitle>
                                <CardDescription>Jami {pagination?.total || 0} ta mahsulot</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className='mb-4'>
                        <div className='relative'>
                            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                            <Input
                                placeholder='Qidirish...'
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className='pl-9'
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className='mb-4 grid grid-cols-1 md:grid-cols-4 gap-3'>
                        <Select
                            value={filterCategory}
                            onValueChange={(value) => {
                                setFilterCategory(value);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder='Kategoriya' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>Barcha kategoriyalar</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filterModel}
                            onValueChange={(value) => {
                                setFilterModel(value);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder='Model' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>Barcha modellar</SelectItem>
                                {models.map((model) => (
                                    <SelectItem key={model.id} value={model.id.toString()}>
                                        {model.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filterModelType}
                            onValueChange={(value) => {
                                setFilterModelType(value);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder='Model turi' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>Barcha model turlari</SelectItem>
                                {modelTypes.map((modelType) => (
                                    <SelectItem key={modelType.id} value={modelType.id.toString()}>
                                        {modelType.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filterType}
                            onValueChange={(value) => {
                                setFilterType(value);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder='Tur' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>Barcha turlar</SelectItem>
                                {Object.entries(ProductTypeLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Active Filters Display */}
                    {(filterCategory || filterModel || filterModelType || filterType) && (
                        <div className='mb-4 flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border'>
                            <span className='text-sm font-medium text-muted-foreground'>Faol filterlar:</span>
                            {filterCategory && filterCategory !== 'all' && (
                                <Badge variant='secondary' className='gap-1.5 pl-2 pr-1'>
                                    <span className='text-xs'>Kategoriya:</span>
                                    <span className='font-medium'>
                                        {categories.find((c) => c.id.toString() === filterCategory)?.name}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setFilterCategory('');
                                            setCurrentPage(1);
                                        }}
                                        className='ml-0.5 hover:bg-destructive/20 rounded-sm p-0.5 transition-colors'
                                    >
                                        <X className='h-3 w-3' />
                                    </button>
                                </Badge>
                            )}
                            {filterModel && filterModel !== 'all' && (
                                <Badge variant='secondary' className='gap-1.5 pl-2 pr-1'>
                                    <span className='text-xs'>Model:</span>
                                    <span className='font-medium'>
                                        {models.find((m) => m.id.toString() === filterModel)?.name}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setFilterModel('');
                                            setCurrentPage(1);
                                        }}
                                        className='ml-0.5 hover:bg-destructive/20 rounded-sm p-0.5 transition-colors'
                                    >
                                        <X className='h-3 w-3' />
                                    </button>
                                </Badge>
                            )}
                            {filterModelType && filterModelType !== 'all' && (
                                <Badge variant='secondary' className='gap-1.5 pl-2 pr-1'>
                                    <span className='text-xs'>Model turi:</span>
                                    <span className='font-medium'>
                                        {modelTypes.find((mt) => mt.id.toString() === filterModelType)?.name}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setFilterModelType('');
                                            setCurrentPage(1);
                                        }}
                                        className='ml-0.5 hover:bg-destructive/20 rounded-sm p-0.5 transition-colors'
                                    >
                                        <X className='h-3 w-3' />
                                    </button>
                                </Badge>
                            )}
                            {filterType && filterType !== 'all' && (
                                <Badge variant='secondary' className='gap-1.5 pl-2 pr-1'>
                                    <span className='text-xs'>Tur:</span>
                                    <span className='font-medium'>{ProductTypeLabels[filterType as ProductType]}</span>
                                    <button
                                        onClick={() => {
                                            setFilterType('');
                                            setCurrentPage(1);
                                        }}
                                        className='ml-0.5 hover:bg-destructive/20 rounded-sm p-0.5 transition-colors'
                                    >
                                        <X className='h-3 w-3' />
                                    </button>
                                </Badge>
                            )}
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                    setFilterCategory('');
                                    setFilterModel('');
                                    setFilterModelType('');
                                    setFilterType('');
                                    setCurrentPage(1);
                                }}
                                className='h-7 px-2 ml-auto'
                            >
                                <FilterX className='h-3.5 w-3.5 mr-1' />
                                Hammasini tozalash
                            </Button>
                        </div>
                    )}

                    {/* Table */}
                    {isLoading ? (
                        <div className='flex items-center justify-center py-8'>
                            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                        </div>
                    ) : products.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-8 text-center'>
                            <Package className='h-12 w-12 text-muted-foreground/50 mb-3' />
                            <p className='text-muted-foreground'>Ma'lumot topilmadi</p>
                        </div>
                    ) : (
                        <>
                            <div className='rounded-md border overflow-x-auto'>
                                <Table>
                                    <TableHeader>
                                        <TableRow>

                                            <TableHead className='w-[80px]'>Rasm</TableHead>
                                            <TableHead>
                                                <button
                                                    className='flex items-center hover:text-foreground transition-colors'
                                                    onClick={() => handleSort('category')}
                                                >
                                                    Kategoriya
                                                    {getSortIcon('category')}
                                                </button>
                                            </TableHead>
                                            <TableHead>
                                                <button
                                                    className='flex items-center hover:text-foreground transition-colors'
                                                    onClick={() => handleSort('model')}
                                                >
                                                    Model
                                                    {getSortIcon('model')}
                                                </button>
                                            </TableHead>
                                            <TableHead>Model turi</TableHead>
                                            <TableHead>Model o'lchami</TableHead>

                                            <TableHead>
                                                <button
                                                    className='flex items-center hover:text-foreground transition-colors'
                                                    onClick={() => handleSort('count')}
                                                >
                                                    Soni
                                                    {getSortIcon('count')}
                                                </button>
                                            </TableHead>
                                            <TableHead>Haqiqiy narx</TableHead>
                                            <TableHead>
                                                <button
                                                    className='flex items-center hover:text-foreground transition-colors'
                                                    onClick={() => handleSort('price')}
                                                >
                                                    Sotuv narxi
                                                    {getSortIcon('price')}
                                                </button>
                                            </TableHead>
                                            <TableHead>Amallar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((product, index) => (
                                            <TableRow key={product.id}>

                                                <TableCell>
                                                    <Avatar
                                                        className='h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity'
                                                        onClick={() => {
                                                            if (product.attachments && product.attachments.length > 0) {
                                                                setSelectedProduct(product);
                                                                setCurrentImageIndex(0);
                                                                setIsImageGalleryOpen(true);
                                                            }
                                                        }}
                                                    >
                                                        <AvatarImage
                                                            src={product.attachments?.[0]?.file}
                                                            alt={product.model_detail?.name || 'Product'}
                                                        />
                                                        <AvatarFallback>
                                                            <Package className='h-5 w-5 text-muted-foreground' />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant='secondary'>
                                                        {product.category_detail?.name ||
                                                            getCategoryName(product.category)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className='font-medium'>
                                                    {product.model_detail?.name || getModelName(product.model)}
                                                </TableCell>
                                                <TableCell>{product.model_type_detail?.name || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant='outline'>
                                                        {product.model_size_detail?.size || '-'}{' '}
                                                        {ModelSizeTypeLabels[product.model_size_detail?.type || '']}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell>
                                                    <Badge variant='default'>{product.count}</Badge>
                                                </TableCell>
                                                <TableCell className='font-medium text-muted-foreground'>
                                                    {formatPrice(product.real_price)}
                                                </TableCell>
                                                <TableCell className='font-semibold text-green-600'>
                                                    {formatPrice(product.price)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className='flex items-center justify-end '>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            onClick={() => handleOpenImagesDialog(product)}
                                                            title='Rasmlar'
                                                        >
                                                            <ImageIcon className='h-4 w-4' />
                                                        </Button>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            onClick={() => navigate(`/products/${product.id}`)}
                                                            title="Ko'rish"
                                                        >
                                                            <Eye className='h-4 w-4' />
                                                        </Button>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            onClick={() => handleOpenDialog(product)}
                                                        >
                                                            <Edit className='h-4 w-4' />
                                                        </Button>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            onClick={() => openDeleteDialog(product.id)}
                                                        >
                                                            <Trash2 className='h-4 w-4 text-destructive' />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className='mt-4'>
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                                    className={cn(
                                                        currentPage === 1 && 'pointer-events-none opacity-50',
                                                    )}
                                                />
                                            </PaginationItem>
                                            {renderPaginationItems()}
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() =>
                                                        handlePageChange(Math.min(totalPages, currentPage + 1))
                                                    }
                                                    className={cn(
                                                        currentPage === totalPages && 'pointer-events-none opacity-50',
                                                    )}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Tahrirlash' : "Yangi mahsulot qo'shish"}</DialogTitle>
                                <DialogDescription>Mahsulot ma'lumotlarini kiriting</DialogDescription>
                            </DialogHeader>
                            <div className='grid gap-4 py-4'>
                                <div className='grid grid-cols-2 gap-4'>
                                    <FormField
                                        control={form.control}
                                        name='category'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Kategoriya *</FormLabel>
                                                <Select
                                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                                    value={field.value?.toString()}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder='Tanlang' />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {categories.map((category) => (
                                                            <SelectItem
                                                                key={category.id}
                                                                value={category.id.toString()}
                                                            >
                                                                {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='model'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Model *</FormLabel>
                                                <Select
                                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                                    value={field.value?.toString()}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder='Tanlang' />
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
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className='grid grid-cols-2 gap-4'>
                                    <FormField
                                        control={form.control}
                                        name='model_type'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Model turi *</FormLabel>
                                                <Select
                                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                                    value={field.value?.toString()}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder='Tanlang' />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {modelTypes.map((modelType) => (
                                                            <SelectItem
                                                                key={modelType.id}
                                                                value={modelType.id.toString()}
                                                            >
                                                                {modelType.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='model_size'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Model o'lchami *</FormLabel>
                                                <Select
                                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                                    value={field.value?.toString()}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder='Tanlang' />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {modelSizes.map((modelSize) => (
                                                            <SelectItem
                                                                key={modelSize.id}
                                                                value={modelSize.id.toString()}
                                                            >
                                                                {modelSize.size}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className='grid grid-cols-2 gap-4'>
                                    <FormField
                                        control={form.control}
                                        name='count'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Soni *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type='number'
                                                        placeholder='10'
                                                        {...field}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            field.onChange(value === '' ? 0 : parseInt(value));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='sorting'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tartib raqami</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type='number'
                                                        placeholder='1'
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            field.onChange(value === '' ? null : parseInt(value));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className='grid grid-cols-2 gap-4'>
                                    <FormField
                                        control={form.control}
                                        name='real_price'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Haqiqiy narx *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type='number'
                                                        placeholder='1000000'
                                                        {...field}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            field.onChange(value === '' ? 0 : parseFloat(value));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormDescription>Tan narxi (so'mda)</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name='price'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sotuv narxi *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type='number'
                                                        placeholder='1200000'
                                                        {...field}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            field.onChange(value === '' ? 0 : parseFloat(value));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormDescription>Sotish narxi (so'mda)</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name='discription'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tavsif</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder='Mahsulot haqida qo&#39;shimcha ma&#39;lumot...'
                                                    className='resize-none'
                                                    rows={4}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>Mahsulot haqida batafsil ma'lumot (ixtiyoriy)</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <Button type='button' variant='outline' onClick={handleCloseDialog}>
                                    Bekor qilish
                                </Button>
                                <Button type='submit' disabled={isMutating}>
                                    {isMutating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                                    Saqlash
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu amalni qaytarib bo'lmaydi. Mahsulot butunlay o'chiriladi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isMutating}>
                            {isMutating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Product Images Dialog */}
            <ProductImagesDialog
                open={isImagesDialogOpen}
                onOpenChange={(open) => {
                    setIsImagesDialogOpen(open);
                    if (!open) setImagesProduct(null);
                }}
                product={imagesProduct}
            />

            {/* Add Products Dialog */}
            <AddProductsDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

            {/* Image Gallery Dialog */}
            <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
                <DialogContent className='max-w-7xl max-h-[90vh]'>
                    <DialogHeader>
                        <DialogTitle>Mahsulot rasmlari</DialogTitle>
                        <DialogDescription>
                            {selectedProduct?.model_detail?.name || 'Mahsulot'} - {selectedProduct?.category_detail?.name}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedProduct?.attachments && selectedProduct.attachments.length > 0 ? (
                        <div className='space-y-4'>
                            {/* Main Image with Zoom */}
                            <TransformWrapper
                                initialScale={1}
                                minScale={0.5}
                                maxScale={4}
                                centerOnInit
                                wheel={{ step: 0.1 }}
                                doubleClick={{ mode: 'toggle', step: 0.7 }}
                                pinch={{ step: 5 }}
                            >
                                {({ zoomIn, zoomOut, resetTransform }) => (
                                    <div className='relative'>
                                        {/* Zoom Controls */}
                                        <div className='absolute top-2 right-2 z-10 flex gap-1 bg-background/80 rounded-lg p-1'>
                                            <Button
                                                variant='outline'
                                                size='icon'
                                                onClick={() => zoomIn()}
                                                title='Yaqinlashtirish'
                                                className='h-8 w-8'
                                            >
                                                <ZoomIn className='h-4 w-4' />
                                            </Button>
                                            <Button
                                                variant='outline'
                                                size='icon'
                                                onClick={() => zoomOut()}
                                                title='Uzoqlashtirish'
                                                className='h-8 w-8'
                                            >
                                                <ZoomOut className='h-4 w-4' />
                                            </Button>
                                            <Button
                                                variant='outline'
                                                size='icon'
                                                onClick={() => resetTransform()}
                                                title='Qayta tiklash'
                                                className='h-8 w-8'
                                            >
                                                <RotateCw className='h-4 w-4' />
                                            </Button>
                                        </div>

                                        {/* Navigation Buttons */}
                                        {selectedProduct.attachments.length > 1 && (
                                            <>
                                                <Button
                                                    variant='outline'
                                                    size='icon'
                                                    className='absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background'
                                                    onClick={() => {
                                                        resetTransform();
                                                        setCurrentImageIndex((prev) =>
                                                            prev === 0 ? selectedProduct.attachments!.length - 1 : prev - 1
                                                        );
                                                    }}
                                                >
                                                    <ArrowDown className='h-4 w-4 rotate-90' />
                                                </Button>
                                                <Button
                                                    variant='outline'
                                                    size='icon'
                                                    className='absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background'
                                                    onClick={() => {
                                                        resetTransform();
                                                        setCurrentImageIndex((prev) =>
                                                            prev === selectedProduct.attachments!.length - 1 ? 0 : prev + 1
                                                        );
                                                    }}
                                                >
                                                    <ArrowDown className='h-4 w-4 -rotate-90' />
                                                </Button>
                                            </>
                                        )}

                                        {/* Image Counter */}
                                        {selectedProduct.attachments.length > 1 && (
                                            <div className='absolute bottom-2 right-2 z-10 bg-background/80 px-2 py-1 rounded text-sm'>
                                                {currentImageIndex + 1} / {selectedProduct.attachments.length}
                                            </div>
                                        )}

                                        {/* Zoomable Image */}
                                        <TransformComponent
                                            wrapperClass='!w-full !h-[60vh] bg-muted rounded-lg overflow-hidden'
                                            contentClass='!w-full !h-full flex items-center justify-center'
                                        >
                                            <img
                                                src={selectedProduct.attachments[currentImageIndex]?.file}
                                                alt={`Product ${currentImageIndex + 1}`}
                                                className='max-w-full max-h-full object-contain'
                                                style={{ userSelect: 'none' }}
                                            />
                                        </TransformComponent>
                                    </div>
                                )}
                            </TransformWrapper>

                            {/* Thumbnail Grid */}
                            {selectedProduct.attachments.length > 1 && (
                                <div className='grid grid-cols-8 gap-2 max-h-32 overflow-y-auto'>
                                    {selectedProduct.attachments.map((attachment, index) => (
                                        <button
                                            key={attachment.id}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={cn(
                                                'relative aspect-square rounded-md overflow-hidden border-2 transition-all hover:opacity-80',
                                                currentImageIndex === index ? 'border-primary ring-2 ring-primary' : 'border-transparent'
                                            )}
                                        >
                                            <img
                                                src={attachment.file}
                                                alt={`Thumbnail ${index + 1}`}
                                                className='w-full h-full object-cover'
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Instructions */}
                            <div className='text-xs text-muted-foreground text-center space-y-1'>
                                <p>💡 Rasmni yaqinlashtirish: Scroll yoki zoom tugmalari</p>
                                <p>💡 Rasmni siljitish: Bosib ushlang va torting</p>
                                <p>💡 Ikki marta bosing: Avtomatik zoom</p>
                            </div>
                        </div>
                    ) : (
                        <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
                            <Package className='h-16 w-16 mb-4' />
                            <p>Rasm mavjud emas</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
