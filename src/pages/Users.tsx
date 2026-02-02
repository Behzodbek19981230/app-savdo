/**
 * Users Page
 * /user
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { userUpdateSchema, type UserFormData } from '@/lib/validations/user';
import { useRoles } from '@/hooks/api/useRoles';
import { useDistricts, useRegions } from '@/hooks/api/useLocations';
import { useCompanies } from '@/hooks/api/useCompanies';
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers, toUserFormDefaults } from '@/hooks/api/useUsers';
import type { AppUser, CreateAppUserPayload, UpdateAppUserPayload } from '@/services/user.service';
import { ArrowDown, ArrowUp, ArrowUpDown, Edit, Loader2, Plus, Search, Trash2, Upload, UserCog } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

type SortField = 'username' | 'full_name' | 'roles' | 'is_active' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function Users() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<UserFormData>({
    // Update schema: create uchun passwordni submit paytida majburlaymiz
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      username: '',
      full_name: '',
      is_active: true,
      date_of_birthday: '',
      gender: '',
      phone_number: '',
      email: '',
      password: '',
      company: 0,
      region: 0,
      district: 0,
      roles: [],
      address: '',
      avatar: undefined,
    },
  });

  const ordering = sortField && sortDirection ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined;

  const { data, isLoading } = useUsers({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: searchQuery || undefined,
    ordering,
  });

  const { data: rolesData } = useRoles({ perPage: 1000, is_delete: false });
  const { data: regionsData } = useRegions({ perPage: 1000 });
  const { data: districtsData } = useDistricts({ perPage: 1000 });
  const { data: companiesData } = useCompanies({ perPage: 1000, is_delete: false });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const isMutating = createUser.isPending || updateUser.isPending || deleteUser.isPending;

  const users = data?.results || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.lastPage || 1;
  const roles = rolesData?.results || [];
  const regions = regionsData?.results || [];
  const districts = districtsData?.results || [];
  const companies = companiesData?.results || [];

  const getCompanyName = (companyId: number | null | undefined) => {
    if (!companyId) return '-';
    return companies.find((c) => c.id === companyId)?.name || String(companyId);
  };

  const getRegionName = (regionId: number | null | undefined) => {
    if (!regionId) return '-';
    return regions.find((r) => r.id === regionId)?.name || String(regionId);
  };

  const getDistrictName = (districtId: number | null | undefined) => {
    if (!districtId) return '-';
    return districts.find((d) => d.id === districtId)?.name || String(districtId);
  };

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return '-';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleString('uz-UZ');
  };

  const formatRoles = (u: AppUser) => {
    if (Array.isArray(u.roles) && u.roles.length > 0) {
      const names = u.roles
        .map((id) => roles.find((r) => r.id === id)?.name || String(id))
        .filter(Boolean);
      return names.length > 0 ? names.join(', ') : `${u.roles.length} ta`;
    }
    return '-';
  };

  // Avatar file state (FormData)
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const revokeAvatarPreview = () => {
    if (avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl);
  };

  useEffect(() => {
    return () => {
      revokeAvatarPreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAvatarFromFile = (file: File | null, existingUrl?: string | null) => {
    revokeAvatarPreview();
    setAvatarFile(file);
    if (file) setAvatarPreviewUrl(URL.createObjectURL(file));
    else setAvatarPreviewUrl(existingUrl || null);
  };

  const selectedRegion = form.watch('region');
  const filteredDistricts = useMemo(() => {
    if (!selectedRegion) return districts;
    return districts.filter((d) => Number(d.region ?? d.region_detail?.id ?? 0) === Number(selectedRegion));
  }, [districts, selectedRegion]);

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

  const handleOpenDialog = (item?: AppUser) => {
    if (item) {
      setEditingId(item.id);
      form.reset(toUserFormDefaults(item));
      setAvatarFromFile(null, item.avatar);
    } else {
      setEditingId(null);
      form.reset({
        username: '',
        full_name: '',
        is_active: true,
        date_of_birthday: '',
        gender: '',
        phone_number: '',
        email: '',
        password: '',
        company: 0,
        region: 0,
        district: 0,
        roles: [],
        address: '',
        avatar: undefined,
      });
      setAvatarFromFile(null, null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    form.reset();
    setAvatarFromFile(null, null);
  };

  const openDeleteDialog = (id: number) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteUser.mutateAsync(deletingId);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    } catch {
      // handled in hook toast
    }
  };

  const onSubmit = async (values: UserFormData) => {
    // create paytida password majburiy
    if (!editingId && (!values.password || String(values.password).trim().length < 4)) {
      form.setError('password', { type: 'manual', message: 'Parol majburiy (kamida 4 ta belgi)' });
      return;
    }

    // payload: created_by/updated_by yuborilmaydi (service type shunday)
    const payload: CreateAppUserPayload = {
      username: values.username,
      full_name: values.full_name,
      is_active: !!values.is_active,
      date_of_birthday: values.date_of_birthday || '',
      gender: values.gender || '',
      phone_number: values.phone_number || '',
      email: values.email || '',
      password: values.password || '',
      company: values.company && Number(values.company) > 0 ? Number(values.company) : undefined,
      region: values.region && Number(values.region) > 0 ? Number(values.region) : undefined,
      district: values.district && Number(values.district) > 0 ? Number(values.district) : undefined,
      roles: Array.isArray(values.roles) ? values.roles : [],
      address: values.address || '',
      avatar: avatarFile || undefined,
    };

    try {
      if (editingId) {
        // update: bo'sh password yubormaymiz
        const updatePayload: UpdateAppUserPayload = payload.password
          ? payload
          : (() => {
              const { password, ...rest } = payload;
              return rest;
            })();
        await updateUser.mutateAsync({ id: editingId, data: updatePayload });
      } else {
        await createUser.mutateAsync(payload);
      }
      handleCloseDialog();
    } catch {
      // handled in hook toast
    }
  };

  useEffect(() => {
    if (createUser.isSuccess || updateUser.isSuccess) {
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
    }
  }, [createUser.isSuccess, updateUser.isSuccess, form]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Foydalanuvchilar</h1>
          <p className="text-muted-foreground">Admin userlarni boshqaring</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi user qo'shish
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCog className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Barcha userlar</CardTitle>
              <CardDescription>Jami {pagination?.total || 0} ta</CardDescription>
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
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Ma'lumot topilmadi</div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avatar</TableHead>
                      <TableHead>
                        <button
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort('username')}
                        >
                          Username
                          {getSortIcon('username')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort('full_name')}
                        >
                          F.I.Sh
                          {getSortIcon('full_name')}
                        </button>
                      </TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>
                        <button
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort('roles')}
                        >
                          Rollar
                          {getSortIcon('roles')}
                        </button>
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>
                        <button
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort('is_active')}
                        >
                          Holat
                          {getSortIcon('is_active')}
                        </button>
                      </TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="h-9 w-9 rounded-full border bg-muted overflow-hidden flex items-center justify-center">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.full_name || u.username} className="h-full w-full object-cover" />
                            ) : (
                              <UserCog className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell>{u.full_name}</TableCell>
                        <TableCell>
                          {getCompanyName(u.company)}
                        </TableCell>
                        <TableCell>{getRegionName(u.region)}</TableCell>
                        <TableCell>{getDistrictName(u.district)}</TableCell>
                        <TableCell>{u.gender || '-'}</TableCell>
                        <TableCell className="max-w-[320px] truncate">{formatRoles(u)}</TableCell>
                        <TableCell className="max-w-[260px] truncate">{u.email || '-'}</TableCell>
                        <TableCell>{u.phone_number || '-'}</TableCell>
                        <TableCell className="max-w-[320px] truncate">{u.address || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={u.is_active ? 'default' : 'secondary'}>
                            {u.is_active ? 'Faol' : 'Nofaol'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(u.created_time || u.date_joined || u.created_at)}</TableCell>
                        <TableCell>{formatDateTime(u.updated_time || u.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(u)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(u.id)}>
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
                <DialogTitle>{editingId ? 'Tahrirlash' : "Yangi user qo'shish"}</DialogTitle>
                <DialogDescription>User ma'lumotlarini kiriting</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username *</FormLabel>
                        <FormControl>
                          <Input placeholder="admin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>F.I.Sh *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ism Familiya" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="roles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rollar *</FormLabel>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" className="w-full justify-between">
                              <span className="truncate">
                                {Array.isArray(field.value) && field.value.length > 0
                                  ? roles
                                      .filter((r) => field.value.includes(r.id))
                                      .map((r) => r.name)
                                      .join(', ')
                                  : 'Tanlang'}
                              </span>
                              <ArrowUpDown className="h-4 w-4 opacity-60" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[320px] max-h-[320px] overflow-y-auto">
                            <DropdownMenuLabel>Rollar</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {roles.map((r) => {
                              const checked = Array.isArray(field.value) && field.value.includes(r.id);
                              return (
                                <DropdownMenuCheckboxItem
                                  key={r.id}
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    const curr = Array.isArray(field.value) ? field.value : [];
                                    const next = v ? Array.from(new Set([...curr, r.id])) : curr.filter((x) => x !== r.id);
                                    field.onChange(next);
                                  }}
                                >
                                  {r.name}
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Faol</FormLabel>
                          <div className="text-sm text-muted-foreground">User aktiv / noaktiv</div>
                        </div>
                        <FormControl>
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <FormField
                    control={form.control}
                    name="phone_number"
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{editingId ? 'Parol (ixtiyoriy)' : 'Parol *'}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="****" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date_of_birthday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tug'ilgan sana</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                          value={field.value ? field.value : 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">-</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(Number(v))}
                          value={String(field.value ?? 0)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">-</SelectItem>
                            {companies.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Viloyat (Region)</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(Number(v))}
                          value={String(field.value ?? 0)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">-</SelectItem>
                            {regions.map((r) => (
                              <SelectItem key={r.id} value={String(r.id)}>
                                {r.name}
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
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tuman (District)</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(Number(v))}
                          value={String(field.value ?? 0)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">-</SelectItem>
                            {filteredDistricts.map((d) => (
                              <SelectItem key={d.id} value={String(d.id)}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormLabel>Manzil</FormLabel>
                      <FormControl>
                        <Input placeholder="..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avatar"
                  render={() => (
                    <FormItem>
                      <FormLabel>Avatar (File)</FormLabel>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                          {avatarPreviewUrl ? (
                            <img src={avatarPreviewUrl} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            <UserCog className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setAvatarFromFile(f, null);
                            }}
                          />
                          <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Tanlash
                          </Button>
                          {avatarFile && (
                            <Button type="button" variant="ghost" onClick={() => setAvatarFromFile(null, null)}>
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
            <AlertDialogDescription>Bu amalni qaytarib bo'lmaydi. User o'chiriladi.</AlertDialogDescription>
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
