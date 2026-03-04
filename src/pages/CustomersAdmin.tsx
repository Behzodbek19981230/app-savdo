/**
 * Customers (Clients) Page
 * /customers
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { clientSchema, type ClientFormData } from '@/lib/validations/client';
import {
    useClients,
    useClient,
    useCreateClient,
    useDeleteClient,
    useUpdateClient,
    toClientFormDefaults,
} from '@/hooks/api/useClients';
import { useRegions, useDistricts } from '@/hooks/api/useLocations';
import { useCompanies } from '@/hooks/api/useCompanies';
import { useAuthContext } from '@/contexts/AuthContext';
import type { Client, ClientListResponse } from '@/services/client.service';
import { ArrowDown, ArrowUp, ArrowUpDown, Edit, Loader2, Plus, Search, Trash2, Users } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import PhoneInput from '@/components/ui/PhoneInput';

const ITEMS_PER_PAGE = 10;

type SortField = 'full_name' | 'phone_number' | 'total_debt' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function CustomersAdmin() {
    const { user, selectedFilialId } = useAuthContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const form = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            full_name: '',
            is_active: true,
            date_of_birthday: '',
            gender: '',
            phone_number: '+998',
            region: 0,
            district: 0,
            filial: selectedFilialId ?? user?.filials_detail?.[0]?.id ?? 0,
            total_debt: 0,
            keshbek: 0,
            type: 'dona',
            is_delete: false,
        },
    });

    const selectedRegion = form.watch('region');
    const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;

    const { data, isLoading } = useClients({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        ordering,
        is_delete: false,
        filial: selectedFilialId ?? undefined,
    });

    const { data: regionsData } = useRegions({ perPage: 1000 });
    const { data: districtsData } = useDistricts(
        selectedRegion ? { region: selectedRegion, perPage: 1000 } : undefined,
    );
    const { data: companiesData } = useCompanies({ limit: 1000, is_delete: false });

    const regions = regionsData?.results || [];
    const districts = districtsData?.results || [];
    const companies = companiesData?.results || [];

    const createClient = useCreateClient();
    const updateClient = useUpdateClient();
    const deleteClient = useDeleteClient();
    const { data: clientDetailData } = useClient(editingId || 0);
    const typedData = data as ClientListResponse | undefined;

    const clients = typedData?.results || [];
    const pagination = typedData?.pagination;
    const totalPages = pagination?.lastPage || 1;

    useEffect(() => {
        if (editingId) return;
        form.setValue('district', 0);
    }, [selectedRegion, editingId]);

    useEffect(() => {
        if (selectedFilialId) {
            form.setValue('filial', selectedFilialId);
        }
    }, [selectedFilialId]);

    useEffect(() => {
        if (editingId && clientDetailData && isDialogOpen) {
            form.reset(toClientFormDefaults(clientDetailData));
        }
    }, [editingId, clientDetailData, isDialogOpen, form]);

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

    const handleOpenDialog = (item?: Client) => {
        if (item) {
            setEditingId(item.id);
            form.reset(toClientFormDefaults(item));
        } else {
            setEditingId(null);
            form.reset({
                full_name: '',
                is_active: true,
                date_of_birthday: '',
                gender: '',
                phone_number: '+998',
                region: 0,
                district: 0,
                filial: selectedFilialId ?? user?.filials_detail?.[0]?.id ?? 0,
                total_debt: 0,
                keshbek: 0,
                type: 'dona',
                is_delete: false,
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingId(null);
        form.reset();
    };

    const onSubmit = async (values: ClientFormData) => {
        try {
            const payload = {
                full_name: values.full_name,
                is_active: values.is_active,
                date_of_birthday: values.date_of_birthday || '',
                gender: values.gender || '',
                phone_number: values.phone_number || '',
                region: values.region,
                district: values.district,
                filial: values.filial,
                total_debt: Number(values.total_debt || 0),
                keshbek: Number(values.keshbek || 0),
                type: values.type,
                is_delete: false,
            };

            if (editingId) {
                await updateClient.mutateAsync({ id: editingId, data: payload });
            } else {
                await createClient.mutateAsync(payload);
            }
            handleCloseDialog();
        } catch {
            // handled in hook
        }
    };

    const openDeleteDialog = (id: number) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteClient.mutateAsync(deletingId);
            setIsDeleteDialogOpen(false);
            setDeletingId(null);
        } catch {
            // handled in hook
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getMoney = (value: number | string | null | undefined) => {
        const amount = Number(value || 0);
        return new Intl.NumberFormat('uz-UZ').format(amount);
    };

    const getCreatedByName = (client: Client) =>
        client.created_by_detail?.full_name || client.created_by_detail?.username || '-';

    return (
        <div className='space-y-6'>
            <Card>
                <CardHeader className='pb-4 flex flex-row items-center justify-between'>
                    <div>
                        <div className='flex items-center gap-2'>
                            <Users className='h-5 w-5 text-primary' />
                            <CardTitle className='text-lg'>Mijozlar</CardTitle>
                        </div>
                        <CardDescription>Jami {pagination?.total || clients.length} ta mijoz</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className='mr-2 h-4 w-4' />
                        Yangi mijoz
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center gap-4 mb-4'>
                        <div className='relative flex-1 max-w-sm'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                            <Input
                                placeholder='Mijoz qidirish...'
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
                        <div className='flex items-center justify-center py-8'>
                            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                        </div>
                    ) : clients.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-8 text-center'>
                            <Users className='h-12 w-12 text-muted-foreground/50 mb-3' />
                            <p className='text-muted-foreground'>Mijozlar topilmadi</p>
                        </div>
                    ) : (
                        <>
                            <div className='rounded-md border overflow-x-auto'>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className='w-[50px]'>#</TableHead>
                                            <TableHead>
                                                <button
                                                    className='flex items-center hover:text-foreground transition-colors'
                                                    onClick={() => handleSort('full_name')}
                                                >
                                                    F.I.Sh
                                                    {getSortIcon('full_name')}
                                                </button>
                                            </TableHead>
                                            <TableHead>Yaratgan xodim</TableHead>
                                            <TableHead>Telefon</TableHead>
                                            <TableHead>Filial</TableHead>
                                            <TableHead>
                                                <button
                                                    className='flex items-center hover:text-foreground transition-colors'
                                                    onClick={() => handleSort('total_debt')}
                                                >
                                                    Qarz
                                                    {getSortIcon('total_debt')}
                                                </button>
                                            </TableHead>
                                            <TableHead>Keshbek</TableHead>
                                            <TableHead>Holati</TableHead>
                                            <TableHead className='text-right'>Amallar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clients.map((client, index) => (
                                            <TableRow key={client.id}>
                                                <TableCell className='font-medium'>
                                                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                                </TableCell>
                                                <TableCell className='font-medium'>{client.full_name || '-'}</TableCell>
                                                <TableCell>{getCreatedByName(client)}</TableCell>
                                                <TableCell>{client.phone_number || '-'}</TableCell>
                                                <TableCell>
                                                    {client.filial_detail?.name || client.filial || '-'}
                                                </TableCell>
                                                <TableCell>{getMoney(client.total_debt)}</TableCell>
                                                <TableCell>{getMoney(client.keshbek)}</TableCell>

                                                <TableCell>
                                                    <Badge variant={client.is_active ? 'default' : 'secondary'}>
                                                        {client.is_active ? 'Faol' : 'Nofaol'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className='text-right'>
                                                    <div className='flex items-center justify-end gap-1'>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            onClick={() => handleOpenDialog(client)}
                                                        >
                                                            <Edit className='h-4 w-4' />
                                                        </Button>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            onClick={() => openDeleteDialog(client.id)}
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
                                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                                let pageNum: number;
                                                if (totalPages <= 5) pageNum = i + 1;
                                                else if (currentPage <= 3) pageNum = i + 1;
                                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                                else pageNum = currentPage - 2 + i;
                                                return (
                                                    <PaginationItem key={pageNum}>
                                                        <PaginationLink
                                                            onClick={() => handlePageChange(pageNum)}
                                                            isActive={currentPage === pageNum}
                                                        >
                                                            {pageNum}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            })}
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className='sm:max-w-[760px] max-h-[90vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Mijozni tahrirlash' : "Yangi mijoz qo'shish"}</DialogTitle>
                        <DialogDescription>Mijoz ma'lumotlarini kiriting</DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                            <FormField
                                control={form.control}
                                name='full_name'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>F.I.Sh *</FormLabel>
                                        <FormControl>
                                            <Input placeholder='F.I.Sh' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

                                <FormField
                                    control={form.control}
                                    name='phone_number'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefon</FormLabel>
                                            <FormControl>
                                                <PhoneInput placeholder='+998 90 123 45 67' {...field} />

                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name='gender'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Jinsi</FormLabel>
                                            <Select
                                                value={field.value || 'none'}
                                                onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Tanlang' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value='none'>Tanlanmagan</SelectItem>
                                                    <SelectItem value='male'>Erkak</SelectItem>
                                                    <SelectItem value='female'>Ayol</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name='date_of_birthday'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tug'ilgan sana</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    date={
                                                        field.value
                                                            ? (() => {
                                                                const parsed = parseISO(field.value);
                                                                return isValid(parsed) ? parsed : undefined;
                                                            })()
                                                            : undefined
                                                    }
                                                    onDateChange={(date) =>
                                                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                                                    }
                                                    className='w-full'
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='filial'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Filial *</FormLabel>
                                            <Select
                                                value={field.value ? String(field.value) : undefined}
                                                onValueChange={(value) => field.onChange(Number(value))}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Filial tanlang' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {companies.map((company) => (
                                                        <SelectItem key={company.id} value={String(company.id)}>
                                                            {company.name}
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
                                    name='region'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Viloyat *</FormLabel>
                                            <Select
                                                value={field.value ? String(field.value) : undefined}
                                                onValueChange={(value) => field.onChange(Number(value))}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Viloyat tanlang' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {regions.map((region) => (
                                                        <SelectItem key={region.id} value={String(region.id)}>
                                                            {region.name}
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
                                    name='district'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tuman *</FormLabel>
                                            <Select
                                                value={field.value ? String(field.value) : undefined}
                                                onValueChange={(value) => field.onChange(Number(value))}
                                                disabled={!selectedRegion}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Tuman tanlang' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {districts.map((district) => (
                                                        <SelectItem key={district.id} value={String(district.id)}>
                                                            {district.name}
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
                                    name='total_debt'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Umumiy qarz</FormLabel>
                                            <FormControl>
                                                <Input type='number' step='0.01' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='keshbek'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Keshbek</FormLabel>
                                            <FormControl>
                                                <Input type='number' step='0.01' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='type'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mijoz turi</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Turini tanlang' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value='dona'>Dona</SelectItem>
                                                    <SelectItem value='optom'>Optom</SelectItem>
                                                    <SelectItem value='dokon'>Dokon</SelectItem>
                                                    <SelectItem value='hamkor'>Hamkor</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='is_active'
                                    render={({ field }) => (
                                        <FormItem className='flex items-center justify-between rounded-lg border p-3'>
                                            <div>
                                                <FormLabel>Faol holat</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <Button type='button' variant='outline' onClick={handleCloseDialog}>
                                    Bekor qilish
                                </Button>
                                <Button type='submit' disabled={createClient.isPending || updateClient.isPending}>
                                    {(createClient.isPending || updateClient.isPending) && (
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    )}
                                    {editingId ? 'Saqlash' : "Qo'shish"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Diqqat!</AlertDialogTitle>
                        <AlertDialogDescription>
                            Haqiqatan ham ushbu mijozni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            disabled={deleteClient.isPending}
                        >
                            {deleteClient.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
