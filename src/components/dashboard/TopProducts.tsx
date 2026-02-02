import { Progress } from "@/components/ui/progress";

interface Product {
  name: string;
  sales: number;
  percentage: number;
  revenue: string;
}

const products: Product[] = [
  { name: "iPhone 15 Pro Max", sales: 1234, percentage: 85, revenue: "$1.6M" },
  { name: "MacBook Pro 14\"", sales: 956, percentage: 72, revenue: "$1.9M" },
  { name: "AirPods Pro 2", sales: 842, percentage: 65, revenue: "$210K" },
  { name: "iPad Pro 12.9\"", sales: 654, percentage: 48, revenue: "$650K" },
  { name: "Apple Watch Ultra", sales: 521, percentage: 38, revenue: "$420K" },
];

export function TopProducts() {
  return (
    <div className="rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-5 shadow-sm">
      <h3 className="text-base lg:text-lg font-bold text-foreground mb-4">Eng ko'p sotilgan mahsulotlar</h3>
      <div className="space-y-4 lg:space-y-5">
        {products.map((product, index) => (
          <div key={product.name} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="flex h-7 w-7 lg:h-8 lg:w-8 items-center justify-center rounded-full bg-primary/10 text-xs lg:text-sm font-bold text-primary flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-xs lg:text-sm font-medium text-foreground truncate">{product.name}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs lg:text-sm font-bold text-foreground whitespace-nowrap">{product.revenue}</p>
                <p className="text-[10px] lg:text-xs text-muted-foreground whitespace-nowrap">{product.sales} ta</p>
              </div>
            </div>
            <Progress value={product.percentage} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
