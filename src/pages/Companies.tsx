/**
 * Companies Page
 * /company
 */

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { companyBaseSchema, type CompanyFormData } from '@/lib/validations/company';
import {
  toCompanyFormDefaults,
  useCompanies,
  useCreateCompany,
  useDeleteCompany,
  useUpdateCompany,
} from '@/hooks/api/useCompanies';
import type { Company } from '@/services/company.service';
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, Edit, Loader2, Plus, Search, Trash2, Upload } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

type SortField = 'name' | 'created_at' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function Companies() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Company | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyBaseSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      title: '',
      description: '',
      logo: undefined,
    },
  });

  const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;

  const { data, isLoading } = useCompanies({
    page: currentPage,
    perPage: ITEMS_PER_PAGE,
    search: searchQuery || undefined,
    ordering,
    is_delete: false,
  });

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const isMutating = createCompany.isPending || updateCompany.isPending || deleteCompany.isPending;

  const companies = data?.results || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.lastPage || 1;

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
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4 ml-2" />;
    return <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const revokePreview = () => {
    if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(logoPreviewUrl);
  };

  useEffect(() => {
    return () => {
      revokePreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openLogoPicker = () => logoInputRef.current?.click();

  const setLogoFromFile = (file: File | null) => {
    revokePreview();
    setLogoFile(file);
    if (file) setLogoPreviewUrl(URL.createObjectURL(file));
    else setLogoPreviewUrl(editingItem?.logo || null);
  };

  const handleOpenDialog = (item?: Company) => {
    if (item) {
      setEditingItem(item);
      form.reset({ ...toCompanyFormDefaults(item), logo: undefined });
      setLogoFromFile(null);
      setLogoPreviewUrl(item.logo || null);
    } else {
      setEditingItem(null);
      form.reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        title: '',
        description: '',
        logo: undefined,
      });
      setLogoFromFile(null);
      setLogoPreviewUrl(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    form.reset();
    setLogoFromFile(null);
    setLogoPreviewUrl(null);
  };

  const openDeleteDialog = (id: number) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteCompany.mutateAsync(deletingId);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    } catch {
      // handled in hook toast
    }
  };

  const onSubmit = async (values: CompanyFormData) => {
    if (!editingItem && !logoFile) {
      form.setError('logo', { type: 'manual', message: 'Logo majburiy' });
      return;
    }

    try {
      if (editingItem) {
        await updateCompany.mutateAsync({
          id: editingItem.id,
          data: {
            name: values.name,
            email: values.email || '',
            phone: values.phone || '',
            address: values.address || '',
            title: values.title || '',
            description: values.description || '',
            ...(logoFile ? { logo: logoFile } : {}),
          },
        });
      } else {
        await createCompany.mutateAsync({
          name: values.name,
          logo: logoFile as File,
          email: values.email || '',
          phone: values.phone || '',
          address: values.address || '',
          title: values.title || '',
          description: values.description || '',
        });
      }
      handleCloseDialog();
    } catch {
      // handled in hook toast
    }
  };

  useEffect(() => {
    if (createCompany.isSuccess || updateCompany.isSuccess) {
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
      setLogoFromFile(null);
      setLogoPreviewUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createCompany.isSuccess, updateCompany.isSuccess]);

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
        <PaginationItem key="1">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) items.push(<PaginationEllipsis key="ellipsis-start" />);
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
      if (endPage < totalPages - 1) items.push(<PaginationEllipsis key="ellipsis-end" />);
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const headerSubtitle = useMemo(() => `Jami ${pagination?.total || 0} ta`, [pagination?.total]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company</h1>
          <p className="text-muted-foreground">Company ma'lumotlarini boshqaring</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi company qo'shish
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Barcha company</CardTitle>
              <CardDescription>{headerSubtitle}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : companies.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Ma'lumot topilmadi</div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Logo</TableHead>
                      <TableHead>
                        <button
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          Nomi
                          {getSortIcon('name')}
                        </button>
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="h-9 w-9 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                            {c.logo ? (
                              <img src={c.logo} alt={c.name} className="h-full w-full object-cover" />
                            ) : (
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="max-w-[260px] truncate">{c.email || '-'}</TableCell>
                        <TableCell>{c.phone || '-'}</TableCell>
                        <TableCell className="max-w-[220px] truncate">{c.title || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(c)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(c.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={cn(currentPage === 1 && 'pointer-events-none opacity-50')}
                        />
                      </PaginationItem>
                      {renderPaginationItems()}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={cn(currentPage === totalPages && 'pointer-events-none opacity-50')}
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
        <DialogContent className="w-[96vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Tahrirlash' : "Yangi company qo'shish"}</DialogTitle>
                <DialogDescription>Company ma'lumotlarini kiriting</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomi *</FormLabel>
                        <FormControl>
                          <Input placeholder="Company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="mail@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input placeholder="+998..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo"
                  render={() => (
                    <FormItem>
                      <FormLabel>Logo {editingItem ? '(ixtiyoriy)' : '*'}</FormLabel>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                          {logoPreviewUrl ? (
                            <img src={logoPreviewUrl} alt="Logo" className="h-full w-full object-cover" />
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setLogoFromFile(f);
                            }}
                          />
                          <Button type="button" variant="outline" onClick={openLogoPicker}>
                            <Upload className="mr-2 h-4 w-4" />
                            Tanlash
                          </Button>
                          {logoFile && (
                            <Button type="button" variant="ghost" onClick={() => setLogoFromFile(null)}>
                              Tozalash
                            </Button>
                          )}
                        </div>
                      </div>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
            <AlertDialogDescription>Bu amalni qaytarib bo'lmaydi. Company o'chiriladi.</AlertDialogDescription>
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
