import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, Eye } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 50;

export default function ExpensesPage() {
	const { selectedFilialId } = useAuthContext();
	const [page, setPage] = useState(1);
	const [data, setData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(false);

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const params: Record<string, unknown> = { page, perPage: ITEMS_PER_PAGE };
			if (selectedFilialId) params.filial = selectedFilialId;
			const res = await api.get('/expense/group-by-date', { params });
			setData(res as any);
		} catch (err) {
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [page, selectedFilialId]);

	const groups = data?.results || [];
	const pagination = data?.pagination;
	const lastPage = pagination?.lastPage || 1;

	const formatCurrency = (value: string | number | undefined) => {
		if (!value) return '0.00';
		const num = typeof value === 'string' ? parseFloat(value) : value;
		return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
	};

	const navigate = useNavigate();

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<CardTitle>Xarajatlar</CardTitle>
						<div />
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='flex items-center justify-center py-10'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
						</div>
					) : groups.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-10 text-center'>
							<Package className='h-12 w-12 text-muted-foreground/50 mb-4' />
							<p className='text-muted-foreground'>Xarajatlar topilmadi</p>
						</div>
					) : (
						<div className='rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-[60px]'>t/r</TableHead>
										<TableHead>Sanasi</TableHead>
										<TableHead>Kategoriya</TableHead>
										<TableHead>Xodim</TableHead>
										<TableHead className='text-right'>Summa</TableHead>
										<TableHead>Izoh</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{groups.map((group: any) => {
										const total = parseFloat(group.totals?.summa_total_dollar || '0');
										return (
											<>
												<TableRow
													key={`summary-${group.date}`}
													className='bg-muted/50 font-semibold'
												>
													<TableCell>
														<div className='flex items-center gap-2'>
															Jami <Badge>{group.items.length}</Badge>
														</div>
													</TableCell>
													<TableCell className='font-semibold'>
														{moment(group.date).format('YYYY-MM-DD')}
													</TableCell>
													<TableCell />
													<TableCell />
													<TableCell className='text-right font-semibold'>
														{formatCurrency(total)}
													</TableCell>
													<TableCell />
												</TableRow>
												{group.items.map((it: any, idx: number) => (
													<TableRow key={it.id}>
														<TableCell className='font-medium'>
															{group.items.length - idx}
														</TableCell>
														<TableCell>{it.date}</TableCell>
														<TableCell>{it.category_detail?.name || '-'}</TableCell>
														<TableCell>{it.employee_detail?.full_name || '-'}</TableCell>
														<TableCell className='text-right text-blue-600 font-semibold'>
															{formatCurrency(it.summa_total_dollar)}
														</TableCell>
														<TableCell>{it.note || '-'}</TableCell>
													</TableRow>
												))}
											</>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}

					{/* Pagination */}
					{!isLoading && groups.length > 0 && lastPage > 1 && (
						<div className='mt-4 flex justify-center'>
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											onClick={() => setPage(Math.max(1, page - 1))}
											className={page === 1 ? 'pointer-events-none opacity-50' : ''}
										/>
									</PaginationItem>
									{[...Array(Math.min(5, lastPage))].map((_, i) => {
										let pageNum: number;
										if (lastPage <= 5) pageNum = i + 1;
										else if (page <= 3) pageNum = i + 1;
										else if (page >= lastPage - 2) pageNum = lastPage - 4 + i;
										else pageNum = page - 2 + i;
										return (
											<PaginationItem key={pageNum}>
												<PaginationLink
													onClick={() => setPage(pageNum)}
													isActive={pageNum === page}
												>
													{pageNum}
												</PaginationLink>
											</PaginationItem>
										);
									})}
									<PaginationItem>
										<PaginationNext
											onClick={() => setPage(Math.min(lastPage, page + 1))}
											className={page === lastPage ? 'pointer-events-none opacity-50' : ''}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
