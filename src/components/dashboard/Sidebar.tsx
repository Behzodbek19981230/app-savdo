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
    FolderTree,
    Ruler,
    Tag,
    Box,
    Warehouse,
    Receipt,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Link, useLocation } from 'react-router-dom';
import { useLogout } from '@/hooks/api/useAuth';
import { authService } from '@/services';

interface NavItem {
    icon: React.ElementType;
    label: string;
    path?: string;
    badge?: string;
    children?: NavItem[];
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const adminSection: NavSection[] = [
    {
        title: 'ASOSIY',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
            { icon: Package, label: 'Mahsulotlar', path: '/products' },
            { icon: ShoppingCart, label: 'Buyurtmalar', path: '/order-history' },
            // { icon: ShoppingCart, label: 'Buyurtmalar', path: '/orders', badge: '4' },
            // { icon: TrendingUp, label: 'Sotuvlar', path: '/sales' },
            // { icon: Users, label: 'Mijozlar', path: '/customers' },
        ],
    },
    {
        title: 'OMBOR',
        items: [
            { icon: Warehouse, label: 'Omborlar', path: '/sklad' },
            // { icon: BarChart3, label: 'Sklad (Qoldiq)', path: '/inventory' },
            { icon: ArrowUpCircle, label: 'Kirim (Qabul)', path: '/purchase-invoices' },
            // { icon: ArrowDownCircle, label: 'Chiqim (Ombordan)', path: '/chiqim' },
            { icon: Building2, label: "Ta'minotchilar", path: '/suppliers' },
        ],
    },
    {
        title: 'KORZINKA',
        items: [
            { icon: ShoppingCart, label: 'Buyurtmalar', path: '/karzinka' }

        ],
    },
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
            { icon: Layers, label: 'Mahsulot turlari', path: '/product-categories' },
            { icon: FolderTree, label: 'Mahsulot turlari kategoriyasi', path: '/product-branch-categories' },
            { icon: Box, label: 'Mahsulot modellari', path: '/product-models' },
            { icon: Tag, label: "Model turlari va o'lchamlari", path: '/model-types' },
            { icon: Ruler, label: "O'lchov birliklari", path: '/units' },
            { icon: Receipt, label: 'Xarajat kategoriyalari', path: '/expense-categories' },
        ],
    },
];
const managerSection: NavSection[] = [
    {
        title: 'KOMPLEKT',
        items: [{ icon: Package, label: 'Mahsulotlar', path: '/products' }],
    },
    {
        title: 'OMBOR',
        items: [
            { icon: Warehouse, label: 'Omborlar', path: '/sklad' },
            { icon: ArrowUpCircle, label: 'Kirim (Qabul)', path: '/purchase-invoices' },
            { icon: Building2, label: "Ta'minotchilar", path: '/suppliers' },
        ],
    },

    {
        title: 'KATALOG',
        items: [
            { icon: Layers, label: 'Mahsulot turlari', path: '/product-categories' },
            { icon: FolderTree, label: 'Mahsulot turlari kategoriyasi', path: '/product-branch-categories' },
            { icon: Box, label: 'Mahsulot modellari', path: '/product-models' },
            { icon: Tag, label: "Model turlari va o'lchamlari", path: '/model-types' },
            { icon: Ruler, label: "O'lchov birliklari", path: '/units' },
            { icon: Receipt, label: 'Xarajat kategoriyalari', path: '/expense-categories' },
        ],
    },
];

const superAdminSection: NavSection = {
    title: 'ADMIN',
    items: [
        { icon: LocateIcon, label: 'Hududlar', path: '/locations' },
        { icon: DollarSign, label: 'Dollar kurslari', path: '/exchange-rates' },
        // { icon: Shield, label: 'Rollar', path: '/role' },
        { icon: Users, label: 'Foydalanuvchilar', path: '/user' },
        { icon: Building2, label: 'Filialar', path: '/company' },
    ],
};

const bottomNavItems: NavItem[] = [];

interface SidebarProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

function SidebarContent() {
    const location = useLocation();
    const { mutate: logout } = useLogout();
    const user = authService.getStoredUser();

    // Superadmin rolini tekshirish
    const isSuperadmin = user?.role_detail?.some((role) => role.key === 'super_admin') || false;
    const isAdmin = user?.role_detail?.some((role) => role.key === 'admin') || false;
    const isManager = user?.role_detail?.some((role) => role.key === 'manager') || false;

    // Navigatsiya bo'limlarini foydalanuvchi roliga qarab filtrlash
    const filteredNavSections: NavSection[] = isSuperadmin
        ? [...adminSection, superAdminSection]
        : isAdmin
            ? [...adminSection]
            : isManager
                ? [...managerSection]
                : [];

    // Accordion state per section and optional submenu open state
    // default: all sections closed
    const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        filteredNavSections.forEach((s) => (init[s.title] = false));
        return init;
    });

    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

    const toggleSection = (title: string) => setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));

    const toggleItem = (sectionTitle: string, itemLabel: string) => {
        const key = `${sectionTitle}::${itemLabel}`;
        setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Open the section (and item submenu) that matches current route.
    // Runs when pathname or filtered sections change.
    useEffect(() => {
        const path = location.pathname;
        let sectionToOpen: string | null = null;
        let itemToOpenKey: string | null = null;

        for (const section of filteredNavSections) {
            for (const item of section.items) {
                // check direct match or prefix (for nested paths)
                if (item.path && (path === item.path || path.startsWith(item.path + '/'))) {
                    sectionToOpen = section.title;
                    break;
                }
                if (item.children) {
                    for (const child of item.children) {
                        if (child.path && (path === child.path || path.startsWith(child.path + '/'))) {
                            sectionToOpen = section.title;
                            itemToOpenKey = `${section.title}::${item.label}`;
                            break;
                        }
                    }
                }
                if (sectionToOpen) break;
            }
            if (sectionToOpen) break;
        }

        if (sectionToOpen) {
            setOpenSections((prev) => ({ ...prev, [sectionToOpen as string]: true }));
        }
        if (itemToOpenKey) {
            setOpenItems((prev) => ({ ...prev, [itemToOpenKey as string]: true }));
        }

    }, [location.pathname, filteredNavSections]);

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
                {filteredNavSections.map((section, sectionIndex) => (
                    <div key={section.title} className={cn(sectionIndex > 0 && 'mt-3')}>
                        <button
                            onClick={() => toggleSection(section.title)}
                            className='w-full flex items-center justify-between mb-2 px-2.5'
                            aria-expanded={!!openSections[section.title]}
                        >
                            <p className='text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase'>
                                {section.title}
                            </p>
                            <ChevronDown
                                className={cn(
                                    'h-4 w-4 text-muted-foreground transition-transform',
                                    openSections[section.title] && 'rotate-180',
                                )}
                            />
                        </button>

                        <div className={cn(openSections[section.title] ? 'block' : 'hidden')}>
                            <nav className='space-y-1.5'>
                                {section.items.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    const hasChildren = !!item.children && item.children.length > 0;
                                    const itemKey = `${section.title}::${item.label}`;

                                    if (hasChildren) {
                                        return (
                                            <div key={item.label}>
                                                <button
                                                    onClick={() => toggleItem(section.title, item.label)}
                                                    className={cn(
                                                        'w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-all duration-150',
                                                        isActive
                                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                                            : 'text-sidebar-foreground hover:bg-primary/[0.08] hover:border-primary/[0.12] border border-transparent',
                                                    )}
                                                >
                                                    <div className='flex items-center gap-2.5 min-w-0'>
                                                        <item.icon className='h-[18px] w-[18px] flex-shrink-0 opacity-90' />
                                                        <span className='truncate'>{item.label}</span>
                                                    </div>
                                                    <ChevronDown
                                                        className={cn(
                                                            'h-4 w-4 transition-transform',
                                                            openItems[itemKey] && 'rotate-180',
                                                        )}
                                                    />
                                                </button>

                                                <div
                                                    className={cn(
                                                        openItems[itemKey] ? 'block' : 'hidden',
                                                        'pl-6 mt-1 space-y-1',
                                                    )}
                                                >
                                                    {item.children!.map((child) => (
                                                        <Link
                                                            key={child.label}
                                                            to={child.path ?? '#'}
                                                            className={cn(
                                                                'flex items-center gap-2.5 rounded-md px-2 py-1 text-sm transition-colors',
                                                                location.pathname === child.path
                                                                    ? 'text-primary font-semibold'
                                                                    : 'text-sidebar-foreground hover:text-primary',
                                                            )}
                                                        >
                                                            <child.icon className='h-4 w-4 opacity-80' />
                                                            <span className='truncate'>{child.label}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.label}
                                            to={item.path ?? '#'}
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

            {/* Logout only */}
            <div className='border-t border-sidebar-border p-2.5 flex-shrink-0'>
                <button
                    className='w-full flex items-center justify-center gap-2.5 px-2.5 py-2.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive font-bold hover:bg-destructive/20 transition-colors'
                    onClick={() => logout()}
                >
                    <LogOut className='h-5 w-5' />
                    Chiqish
                </button>
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
