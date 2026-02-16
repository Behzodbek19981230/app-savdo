import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrderHistoryProducts } from '@/hooks/api/useOrderHistoryProducts';
import { formatCurrency } from '@/lib/utils';

const OrderHistoryShow: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const { data, isLoading, error } = useOrderHistoryProducts(Number(id), true);

	// debug
	console.log('OrderHistoryShow data:', data);
	console.log('OrderHistoryShow error:', error);

	return (
		<div>
			<div className='mb-4 flex items-center justify-between'>
				<h1 className='text-2xl font-semibold'>Order History #{id}</h1>
				<Link to='/order-history' className='text-sm text-blue-600'>
					Back to list
				</Link>
			</div>

			<Card>
				<div className='p-4'>Found: {data?.results?.length ?? 0} product(s)</div>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>#</TableHead>
							<TableHead>Model</TableHead>
							<TableHead>Tur</TableHead>
							<TableHead>Hajmi</TableHead>
							<TableHead>Soni</TableHead>
							<TableHead>Narxi</TableHead>
							<TableHead>Jami</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading && (
							<TableRow>
								<TableCell colSpan={8}>Loading...</TableCell>
							</TableRow>
						)}

						{error && (
							<TableRow>
								<TableCell colSpan={8}>
									<div>
										<div className='text-red-600'>Error loading products</div>
										<pre className='text-xs text-muted-foreground mt-2'>
											{(error as any)?.message}
										</pre>
										{(error as any)?.response && (
											<pre className='text-xs text-muted-foreground mt-2'>
												{JSON.stringify((error as any).response.data, null, 2)}
											</pre>
										)}
									</div>
								</TableCell>
							</TableRow>
						)}

						{data?.results?.length === 0 && !isLoading && (
							<TableRow>
								<TableCell colSpan={8}>No products found for this order</TableCell>
							</TableRow>
						)}

						{data?.results?.map((p, idx) => (
							<TableRow key={p.id}>
								<TableCell>{idx + 1}</TableCell>
								<TableCell>{p.model_detail?.name ?? p.model}</TableCell>
								<TableCell>{p.type_detail?.name ?? p.type}</TableCell>
								<TableCell>{p.size_detail ?? p.size}</TableCell>
								<TableCell>{p.count ?? 0}</TableCell>
								<TableCell>{formatCurrency(Number(p.unit_price) || 0)}</TableCell>
								<TableCell>{formatCurrency((Number(p.unit_price) || 0) * (p.count || 0))}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
};

export default OrderHistoryShow;
