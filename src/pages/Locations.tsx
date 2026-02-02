/**
 * Locations Page
 * Hududlar sahifasi - Mamlakatlar, Viloyatlar, Tumanlar
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, MapPin, Globe, Map, Building2, Loader2 } from 'lucide-react';
import {
	useCountries,
	useRegions,
	useDistricts,
	useCreateCountry,
	useUpdateCountry,
	useDeleteCountry,
	useCreateRegion,
	useUpdateRegion,
	useDeleteRegion,
	useCreateDistrict,
	useUpdateDistrict,
	useDeleteDistrict,
} from '@/hooks/api/useLocations';
import type { Country, Region, District } from '@/services/location.service';

type LocationType = 'region' | 'district';

interface FormData {
	id?: string;
	code: string;
	name: string;
	geo_json?: string;
	region?: string;
}

export default function Locations() {
	const [activeTab, setActiveTab] = useState<LocationType>('region');
	const [searchTerm, setSearchTerm] = useState('');
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<FormData | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const { data: regionsData, isLoading: regionsLoading } = useRegions({
		search: activeTab === 'region' ? searchTerm : undefined,
	});
	const { data: districtsData, isLoading: districtsLoading } = useDistricts({
		search: activeTab === 'district' ? searchTerm : undefined,
	});

	// Viloyatlar ro'yxati (tuman uchun select)
	const { data: allRegionsData } = useRegions({
		page_size: 1000, // Barcha viloyatlarni olish
	});

	// Mutations
	const createCountry = useCreateCountry();
	const updateCountry = useUpdateCountry();
	const deleteCountry = useDeleteCountry();
	const createRegion = useCreateRegion();
	const updateRegion = useUpdateRegion();
	const deleteRegion = useDeleteRegion();
	const createDistrict = useCreateDistrict();
	const updateDistrict = useUpdateDistrict();
	const deleteDistrict = useDeleteDistrict();

	const regions = regionsData?.results || [];
	const districts = districtsData?.results || [];
	const allRegions = allRegionsData?.results || [];

	const isLoading = regionsLoading || districtsLoading;
	const isMutating =
		createRegion.isPending ||
		updateRegion.isPending ||
		deleteRegion.isPending ||
		createDistrict.isPending ||
		updateDistrict.isPending ||
		deleteDistrict.isPending;

	const handleOpenDialog = (item?: Region | District) => {
		if (item) {
			const regionValue =
				'region' in item ? (typeof item.region === 'string' ? item.region : item.region_detail?.id) : undefined;

			setEditingItem({
				id: item.id,
				code: item.code || '',
				name: item.name || '',
				geo_json: item.geo_json || '',
				region: regionValue,
			});
		} else {
			setEditingItem({
				code: '',
				name: '',
				geo_json: '',
			});
		}
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingItem(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingItem) return;

		// Tuman uchun viloyat majburiy
		if (activeTab === 'district' && !editingItem.region) {
			console.error('Viloyat tanlanmagan!');
			return;
		}

		const data = {
			code: editingItem.code,
			name: editingItem.name,
			geo_json: editingItem.geo_json,
			...(activeTab === 'district' && editingItem.region ? { region: editingItem.region } : {}),
		};

		console.log('Submitting data:', data);

		try {
			if (editingItem.id) {
				// Update
				if (activeTab === 'region') {
					await updateRegion.mutateAsync({ id: editingItem.id, data });
				} else {
					await updateDistrict.mutateAsync({ id: editingItem.id, data });
				}
			} else {
				// Create
				if (activeTab === 'region') {
					await createRegion.mutateAsync(data);
				} else {
					await createDistrict.mutateAsync(data);
				}
			}
			handleCloseDialog();
		} catch (error) {
			console.error('Error saving location:', error);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;

		try {
			if (activeTab === 'region') {
				await deleteRegion.mutateAsync(deletingId);
			} else {
				await deleteDistrict.mutateAsync(deletingId);
			}
			setIsDeleteDialogOpen(false);
			setDeletingId(null);
		} catch (error) {
			console.error('Error deleting location:', error);
		}
	};

	const openDeleteDialog = (id: string) => {
		setDeletingId(id);
		setIsDeleteDialogOpen(true);
	};

	const getTabConfig = () => {
		switch (activeTab) {
			case 'region':
				return {
					title: 'Viloyatlar',
					description: "Viloyatlar ro'yxati va boshqaruvi",
					icon: Map,
					data: regions,
					loading: regionsLoading,
				};

			case 'district':
				return {
					title: 'Tumanlar',
					description: "Tumanlar ro'yxati va boshqaruvi",
					icon: Building2,
					data: districts,
					loading: districtsLoading,
				};
		}
	};

	const config = getTabConfig();
	const Icon = config.icon;

	return (
		<div>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Hududlar</h1>
					<p className='text-muted-foreground'>Mamlakatlar, viloyatlar va tumanlarni boshqaring</p>
				</div>
			</div>

			{/* Main Content */}
			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LocationType)}>
				<TabsList className='grid w-full grid-cols-3'>
					<TabsTrigger value='region' className='flex items-center gap-2'>
						<Map className='h-4 w-4' />
						Viloyatlar
					</TabsTrigger>
					<TabsTrigger value='district' className='flex items-center gap-2'>
						<Building2 className='h-4 w-4' />
						Tumanlar
					</TabsTrigger>
				</TabsList>

				<TabsContent value={activeTab} className='space-y-4'>
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<Icon className='h-6 w-6 text-primary' />
									<div>
										<CardTitle>{config.title}</CardTitle>
										<CardDescription>{config.description}</CardDescription>
									</div>
								</div>
								<Button onClick={() => handleOpenDialog()}>
									<Plus className='mr-2 h-4 w-4' />
									Qo'shish
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{/* Search */}
							<div className='mb-4'>
								<div className='relative'>
									<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
									<Input
										placeholder='Qidirish...'
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className='pl-9'
									/>
								</div>
							</div>

							{/* Table */}
							{config.loading ? (
								<div className='flex items-center justify-center py-8'>
									<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
								</div>
							) : config.data.length === 0 ? (
								<div className='flex flex-col items-center justify-center py-8 text-center'>
									<MapPin className='h-12 w-12 text-muted-foreground/50 mb-3' />
									<p className='text-muted-foreground'>Ma'lumot topilmadi</p>
								</div>
							) : (
								<div className='rounded-md border'>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Kod</TableHead>
												<TableHead>Nomi</TableHead>
												{activeTab === 'district' && <TableHead>Viloyat</TableHead>}
												<TableHead>GeoJSON</TableHead>
												<TableHead className='text-right'>Amallar</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{config.data.map((item: Country | Region | District) => (
												<TableRow key={item.id}>
													<TableCell className='font-medium'>{item.code}</TableCell>
													<TableCell>{item.name}</TableCell>
													{activeTab === 'district' && (
														<TableCell>
															{(() => {
																const district = item as District;
																const region = district.region_detail;
																if (
																	region &&
																	typeof region === 'object' &&
																	'name' in region
																) {
																	return (
																		<Badge variant='outline'>{region.name}</Badge>
																	);
																}
																return <span className='text-muted-foreground'>-</span>;
															})()}
														</TableCell>
													)}
													<TableCell>
														{item.geo_json ? (
															<Badge variant='secondary'>Mavjud</Badge>
														) : (
															<span className='text-muted-foreground'>-</span>
														)}
													</TableCell>
													<TableCell className='text-right'>
														<div className='flex items-center justify-end gap-2'>
															<Button
																variant='ghost'
																size='icon'
																onClick={() => handleOpenDialog(item)}
															>
																<Edit className='h-4 w-4' />
															</Button>
															<Button
																variant='ghost'
																size='icon'
																onClick={() => openDeleteDialog(item.id)}
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
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Create/Edit Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className='sm:max-w-[525px]'>
					<form onSubmit={handleSubmit}>
						<DialogHeader>
							<DialogTitle>{editingItem?.id ? 'Tahrirlash' : "Qo'shish"}</DialogTitle>
							<DialogDescription>{config.title} ma'lumotlarini kiriting</DialogDescription>
						</DialogHeader>
						<div className='grid gap-4 py-4'>
							<div className='grid gap-2'>
								<Label htmlFor='code'>Kod *</Label>
								<Input
									id='code'
									value={editingItem?.code || ''}
									onChange={(e) => setEditingItem((prev) => ({ ...prev!, code: e.target.value }))}
									required
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='name'>Nomi *</Label>
								<Input
									id='name'
									value={editingItem?.name || ''}
									onChange={(e) => setEditingItem((prev) => ({ ...prev!, name: e.target.value }))}
									required
								/>
							</div>
							{activeTab === 'district' && (
								<div className='grid gap-2'>
									<Label htmlFor='region'>Viloyat *</Label>

									<Select
										value={editingItem?.region?.toString() || ''}
										onValueChange={(value) =>
											setEditingItem((prev) => ({ ...prev!, region: value }))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder='Viloyatni tanlang' />
										</SelectTrigger>
										<SelectContent position='popper' sideOffset={5}>
											{allRegions.length === 0 ? (
												<div className='py-2 px-2 text-sm text-muted-foreground'>
													Viloyatlar topilmadi
												</div>
											) : (
												allRegions.map((region) => (
													<SelectItem key={region.id} value={region.id.toString()}>
														{region.name}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
								</div>
							)}
							<div className='grid gap-2'>
								<Label htmlFor='geo_json'>GeoJSON</Label>
								<Textarea
									id='geo_json'
									value={editingItem?.geo_json || ''}
									onChange={(e) => setEditingItem((prev) => ({ ...prev!, geo_json: e.target.value }))}
									rows={4}
									placeholder='{"type": "Point", "coordinates": [...]}'
								/>
							</div>
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
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
						<AlertDialogDescription>
							Bu amalni qaytarib bo'lmaydi. Ma'lumot butunlay o'chiriladi.
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
		</div>
	);
}
