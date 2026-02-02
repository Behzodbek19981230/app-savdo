import { cn } from "@/lib/utils";

interface Order {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: "completed" | "pending" | "cancelled";
}

const orders: Order[] = [
  { id: "#12345", customer: "Alisher Navoi", product: "iPhone 15 Pro", amount: "$1,299", status: "completed" },
  { id: "#12346", customer: "Bobur Mirzo", product: "MacBook Air", amount: "$1,099", status: "pending" },
  { id: "#12347", customer: "Gulnora Karimova", product: "AirPods Pro", amount: "$249", status: "completed" },
  { id: "#12348", customer: "Sarvar Rahimov", product: "iPad Pro", amount: "$999", status: "cancelled" },
  { id: "#12349", customer: "Dilnoza Ahmadova", product: "Apple Watch", amount: "$399", status: "pending" },
];

const statusConfig = {
  completed: { label: "Bajarildi", className: "bg-success/[0.12] border-success/[0.22] text-success" },
  pending: { label: "Kutilmoqda", className: "bg-warning/[0.12] border-warning/[0.25] text-warning" },
  cancelled: { label: "Bekor qilindi", className: "bg-destructive/[0.10] border-destructive/[0.22] text-destructive" },
};

export function RecentOrders() {
  return (
    <div className="rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base lg:text-lg font-bold text-foreground">So'nggi buyurtmalar</h3>
        <a href="#" className="text-xs lg:text-sm font-medium text-primary hover:underline whitespace-nowrap">
          Barchasini ko'rish
        </a>
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between gap-3 lg:gap-4 rounded-lg lg:rounded-xl border border-border/50 p-3 lg:p-3.5 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2.5 lg:gap-3 min-w-0 flex-1">
              <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-primary/[0.18] border border-primary/[0.22] flex-shrink-0">
                <span className="text-xs lg:text-sm font-black text-primary">
                  {order.customer.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm font-semibold text-foreground truncate">{order.customer}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{order.product}</p>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row items-end lg:items-center gap-2 lg:gap-3 flex-shrink-0">
              <span className="text-xs lg:text-sm font-bold text-foreground whitespace-nowrap">{order.amount}</span>
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-[10px] lg:text-xs font-bold border whitespace-nowrap",
                statusConfig[order.status].className
              )}>
                {statusConfig[order.status].label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
