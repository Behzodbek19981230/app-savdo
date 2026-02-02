import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Mail, Phone, MapPin, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    orders: number;
    totalSpent: string;
    status: "active" | "inactive" | "vip";
    joinDate: string;
}

const customers: Customer[] = [
    {
        id: "1",
        name: "Alisher Navoi",
        email: "alisher.navoi@example.com",
        phone: "+998 90 123 45 67",
        address: "Toshkent shahri, Chilonzor tumani",
        orders: 45,
        totalSpent: "$12,450",
        status: "vip",
        joinDate: "2023-01-15",
    },
    {
        id: "2",
        name: "Bobur Mirzo",
        email: "bobur.mirzo@example.com",
        phone: "+998 91 234 56 78",
        address: "Samarqand shahri, Registon ko'chasi",
        orders: 32,
        totalSpent: "$8,900",
        status: "active",
        joinDate: "2023-03-20",
    },
    {
        id: "3",
        name: "Gulnora Karimova",
        email: "gulnora.k@example.com",
        phone: "+998 93 345 67 89",
        address: "Buxoro shahri, Labi Hovuz",
        orders: 28,
        totalSpent: "$6,750",
        status: "active",
        joinDate: "2023-05-10",
    },
    {
        id: "4",
        name: "Sarvar Rahimov",
        email: "sarvar.r@example.com",
        phone: "+998 94 456 78 90",
        address: "Andijon shahri, Navoiy ko'chasi",
        orders: 15,
        totalSpent: "$3,200",
        status: "active",
        joinDate: "2023-07-05",
    },
    {
        id: "5",
        name: "Dilnoza Ahmadova",
        email: "dilnoza.a@example.com",
        phone: "+998 95 567 89 01",
        address: "Namangan shahri, Mustaqillik ko'chasi",
        orders: 8,
        totalSpent: "$1,850",
        status: "inactive",
        joinDate: "2023-09-12",
    },
    {
        id: "6",
        name: "Farhod Toshmatov",
        email: "farhod.t@example.com",
        phone: "+998 97 678 90 12",
        address: "Qarshi shahri, Navruz ko'chasi",
        orders: 52,
        totalSpent: "$15,600",
        status: "vip",
        joinDate: "2022-11-30",
    },
    {
        id: "7",
        name: "Madina Yusupova",
        email: "madina.y@example.com",
        phone: "+998 99 789 01 23",
        address: "Farg'ona shahri, Alisher Navoiy ko'chasi",
        orders: 19,
        totalSpent: "$4,500",
        status: "active",
        joinDate: "2023-08-18",
    },
    {
        id: "8",
        name: "Javohir Ismoilov",
        email: "javohir.i@example.com",
        phone: "+998 90 890 12 34",
        address: "Nukus shahri, Berdah ko'chasi",
        orders: 6,
        totalSpent: "$1,200",
        status: "inactive",
        joinDate: "2023-10-25",
    },
    {
        id: "9",
        name: "Sevara Alimova",
        email: "sevara.a@example.com",
        phone: "+998 91 901 23 45",
        address: "Termiz shahri, Mustaqillik ko'chasi",
        orders: 38,
        totalSpent: "$9,800",
        status: "active",
        joinDate: "2023-04-14",
    },
    {
        id: "10",
        name: "Rustam Qodirov",
        email: "rustam.q@example.com",
        phone: "+998 93 012 34 56",
        address: "Jizzax shahri, Navoiy ko'chasi",
        orders: 24,
        totalSpent: "$5,600",
        status: "active",
        joinDate: "2023-06-22",
    },
];

const statusConfig = {
    active: { label: "Faol", className: "bg-success/10 text-success hover:bg-success/20" },
    inactive: { label: "Nofaol", className: "bg-muted text-muted-foreground hover:bg-muted/80" },
    vip: { label: "VIP", className: "bg-warning/10 text-warning hover:bg-warning/20" },
};

const ITEMS_PER_PAGE = 5;

type SortField = "name" | "email" | "orders" | "totalSpent" | "status" | "joinDate" | null;
type SortDirection = "asc" | "desc" | null;

const Customers = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const filteredCustomers = customers.filter(
        (customer) =>
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone.includes(searchQuery)
    );

    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
        if (!sortField || !sortDirection) return 0;

        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
            case "name":
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case "email":
                aValue = a.email.toLowerCase();
                bValue = b.email.toLowerCase();
                break;
            case "orders":
                aValue = a.orders;
                bValue = b.orders;
                break;
            case "totalSpent":
                // Remove $ and parse number
                aValue = parseFloat(a.totalSpent.replace(/[$,]/g, ""));
                bValue = parseFloat(b.totalSpent.replace(/[$,]/g, ""));
                break;
            case "status":
                aValue = a.status;
                bValue = b.status;
                break;
            case "joinDate":
                aValue = new Date(a.joinDate).getTime();
                bValue = new Date(b.joinDate).getTime();
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedCustomers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentCustomers = sortedCustomers.slice(startIndex, endIndex);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === "asc") {
                setSortDirection("desc");
            } else if (sortDirection === "desc") {
                setSortField(null);
                setSortDirection(null);
            } else {
                setSortDirection("asc");
            }
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
        setCurrentPage(1);
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />;
        }
        if (sortDirection === "asc") {
            return <ArrowUp className="h-4 w-4 ml-2 text-primary" />;
        }
        return <ArrowDown className="h-4 w-4 ml-2 text-primary" />;
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Scroll to top of page smoothly
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push("ellipsis");
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push("ellipsis");
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push("ellipsis");
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push("ellipsis");
                pages.push(totalPages);
            }
        }

        return (
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) handlePageChange(currentPage - 1);
                            }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>
                    {pages.map((page, index) => (
                        <PaginationItem key={index}>
                            {page === "ellipsis" ? (
                                <PaginationEllipsis />
                            ) : (
                                <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePageChange(page as number);
                                    }}
                                    isActive={currentPage === page}
                                >
                                    {page}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) handlePageChange(currentPage + 1);
                            }}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );
    };

    return (
        <div className="p-4 lg:p-6">
            <Card className="border-border/50 shadow-sm rounded-xl lg:rounded-2xl">
                <CardHeader className="flex flex-col gap-4 p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold">Mijozlar ro'yxati</CardTitle>
                        <div className="relative w-full sm:w-64 lg:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Ism, email yoki telefon..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10 w-full text-sm h-10 rounded-lg"
                            />
                        </div>
                    </div>
                    {/* Mobile Sort */}
                    <div className="md:hidden">
                        <Select
                            value={sortField || "none"}
                            onValueChange={(value) => {
                                if (value === "none") {
                                    setSortField(null);
                                    setSortDirection(null);
                                } else {
                                    handleSort(value as SortField);
                                }
                            }}
                        >
                            <SelectTrigger className="w-full h-10 rounded-lg text-sm">
                                <SelectValue placeholder="Saralash" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Saralash yo'q</SelectItem>
                                <SelectItem value="name">Ism bo'yicha</SelectItem>
                                <SelectItem value="email">Email bo'yicha</SelectItem>
                                <SelectItem value="orders">Buyurtmalar soni</SelectItem>
                                <SelectItem value="totalSpent">Jami xarajat</SelectItem>
                                <SelectItem value="status">Holat</SelectItem>
                                <SelectItem value="joinDate">Qo'shilgan sana</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort("name")}
                                            className="h-8 px-2 hover:bg-transparent -ml-2"
                                        >
                                            <span className="font-medium">Ism</span>
                                            {getSortIcon("name")}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort("email")}
                                            className="h-8 px-2 hover:bg-transparent -ml-2"
                                        >
                                            <span className="font-medium">Email</span>
                                            {getSortIcon("email")}
                                        </Button>
                                    </TableHead>
                                    <TableHead>Telefon</TableHead>
                                    <TableHead>Manzil</TableHead>
                                    <TableHead className="text-center">
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort("orders")}
                                            className="h-8 px-2 hover:bg-transparent -ml-2"
                                        >
                                            <span className="font-medium">Buyurtmalar</span>
                                            {getSortIcon("orders")}
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort("totalSpent")}
                                            className="h-8 px-2 hover:bg-transparent -ml-2 float-right"
                                        >
                                            <span className="font-medium">Jami xarajat</span>
                                            {getSortIcon("totalSpent")}
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-center">
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort("status")}
                                            className="h-8 px-2 hover:bg-transparent -ml-2"
                                        >
                                            <span className="font-medium">Holat</span>
                                            {getSortIcon("status")}
                                        </Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentCustomers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Mijozlar topilmadi
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentCustomers.map((customer) => (
                                        <TableRow key={customer.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20 flex-shrink-0">
                                                        <span className="text-xs font-bold text-primary">
                                                            {customer.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <span className="font-medium">{customer.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="text-sm">{customer.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="text-sm">{customer.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 max-w-[200px]">
                                                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="text-sm truncate">{customer.address}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">{customer.orders}</TableCell>
                                            <TableCell className="text-right font-bold">{customer.totalSpent}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={cn("text-xs font-bold", statusConfig[customer.status].className)}>
                                                    {statusConfig[customer.status].label}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile List View */}
                    <div className="md:hidden space-y-3 p-4">
                        {currentCustomers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">Mijozlar topilmadi</div>
                        ) : (
                            currentCustomers.map((customer) => (
                                <Card key={customer.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20 flex-shrink-0 mt-0.5">
                                                    <span className="text-sm font-bold text-primary">
                                                        {customer.name.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-base text-foreground truncate">{customer.name}</h3>
                                                    <Badge className={cn("mt-1.5 text-xs", statusConfig[customer.status].className)}>
                                                        {statusConfig[customer.status].label}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xs text-muted-foreground">Jami</p>
                                                <p className="font-bold text-base text-foreground mt-0.5">{customer.totalSpent}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5 text-sm mt-4">
                                            <div className="flex items-center gap-2.5 text-muted-foreground">
                                                <Mail className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate text-xs">{customer.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-muted-foreground">
                                                <Phone className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-xs">{customer.phone}</span>
                                            </div>
                                            <div className="flex items-start gap-2.5 text-muted-foreground">
                                                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                                <span className="line-clamp-2 text-xs">{customer.address}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">Buyurtmalar:</span>
                                            <span className="font-semibold text-sm text-foreground">{customer.orders} ta</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {sortedCustomers.length > 0 && (
                        <div className="p-4 lg:p-5 border-t border-border/50">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-xs lg:text-sm text-muted-foreground order-2 sm:order-1">
                                    {startIndex + 1}-{Math.min(endIndex, sortedCustomers.length)} dan {sortedCustomers.length} ta ko'rsatilmoqda
                                </p>
                                <div className="order-1 sm:order-2">
                                    {renderPagination()}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Customers;
