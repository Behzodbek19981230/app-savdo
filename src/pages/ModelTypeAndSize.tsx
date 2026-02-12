/**
 * Model turlari va Model o'lchamlari — bitta sahifa, tablar orqali
 * Tab 1: Model turi ro'yxati + "Qo'shish" modalka
 * Tab 2: Model o'lchami (jadval)
 */

import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Autocomplete } from '@/components/ui/autocomplete';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from '@/components/ui/pagination';
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
import { Tag, Ruler, Plus, Trash2, Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useModelTypes, useUpdateModelType, useDeleteModelType } from '@/hooks/api/useModelTypes';
import type { ModelType } from '@/services/modelType.service';
import { useProductModels } from '@/hooks/api/useProductModels';
import { useUnits } from '@/hooks/api/useUnit';
import { useModelSizes } from '@/hooks/api/useModelSizes';
import { modelTypeService, type ProductTypeCreateItem, type ProductTypeSizeItem } from '@/services/modelType.service';
import { modelTypeKeys } from '@/hooks/api/useModelTypes';
import ModelSizes from '@/pages/ModelSizes';

const ITEMS_PER_PAGE = 10;
const defaultSizeRow = (): ProductTypeSizeItem => ({ size: '', unit: '' });

type TabValue = 'model-type' | 'model-size';
type SortField = 'name' | 'model' | 'sorting' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

interface ModelTypeAndSizeProps {
    defaultTab?: TabValue;
}

export default function ModelTypeAndSize({ defaultTab = 'model-type' }: ModelTypeAndSizeProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);

    // Tab 1: list state
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Add modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modelSearch, setModelSearch] = useState('');
    const [madel, setMadel] = useState<number>(0);
    const [name, setName] = useState('');
    const [sorting, setSorting] = useState(1);
    const [productTypeSizeRows, setProductTypeSizeRows] = useState<ProductTypeSizeItem[]>([defaultSizeRow()]);

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editModelSearch, setEditModelSearch] = useState('');
    const [editMadel, setEditMadel] = useState<number>(0);
    const [editName, setEditName] = useState('');
    const [editSorting, setEditSorting] = useState<number>(0);
    const [editMadelLabel, setEditMadelLabel] = useState('');
    const [editModelSizes, setEditModelSizes] = useState<ProductTypeSizeItem[]>([]);

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;
    const { data, isLoading } = useModelTypes({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        ordering,
        is_delete: false,
    });
    const { data: modelsData, isLoading: isModelsLoading } = useProductModels({
        limit: 50,
        is_delete: false,
        search: modelSearch || undefined,
    });
    const { data: modelsEditData, isLoading: isModelsEditLoading } = useProductModels({
        limit: 50,
        is_delete: false,
        search: editModelSearch || undefined,
    });
    const { data: unitsData } = useUnits({ limit: 1000, is_active: true });
    const { data: modelSizesData, isLoading: isModelSizesLoading } = useModelSizes(
        editingId ? { product_type: editingId, limit: 1000, is_delete: false } : undefined,
    );

    const modelTypes = data?.results ?? [];
    const pagination = data?.pagination;
    const totalPages = pagination?.lastPage || 1;
    const models = modelsData?.results ?? [];
    const modelsEdit = useMemo(() => modelsEditData?.results ?? [], [modelsEditData?.results]);
    const units = unitsData?.results ?? [];
    const modelSizes = useMemo(() => modelSizesData?.results ?? [], [modelSizesData?.results]);

    const updateModelType = useUpdateModelType();
    const deleteModelType = useDeleteModelType();

    const createBulk = useMutation({
        mutationFn: (data: ProductTypeCreateItem[]) => modelTypeService.createProductTypesBulk(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: modelTypeKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['modelSizes'] });
            toast({ title: 'Muvaffaqiyatli', description: "Model turi va o'lchamlar saqlandi" });
            setIsAddModalOpen(false);
            resetAddForm();
        },
        onError: (err: unknown) => {
            const msg =
                err && typeof err === 'object' && 'message' in err
                    ? String((err as { message: unknown }).message)
                    : 'Xatolik';
            toast({ title: 'Xatolik', description: msg, variant: 'destructive' });
        },
    });

    function resetAddForm() {
        setModelSearch('');
        setMadel(0);
        setName('');
        setSorting(1);
        setProductTypeSizeRows([defaultSizeRow()]);
    }

    const addSizeRow = () => setProductTypeSizeRows((prev) => [...prev, defaultSizeRow()]);
    const removeSizeRow = (index: number) => setProductTypeSizeRows((prev) => prev.filter((_, i) => i !== index));
    const updateSizeRow = (index: number, field: 'size' | 'unit', value: string | number) =>
        setProductTypeSizeRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

    // Edit modal uchun size row funksiyalari
    const addEditSizeRow = () => setEditModelSizes((prev) => [...prev, defaultSizeRow()]);
    const removeEditSizeRow = (index: number) => {
        // Faqat state'dan o'chirish (PUT request'da barcha size'lar yuboriladi)
        setEditModelSizes((prev) => prev.filter((_, i) => i !== index));
    };
    const updateEditSizeRow = (index: number, field: 'size' | 'unit', value: string | number) =>
        setEditModelSizes((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

    const handleSubmitModelType = (e: React.FormEvent) => {
        e.preventDefault();
        if (!madel || !name.trim()) {
            toast({
                title: 'Xatolik',
                description: "Model va nomi to'ldirilishi shart",
                variant: 'destructive',
            });
            return;
        }
        const sizes = productTypeSizeRows.filter(
            (r) => String(r.size).trim() !== '' && r.unit !== '' && r.unit !== undefined,
        );
        if (sizes.length === 0) {
            toast({
                title: 'Xatolik',
                description: "Kamida bitta o'lcham (size + unit) kiriting",
                variant: 'destructive',
            });
            return;
        }
        const payload: ProductTypeCreateItem[] = [
            {
                madel,
                name: name.trim(),
                sorting: Number(sorting) || 1,
                product_type_size: sizes.map((r) => ({
                    size: typeof r.size === 'number' ? r.size : (r.size as string).trim(),
                    unit: typeof r.unit === 'number' ? r.unit : Number(r.unit) || (r.unit as string),
                })),
            },
        ];
        createBulk.mutate(payload);
    };

    const openEditModal = (mt: ModelType) => {
        setEditingId(mt.id);
        setEditMadel(mt.madel ?? mt.model ?? 0);
        setEditName(mt.name ?? '');
        setEditSorting(mt.sorting ?? 0);
        setEditMadelLabel(mt.madel_detail?.name ?? '');
        setEditModelSearch('');
        setEditModelSizes([]);
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingId(null);
    };
    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId == null || !editName.trim()) {
            toast({ title: 'Xatolik', description: "Nomi to'ldirilishi shart", variant: 'destructive' });
            return;
        }

        try {
            // Validatsiya: kamida bitta o'lcham bo'lishi kerak
            const validSizes = editModelSizes.filter(
                (r) => String(r.size).trim() !== '' && r.unit !== '' && r.unit !== undefined,
            );

            if (validSizes.length === 0) {
                toast({
                    title: 'Xatolik',
                    description: "Kamida bitta o'lcham (size + unit) kiriting",
                    variant: 'destructive',
                });
                return;
            }

            // PUT request uchun data tayyorlash (create formatida)
            const updateData: ProductTypeCreateItem = {
                madel: editMadel || 0,
                name: editName.trim(),
                sorting: editSorting || 0,
                product_type_size: validSizes.map((r) => ({
                    size: typeof r.size === 'number' ? r.size : (r.size as string).trim(),
                    unit: typeof r.unit === 'number' ? r.unit : Number(r.unit) || (r.unit as string),
                })),
            };

            // PUT request yuborish
            await modelTypeService.updateProductTypeWithSizes(editingId, updateData);

            queryClient.invalidateQueries({ queryKey: modelTypeKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['modelSizes'] });
            toast({ title: 'Muvaffaqiyatli', description: "Model turi va o'lchamlar yangilandi" });
            closeEditModal();
        } catch (err) {
            const msg =
                err && typeof err === 'object' && 'message' in err
                    ? String((err as { message: unknown }).message)
                    : 'Xatolik';
            toast({ title: 'Xatolik', description: msg, variant: 'destructive' });
        }
    };
    const openDeleteDialog = (id: number) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };
    const handleDelete = () => {
        if (deletingId == null) return;
        deleteModelType.mutate(deletingId, {
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setDeletingId(null);
            },
        });
    };
    const editModelOptions = useMemo(() => {
        const list = modelsEdit.map((m) => ({ value: m.id, label: m.name }));
        if (editingId != null && editMadel && !list.some((o) => o.value === editMadel)) {
            return [{ value: editMadel, label: editMadelLabel || String(editMadel) }, ...list];
        }
        return list;
    }, [modelsEdit, editingId, editMadel, editMadelLabel]);

    // Model sizes yuklanganida editModelSizes'ni yangilash
    useEffect(() => {
        if (editingId && modelSizes.length > 0) {
            setEditModelSizes(
                modelSizes.map((ms) => ({
                    id: ms.id,
                    size: String(ms.size),
                    unit: ms.unit || '',
                })),
            );
        }
    }, [editingId, modelSizes]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === 'asc') setSortDirection('desc');
            else if (sortDirection === 'desc') {
                setSortField(null);
                setSortDirection(null);
            } else setSortDirection('asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };
    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className='h-4 w-4 ml-2 text-muted-foreground' />;
        if (sortDirection === 'asc') return <ArrowUp className='h-4 w-4 ml-2' />;
        return <ArrowDown className='h-4 w-4 ml-2' />;
    };
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const renderPaginationItems = () => {
        const items = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        const endPage = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
        if (startPage > 1) {
            items.push(
                <PaginationItem key='1'>
                    <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
                        1
                    </PaginationLink>
                </PaginationItem>,
            );
            if (startPage > 2) items.push(<PaginationEllipsis key='ellipsis-start' />);
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
            if (endPage < totalPages - 1) items.push(<PaginationEllipsis key='ellipsis-end' />);
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

    return (
        <div className='space-y-6'>
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabValue)}>
                <TabsList className='grid w-full max-w-md grid-cols-2'>
                    <TabsTrigger value='model-type' className='gap-2'>
                        <Tag className='h-4 w-4' />
                        Model turi
                    </TabsTrigger>
                    <TabsTrigger value='model-size' className='gap-2'>
                        <Ruler className='h-4 w-4' />
                        Model o&apos;lchami
                    </TabsTrigger>
                </TabsList>

                <TabsContent value='model-type' className='mt-4'>
                    <Card>
                        <CardHeader className='pb-4 flex flex-row items-center justify-between'>
                            <div>
                                <CardTitle className='text-lg'>Model turlari</CardTitle>
                                <CardDescription>Jami {pagination?.total ?? 0} ta model turi</CardDescription>
                            </div>
                            <Button onClick={() => setIsAddModalOpen(true)}>
                                <Plus className='mr-2 h-4 w-4' />
                                Model turi va o&apos;lchamlar qo&apos;shish
                            </Button>
                        </CardHeader>
                        <CardContent>
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
                            {isLoading ? (
                                <div className='flex justify-center py-8'>
                                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                                </div>
                            ) : modelTypes.length === 0 ? (
                                <div className='flex flex-col items-center justify-center py-8 text-center'>
                                    <Tag className='h-12 w-12 text-muted-foreground/50 mb-3' />
                                    <p className='text-muted-foreground'>Ma&apos;lumot topilmadi</p>
                                </div>
                            ) : (
                                <>
                                    <div className='rounded-md border'>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className='w-[80px]'>#</TableHead>
                                                    <TableHead>
                                                        <button
                                                            className='flex items-center hover:text-foreground transition-colors'
                                                            onClick={() => handleSort('name')}
                                                        >
                                                            Nomi
                                                            {getSortIcon('name')}
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
                                                    <TableHead className='w-[100px] text-right'>Amallar</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {modelTypes.map((mt, index) => (
                                                    <TableRow key={mt.id}>
                                                        <TableCell>
                                                            {index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}
                                                        </TableCell>
                                                        <TableCell className='font-medium'>{mt.name}</TableCell>
                                                        <TableCell>
                                                            {mt.madel_detail?.name ?? mt.madel ?? '-'}
                                                        </TableCell>
                                                        <TableCell className='text-right'>
                                                            <div className='flex items-center justify-end gap-1'>
                                                                <Button
                                                                    variant='ghost'
                                                                    size='icon'
                                                                    onClick={() => openEditModal(mt)}
                                                                    title='Tahrirlash'
                                                                >
                                                                    <Edit className='h-4 w-4' />
                                                                </Button>
                                                                <Button
                                                                    variant='ghost'
                                                                    size='icon'
                                                                    onClick={() => openDeleteDialog(mt.id)}
                                                                    title="O'chirish"
                                                                    className='text-destructive hover:text-destructive'
                                                                >
                                                                    <Trash2 className='h-4 w-4' />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {totalPages > 1 && (
                                        <div className='mt-4'>
                                            <Pagination>
                                                <PaginationContent>
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            onClick={() =>
                                                                handlePageChange(Math.max(1, currentPage - 1))
                                                            }
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
                                                                currentPage === totalPages &&
                                                                'pointer-events-none opacity-50',
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
                </TabsContent>

                <TabsContent value='model-size' className='mt-4'>
                    <ModelSizes />
                </TabsContent>
            </Tabs>

            {/* Modal: Model turi va o'lchamlar qo'shish */}
            <Dialog
                open={isAddModalOpen}
                onOpenChange={(open) => {
                    setIsAddModalOpen(open);
                    if (!open) resetAddForm();
                }}
            >
                <DialogContent className='sm:max-w-[500px] max-h-[90vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>Model turi va o&apos;lchamlar qo&apos;shish</DialogTitle>
                        <DialogDescription>
                            Model tanlang, nom va tartib bering, keyin o&apos;lchamlar (size + unit) qo&apos;shing.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitModelType} className='space-y-4'>
                        <div className='grid gap-4 sm:grid-cols-2'>
                            <div className='space-y-2'>
                                <Label>Model (madel) *</Label>
                                <Autocomplete
                                    options={models.map((m) => ({ value: m.id, label: m.name }))}
                                    value={madel || undefined}
                                    onValueChange={(val) => setMadel(Number(val))}
                                    placeholder='Model tanlang'
                                    searchPlaceholder='Model qidirish...'
                                    emptyText='Model topilmadi'
                                    onSearchChange={setModelSearch}
                                    isLoading={isModelsLoading}
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label>Nomi *</Label>
                                <Input
                                    placeholder='Model turi nomi'
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className='space-y-2 max-w-[200px]'>
                            <Label>Tartib (sorting)</Label>
                            <Input
                                type='number'
                                min={0}
                                value={sorting}
                                onChange={(e) => setSorting(Number(e.target.value) || 0)}
                            />
                        </div>
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between'>
                                <Label>O&apos;lchamlar (product_type_size) *</Label>
                                <Button type='button' variant='outline' size='sm' onClick={addSizeRow}>
                                    <Plus className='h-4 w-4 mr-1' />
                                    Qo&apos;shish
                                </Button>
                            </div>
                            <div className='rounded-md border p-3 space-y-2 max-h-[220px] overflow-y-auto'>
                                {productTypeSizeRows.map((row, index) => (
                                    <div key={index} className='flex flex-wrap items-center gap-2'>
                                        <Input
                                            placeholder='Size'
                                            className='w-28'
                                            value={row.size}
                                            onChange={(e) => updateSizeRow(index, 'size', e.target.value)}
                                        />
                                        <Autocomplete
                                            options={units.map((u) => ({ value: u.id, label: u.code }))}
                                            value={row.unit ? Number(row.unit) : undefined}
                                            onValueChange={(v) => updateSizeRow(index, 'unit', Number(v))}
                                            placeholder='Unit'
                                            searchPlaceholder='Birlik qidirish...'
                                            emptyText='Topilmadi'
                                            className='w-[140px]'
                                        />
                                        <Button
                                            type='button'
                                            variant='ghost'
                                            size='icon'
                                            onClick={() => removeSizeRow(index)}
                                            className='text-destructive'
                                        >
                                            <Trash2 className='h-4 w-4' />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type='button' variant='outline' onClick={() => setIsAddModalOpen(false)}>
                                Bekor qilish
                            </Button>
                            <Button type='submit' disabled={createBulk.isPending}>
                                {createBulk.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                                Saqlash
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Tahrirlash */}
            <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && closeEditModal()}>
                <DialogContent className='sm:max-w-[500px] max-h-[90vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>Model turini tahrirlash</DialogTitle>
                        <DialogDescription>Nomi, model, tartib va o'lchamlarni o'zgartiring.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitEdit} className='space-y-4'>
                        <div className='space-y-2'>
                            <Label>Model (madel) *</Label>
                            <Autocomplete
                                options={editModelOptions}
                                value={editMadel || undefined}
                                onValueChange={(v) => setEditMadel(Number(v))}
                                placeholder='Model tanlang'
                                searchPlaceholder='Model qidirish...'
                                emptyText='Model topilmadi'
                                onSearchChange={setEditModelSearch}
                                isLoading={isModelsEditLoading}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label>Nomi *</Label>
                            <Input
                                placeholder='Model turi nomi'
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>
                        <div className='space-y-2 max-w-[200px]'>
                            <Label>Tartib (sorting)</Label>
                            <Input
                                type='number'
                                min={0}
                                value={editSorting}
                                onChange={(e) => setEditSorting(Number(e.target.value) || 0)}
                            />
                        </div>
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between'>
                                <Label>O&apos;lchamlar (product_type_size)</Label>
                                <Button type='button' variant='outline' size='sm' onClick={addEditSizeRow}>
                                    <Plus className='h-4 w-4 mr-1' />
                                    Qo&apos;shish
                                </Button>
                            </div>
                            {isModelSizesLoading ? (
                                <div className='flex justify-center py-4'>
                                    <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                                </div>
                            ) : (
                                <div className='rounded-md border p-3 space-y-2 max-h-[220px] overflow-y-auto'>
                                    {editModelSizes.length === 0 ? (
                                        <p className='text-sm text-muted-foreground text-center py-2'>
                                            O&apos;lcham topilmadi
                                        </p>
                                    ) : (
                                        editModelSizes.map((row, index) => (
                                            <div key={index} className='flex flex-wrap items-center gap-2'>
                                                <Input
                                                    placeholder='Size'
                                                    className='w-28'
                                                    value={row.size}
                                                    onChange={(e) => updateEditSizeRow(index, 'size', e.target.value)}
                                                />
                                                <Autocomplete
                                                    options={units.map((u) => ({ value: u.id, label: u.code }))}
                                                    value={row.unit ? Number(row.unit) : undefined}
                                                    onValueChange={(v) => updateEditSizeRow(index, 'unit', Number(v))}
                                                    placeholder='Unit'
                                                    searchPlaceholder='Birlik qidirish...'
                                                    emptyText='Topilmadi'
                                                    className='w-[140px]'
                                                />
                                                <Button
                                                    type='button'
                                                    variant='ghost'
                                                    size='icon'
                                                    onClick={() => removeEditSizeRow(index)}
                                                    className='text-destructive'
                                                >
                                                    <Trash2 className='h-4 w-4' />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type='button' variant='outline' onClick={closeEditModal}>
                                Bekor qilish
                            </Button>
                            <Button type='submit' disabled={updateModelType.isPending}>
                                {updateModelType.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                                Saqlash
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* O'chirish tasdiq */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu model turi o'chiriladi. Bu amalni qaytarib bo'lmaydi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteModelType.isPending}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            {deleteModelType.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
