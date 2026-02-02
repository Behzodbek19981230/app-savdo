import { Search, Bell, Calendar, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import moment from 'moment';
import { useEffect, useState } from 'react';

interface HeaderProps {
	onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
	const [today, setToday] = useState(new Date());
	useEffect(() => {
		const interval = setInterval(() => {
			setToday(new Date());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<header className='flex-shrink-0 flex items-center justify-between bg-background border-b border-border px-4 lg:px-6 py-3 lg:py-4 lg:pb-3'>
			<div className='flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1'>
				{/* Mobile Menu Button */}
				<Button variant='ghost' size='icon' onClick={onMenuClick} className='lg:hidden flex-shrink-0 h-10 w-10'>
					<Menu className='h-5 w-5' />
				</Button>

				<div className='flex flex-col gap-1 min-w-0'>
					<h2 className='text-base sm:text-lg font-semibold tracking-[0.2px] text-foreground truncate'>
						Xush kelibsiz! 👋
					</h2>
					<p className='text-xs text-muted-foreground hidden sm:flex items-center gap-2 truncate'>
						<Calendar className='h-3.5 w-3.5 flex-shrink-0' />
						<span className='truncate'>{moment(today).format('DD.MM.YYYY HH:mm:ss')}</span>
					</p>
				</div>
			</div>

			<div className='flex items-center gap-2 lg:gap-2.5 flex-shrink-0'>
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
	);
}
