import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { DollarSign, Users, ShoppingCart, TrendingUp } from "lucide-react";

const Index = () => {
    return (
        <div>
            {/* Stats Grid */}
            <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Jami daromad"
                    value="$45,231"
                    change={12.5}
                    icon={DollarSign}
                    iconColor="primary"
                />
                <StatCard
                    title="Mijozlar soni"
                    value="2,350"
                    change={8.2}
                    icon={Users}
                    iconColor="success"
                />
                <StatCard
                    title="Buyurtmalar"
                    value="1,234"
                    change={-3.1}
                    icon={ShoppingCart}
                    iconColor="warning"
                />
                <StatCard
                    title="O'sish darajasi"
                    value="23.5%"
                    change={4.7}
                    icon={TrendingUp}
                    iconColor="info"
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-3 lg:gap-4 grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RevenueChart />
                </div>
                <TopProducts />
            </div>

            {/* Recent Orders */}
            <RecentOrders />
        </div>
    );
};

export default Index;
