/**
 * Model Sizes Page
 * Mahsulot model o'lchamlari sahifasi
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    Edit,
    Trash2,
    Loader2,
    Ruler,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    useModelSizes,
    useCreateModelSize,
    useUpdateModelSize,
    useDeleteModelSize,
} from '@/hooks/api/useModelSizes';
import { useModelTypes } from '@/hooks/api/useModelTypes';
import { ModelSizeType, ModelSizeTypeLabels, type ModelSize } from '@/services/modelSize.service';
import { modelSizeSchema, type ModelSizeFormData } from '@/lib/validations/modelSize';

const ITEMS_PER_PAGE = 10;

type SortField = 'model_type' | 'size' | 'type' | 'sorting' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function ModelSizes() {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Form
    const form = useForm<ModelSizeFormData>({
        resolver: zodResolver(modelSizeSchema),
        defaultValues: {
            model_type: 0,
            size: 0,
            sorting: null,
        },
    });

    // Build ordering string for API
    const ordering = sortField && sortDirection
        ? `${sortDirection === 'desc' ? '-' : ''}${sortField}`
        : undefined;

    // Queries
    const { data, isLoading } = useModelSizes({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        ordering,
        is_delete: false,
    });

    const { data: modelTypesData } = useModelTypes({
        perPage: 1000,
        is_delete: false,
    });

    // Mutations
    const createModelSize = useCreateModelSize();
    const updateModelSize = useUpdateModelSize();
    const deleteModelSize = useDeleteModelSize();

    const modelSizes = data?.results || [];
    const pagination = data?.pagination;
    const totalPages = pagination?.lastPage || 1;
    const modelTypes = modelTypesData?.results || [];

    const isMutating =
        createModelSize.isPending || updateModelSize.isPending || deleteModelSize.isPending;

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
            return <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />;
        }
        if (sortDirection === 'asc') {
            return <ArrowUp className="h-4 w-4 ml-2" />;
        }
        return <ArrowDown className="h-4 w-4 ml-2" />;
    };

    const handleOpenDialog = (item?: ModelSize) => {
        if (item) {
            setEditingId(item.id);
            form.reset({
                model_type: item.model_type || 0,
                size: item.size || 0,
                sorting: item.sorting,
            });
        } else {
            setEditingId(null);
            form.reset({
                model_type: 0,
                size: 0,
                sorting: null,
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingId(null);
        form.reset();
    };

    const onSubmit = async (data: ModelSizeFormData) => {
        try {
            const submitData = {
                model_type: data.model_type,
                size: data.size,
                sorting: data.sorting,
            };

            if (editingId) {
                await updateModelSize.mutateAsync({ id: editingId, data: submitData });
            } else {
                await createModelSize.mutateAsync(submitData);
            }
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving model size:', error);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;

        try {
            await deleteModelSize.mutateAsync(deletingId);
            setIsDeleteDialogOpen(false);
            setDeletingId(null);
        } catch (error) {
            console.error('Error deleting model size:', error);
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
        if (createModelSize.isSuccess || updateModelSize.isSuccess) {
            setIsDialogOpen(false);
            setEditingId(null);
            form.reset();
        }
    }, [createModelSize.isSuccess, updateModelSize.isSuccess, form]);

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
                <PaginationItem key="1">
                    <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
                        1
                    </PaginationLink>
                </PaginationItem>
            );
            if (startPage > 2) {
                items.push(<PaginationEllipsis key="ellipsis-start" />);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(<PaginationEllipsis key="ellipsis-end" />);
            }
            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink
                        onClick={() => handlePageChange(totalPages)}
                        isActive={currentPage === totalPages}
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    const getModelTypeName = (modelTypeId: number) => {
        const modelType = modelTypes.find((m) => m.id === modelTypeId);
        return modelType?.name || '-';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Model o'lchamlari</h1>
                    <p className="text-muted-foreground">Mahsulot model o'lchamlarini boshqaring</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Yangi o'lcham qo'shish
                </Button>
            </div>

            {/* Main Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Ruler className="h-6 w-6 text-primary" />
                            <div>
                                <CardTitle>Barcha o'lchamlar</CardTitle>
                                <CardDescription>
                                    Jami {pagination?.total || 0} ta model o'lchami
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Qidirish..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : modelSizes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Ruler className="h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">Ma'lumot topilmadi</p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">
                                                <button
                                                    className="flex items-center hover:text-foreground transition-colors"
                                                    onClick={() => handleSort('sorting')}
                                                >
                                                    Tartib
                                                    {getSortIcon('sorting')}
                                                </button>
                                            </TableHead>
                                            <TableHead>
                                                <button
                                                    className="flex items-center hover:text-foreground transition-colors"
                                                    onClick={() => handleSort('model_type')}
                                                >
                                                    Model turi
                                                    {getSortIcon('model_type')}
                                                </button>
                                            </TableHead>
                                            <TableHead>
                                                <button
                                                    className="flex items-center hover:text-foreground transition-colors"
                                                    onClick={() => handleSort('size')}
                                                >
                                                    O'lcham
                                                    {getSortIcon('size')}
                                                </button>
                                            </TableHead>

                                            <TableHead>
                                                <button
                                                    className="flex items-center hover:text-foreground transition-colors"
                                                    onClick={() => handleSort('created_at')}
                                                >
                                                    Yaratilgan sana
                                                    {getSortIcon('created_at')}
                                                </button>
                                            </TableHead>
                                            <TableHead className="text-right">Amallar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {modelSizes.map((modelSize) => (
                                            <TableRow key={modelSize.id}>
                                                <TableCell>
                                                    {modelSize.sorting !== null ? (
                                                        <Badge variant="secondary">{modelSize.sorting}</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {getModelTypeName(modelSize.model_type)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{modelSize.size}</Badge>
                                                </TableCell>

                                                <TableCell>
                                                    {modelSize.created_at
                                                        ? new Date(modelSize.created_at).toLocaleDateString('uz-UZ')
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenDialog(modelSize)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openDeleteDialog(modelSize.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
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
                                <div className="mt-4">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                                    className={cn(
                                                        currentPage === 1 && 'pointer-events-none opacity-50'
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
                                                        currentPage === totalPages && 'pointer-events-none opacity-50'
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
                <DialogContent className="sm:max-w-[525px]">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingId ? 'Tahrirlash' : 'Yangi o\'lcham qo\'shish'}
                                </DialogTitle>
                                <DialogDescription>
                                    Model o'lchami ma'lumotlarini kiriting
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <FormField
                                    control={form.control}
                                    name="model_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Model turi *</FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(parseInt(value))}
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Model turini tanlang" />
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
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="size"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>O'lcham *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Masalan: 64"
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
                                    name="sorting"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tartib raqami</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Masalan: 1"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        field.onChange(value === '' ? null : parseInt(value));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Tartib raqami bo'yicha saralanadi
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                    Bekor qilish
                                </Button>
                                <Button type="submit" disabled={isMutating}>
                                    {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                            Bu amalni qaytarib bo'lmaydi. Model o'lchami butunlay o'chiriladi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isMutating}>
                            {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
