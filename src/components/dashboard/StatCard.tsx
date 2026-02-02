import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  iconColor: "primary" | "success" | "warning" | "info";
}

const accentColors = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
};

const iconBgClasses = {
  primary: "border-border bg-white/[0.02]",
  success: "border-border bg-white/[0.02]",
  warning: "border-border bg-white/[0.02]",
  info: "border-border bg-white/[0.02]",
};

export function StatCard({ title, value, change, icon: Icon, iconColor }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="relative overflow-hidden rounded-xl lg:rounded-[18px] border border-border bg-card p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow duration-200 min-h-[120px] lg:min-h-[130px]">
      {/* Left accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 lg:w-1.5 opacity-90", accentColors[iconColor])} />
      
      {/* Top row: icon + title */}
      <div className="flex items-start justify-between gap-3 pl-0.5">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={cn(
            "flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-xl lg:rounded-[14px] border flex-shrink-0",
            iconBgClasses[iconColor]
          )}>
            <Icon className="h-5 w-5 lg:h-[18px] lg:w-[18px] text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0 mt-0.5">
            <p className="text-xs lg:text-sm text-muted-foreground truncate font-medium">{title}</p>
            {/* Value */}
            <p className="mt-1.5 text-2xl lg:text-3xl font-black tracking-tight text-foreground truncate">
              {value}
            </p>
          </div>
        </div>
      </div>

      {/* Footer: trend chip */}
      <div className="mt-3 lg:mt-4 flex items-center gap-2 flex-wrap">
        <span className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border",
          isPositive 
            ? "bg-success/[0.12] border-success/[0.22] text-success" 
            : "bg-destructive/[0.10] border-destructive/[0.22] text-destructive"
        )}>
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {isPositive ? "+" : ""}{change}%
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline">o'tgan oyga nisbatan</span>
      </div>
    </div>
  );
}
