import { Search, Bell, Calendar, Menu, Pencil, DollarSign, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useExchangeRates, useCreateExchangeRate, useUpdateExchangeRate } from '@/hooks/api/useExchangeRate';
import type { ExchangeRate } from '@/types/exchangeRate';

interface HeaderProps {
	onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
	const [today, setToday] = useState(new Date());
	const [isExchangeDialogOpen, setIsExchangeDialogOpen] = useState(false);
	const [dollarValue, setDollarValue] = useState('');

	const { user } = useAuthContext();
	// Foydalanuvchining birinchi filiali bo'yicha kurs olish
	const userFilialId = user?.companies?.[0];

	const { data: exchangeRatesData, isLoading: isExchangeLoading } = useExchangeRates();

	const createExchangeRate = useCreateExchangeRate();
	const updateExchangeRate = useUpdateExchangeRate();
	const isMutating = createExchangeRate.isPending || updateExchangeRate.isPending;

	// Filialga tegishli exchange rate (yoki birinchi mavjud kurs)
	const currentExchangeRate: ExchangeRate | null =
		(userFilialId
			? exchangeRatesData?.results?.find((r) => r.filial === userFilialId)
			: exchangeRatesData?.results?.[0]) || null;

	useEffect(() => {
		const interval = setInterval(() => {
			setToday(new Date());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const openExchangeDialog = () => {
		setDollarValue(currentExchangeRate?.dollar?.toString() || '');
		setIsExchangeDialogOpen(true);
	};

	const handleSaveExchangeRate = async () => {
		if (!userFilialId) return;
		const dollar = parseFloat(dollarValue);
		if (isNaN(dollar) || dollar <= 0) return;

		try {
			if (currentExchangeRate) {
				await updateExchangeRate.mutateAsync({
					id: currentExchangeRate.id,
					data: { dollar },
				});
			} else {
				await createExchangeRate.mutateAsync({
					filial: userFilialId,
					dollar,
				});
			}
			setIsExchangeDialogOpen(false);
		} catch {
			// handled in hook toast
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('uz-UZ').format(value);
	};

	return (
		<>
			<header className='flex-shrink-0 flex items-center justify-between bg-background border-b border-border px-4 lg:px-6 py-3 lg:py-4 lg:pb-3'>
				<div className='flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1'>
					{/* Mobile Menu Button */}
					<Button
						variant='ghost'
						size='icon'
						onClick={onMenuClick}
						className='lg:hidden flex-shrink-0 h-10 w-10'
					>
						<Menu className='h-5 w-5' />
					</Button>

					<div className='flex flex-col gap-1 min-w-0'>
						<h2 className='text-base sm:text-lg font-semibold tracking-[0.2px] text-foreground truncate'>
							Xush kelibsiz! 👋
						</h2>
						<div className='flex items-center gap-3'>
							<p className='text-xs text-muted-foreground hidden sm:flex items-center gap-2 truncate'>
								<Calendar className='h-3.5 w-3.5 flex-shrink-0' />
								<span className='truncate'>{moment(today).format('DD.MM.YYYY HH:mm:ss')}</span>
							</p>

							{/* Dollar kursi */}
							<div className='hidden sm:flex items-center gap-1.5 text-xs'>
								<DollarSign className='h-3.5 w-3.5 text-green-600' />
								<span className='font-medium text-foreground'>
									{isExchangeLoading ? (
										<Loader2 className='h-3 w-3 animate-spin' />
									) : currentExchangeRate ? (
										`${formatCurrency(currentExchangeRate.dollar)} so'm`
									) : (
										"Kurs yo'q"
									)}
								</span>
								<Button
									variant='ghost'
									size='icon'
									className='h-5 w-5 p-0 hover:bg-muted'
									onClick={openExchangeDialog}
								>
									<Pencil className='h-3 w-3 text-muted-foreground' />
								</Button>
							</div>
						</div>
					</div>
				</div>

				<div className='flex items-center gap-2 lg:gap-2.5 flex-shrink-0'>
					{/* Mobile dollar kursi button */}
					<Button
						variant='outline'
						size='icon'
						className='sm:hidden h-10 w-10 rounded-xl shadow-sm'
						onClick={openExchangeDialog}
					>
						<DollarSign className='h-4 w-4' />
					</Button>

					<div className='relative hidden md:block'>
						<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						<Input
							placeholder='Qidirish...'
							className='w-[200px] lg:w-[280px] xl:w-[340px] pl-10 py-2.5 text-sm rounded-xl border-border bg-card shadow-sm'
						/>
					</div>

					{/* Mobile Search Button */}
					<Button variant='outline' size='icon' className='md:hidden h-10 w-10 rounded-xl shadow-sm'>
						<Search className='h-4 w-4' />
					</Button>

					<Button variant='outline' size='icon' className='relative h-10 w-10 rounded-xl shadow-sm'>
						<Bell className='h-[18px] w-[18px]' />
						<span className='absolute right-1.5 top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-destructive text-[10px] font-extrabold text-destructive-foreground border-2 border-background'>
							3
						</span>
					</Button>

					<ThemeToggle />
				</div>
			</header>

			{/* Dollar kursi dialog */}
			<Dialog open={isExchangeDialogOpen} onOpenChange={setIsExchangeDialogOpen}>
				<DialogContent className='sm:max-w-[400px]'>
					<DialogHeader>
						<DialogTitle>Dollar kursi</DialogTitle>
						<DialogDescription>Bugungi dollar kursini kiriting</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='dollar'>1 USD = ? UZS</Label>
							<Input
								id='dollar'
								type='number'
								placeholder='Masalan: 12500'
								value={dollarValue}
								onChange={(e) => setDollarValue(e.target.value)}
								min={0}
								step={0.01}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={() => setIsExchangeDialogOpen(false)}>
							Bekor qilish
						</Button>
						<Button onClick={handleSaveExchangeRate} disabled={isMutating || !dollarValue}>
							{isMutating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							Saqlash
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
