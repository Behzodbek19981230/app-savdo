import {
	LayoutDashboard,
	Users,
	ShoppingCart,
	BarChart3,
	Settings,
	Shield,
	HelpCircle,
	ChevronDown,
	Wallet,
	TrendingUp,
	Package,
	ArrowUpCircle,
	ArrowDownCircle,
	Building2,
	DollarSign,
	Star,
	FileText,
	LogOut,
	LocateIcon,
	Layers,
	Ruler,
	Tag,
	Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Link, useLocation } from 'react-router-dom';
import { useLogout } from '@/hooks/api/useAuth';
import { authService } from '@/services';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
	icon: React.ElementType;
	label: string;
	path: string;
	badge?: string;
}

interface NavSection {
	title: string;
	items: NavItem[];
}

const navSections: NavSection[] = [
	{
		title: 'ASOSIY',
		items: [
			// { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
			{ icon: Package, label: 'Mahsulotlar', path: '/products' },
			// { icon: ShoppingCart, label: "Buyurtmalar", path: "/orders", badge: "4" },
			// { icon: TrendingUp, label: "Sotuvlar", path: "/sales" },
			// { icon: Users, label: "Mijozlar", path: "/customers" },
		],
	},
	//   {
	//     title: "OMBOR",
	//     items: [
	//       { icon: Package, label: "Mahsulotlar", path: "/products" },
	//       { icon: BarChart3, label: "Sklad (Qoldiq)", path: "/inventory" },
	//       { icon: ArrowUpCircle, label: "Kirim (Qabul)", path: "/kirim" },
	//       { icon: ArrowDownCircle, label: "Chiqim (Ombordan)", path: "/chiqim" },
	//       { icon: Building2, label: "Ta'minotchilar", path: "/suppliers" },
	//     ]
	//   },
	//   {
	//     title: "MOLIYA",
	//     items: [
	//       { icon: DollarSign, label: "To'lovlar", path: "/payments" },
	//       { icon: Star, label: "Xarajatlar", path: "/expenses" },
	//       { icon: BarChart3, label: "Foyda / Zarar", path: "/profit" },
	//       { icon: FileText, label: "Hisobotlar", path: "/reports" },
	//     ]
	//   },
	{
		title: 'KATALOG',
		items: [
			{ icon: LocateIcon, label: 'Hududlar', path: '/locations' },
			{ icon: Layers, label: 'Mahsulot turlari', path: '/product-categories' },
			{ icon: Box, label: 'Mahsulot modellari', path: '/product-models' },
			// { icon: Ruler, label: "Model o'lchamlari", path: '/model-sizes' },
			{ icon: Tag, label: 'Model turlari', path: '/model-types' },
		],
	},
	{
		title: 'ADMIN',
		items: [
			{ icon: Shield, label: 'Rollar', path: '/role' },
			{ icon: Users, label: 'Foydalanuvchilar', path: '/user' },
			{ icon: Building2, label: 'Company', path: '/company' },
		],
	},
];

const bottomNavItems: NavItem[] = [];

interface SidebarProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

function SidebarContent() {
	const location = useLocation();
	const { mutate: logout } = useLogout();
	const user = authService.getStoredUser();

	return (
		<div className='flex h-full flex-col overflow-hidden'>
			{/* Logo */}
			<div className='flex items-center gap-2.5 px-4 py-4 flex-shrink-0 border-b border-sidebar-border'>
				<Link to='/' className='flex items-center gap-3 w-full'>
					<div className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25 flex-shrink-0'>
						<ShoppingCart className='h-5 w-5 text-primary-foreground' />
					</div>
					<div className='min-w-0 flex-1'>
						<h1 className='text-base font-bold text-sidebar-foreground truncate'>Smart Savdo</h1>
						<p className='text-xs text-muted-foreground truncate'>Savdo tizimi</p>
					</div>
				</Link>
			</div>

			{/* Scrollable Navigation */}
			<div className='flex-1 overflow-y-auto overscroll-contain px-3.5 py-2'>
				{navSections.map((section, sectionIndex) => (
					<div key={section.title} className={cn(sectionIndex > 0 && 'mt-3')}>
						<p className='mb-2 px-2.5 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase'>
							{section.title}
						</p>
						<nav className='space-y-1.5'>
							{section.items.map((item) => {
								const isActive = location.pathname === item.path;
								return (
									<Link
										key={item.label}
										to={item.path}
										className={cn(
											'relative flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-all duration-150',
											isActive
												? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
												: 'text-sidebar-foreground hover:bg-primary/[0.08] hover:border-primary/[0.12] border border-transparent',
										)}
									>
										{isActive && (
											<span className='absolute -left-1.5 top-2.5 bottom-2.5 w-1 rounded-full bg-white/90 opacity-65' />
										)}
										<div className='flex items-center gap-2.5 min-w-0'>
											<item.icon
												className={cn(
													'h-[18px] w-[18px] flex-shrink-0 opacity-90',
													isActive && 'opacity-100',
												)}
											/>
											<span className='truncate'>{item.label}</span>
										</div>
										{item.badge && (
											<span
												className={cn(
													'min-w-[22px] h-[18px] px-1.5 rounded-full text-[11px] font-extrabold inline-flex items-center justify-center border',
													isActive
														? 'bg-white/[0.18] text-white border-white/25'
														: 'bg-destructive/[0.14] text-destructive border-destructive/25',
												)}
											>
												{item.badge}
											</span>
										)}
									</Link>
								);
							})}
						</nav>
					</div>
				))}

				{/* Divider */}
				<div className='border-t border-sidebar-border my-3 mx-1.5' />

				{/* Bottom Navigation */}
				<nav className='space-y-1.5'>
					{bottomNavItems.map((item) => {
						const isActive = location.pathname === item.path;
						return (
							<Link
								key={item.label}
								to={item.path}
								className={cn(
									'relative flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-all duration-150',
									isActive
										? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
										: 'text-sidebar-foreground hover:bg-primary/[0.08] hover:border-primary/[0.12] border border-transparent',
								)}
							>
								<item.icon className='h-[18px] w-[18px] flex-shrink-0 opacity-90' />
								<span className='truncate'>{item.label}</span>
							</Link>
						);
					})}
				</nav>
			</div>

			{/* User Profile */}
			<div className='border-t border-sidebar-border p-2.5 flex-shrink-0'>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button className='w-full flex items-center justify-between gap-2.5 px-2.5 py-2.5 rounded-xl bg-foreground/[0.04] dark:bg-white/[0.03] border border-sidebar-border hover:bg-foreground/[0.06] transition-colors'>
							<div className='flex items-center gap-2.5 min-w-0'>
								{user?.avatar ? (
									<img
										src={`${import.meta.env.VITE_FILE_BASE_URL}/` + user.avatar}
										alt={user.fullname}
										className='h-[34px] w-[34px] rounded-full object-cover border-2 border-primary/[0.22] flex-shrink-0'
									/>
								) : (
									<div className='flex h-[34px] w-[34px] items-center justify-center rounded-full bg-primary/[0.18] border border-primary/[0.22] flex-shrink-0'>
										<span className='text-[13px] font-black text-primary'>
											{user?.fullname?.charAt(0) || user?.username?.charAt(0) || 'U'}
										</span>
									</div>
								)}
								<div className='min-w-0'>
									<p className='text-[13px] font-semibold text-sidebar-foreground truncate'>
										{user?.fullname || user?.username || 'Foydalanuvchi'}
									</p>
									<p className='text-xs text-muted-foreground truncate'>
										{user?.role_detail?.[0]?.name || user?.email || 'Manager'}
									</p>
								</div>
							</div>
							<ChevronDown className='h-4 w-4 text-muted-foreground flex-shrink-0' />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end' className='w-56'>
						<DropdownMenuLabel>Mening hisobim</DropdownMenuLabel>
						<DropdownMenuSeparator />

						<DropdownMenuItem className='text-destructive focus:text-destructive' onClick={() => logout()}>
							<LogOut className='mr-2 h-4 w-4' />
							<span>Chiqish</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
	return (
		<>
			{/* Desktop Sidebar - 280px width */}
			<aside className='fixed left-0 top-0 z-40 hidden h-screen w-[280px] border-r border-sidebar-border bg-sidebar lg:block'>
				<SidebarContent />
			</aside>

			{/* Mobile Sidebar */}
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent side='left' className='w-[280px] p-0 bg-sidebar border-sidebar-border overflow-hidden'>
					<SidebarContent />
				</SheetContent>
			</Sheet>
		</>
	);
}
