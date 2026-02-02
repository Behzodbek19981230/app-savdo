import { useState, ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

interface DashboardLayoutProps {
    children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

            <div className="lg:ml-[280px] min-h-screen flex flex-col">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
