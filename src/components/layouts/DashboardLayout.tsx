import { useState, ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { StickyNote } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { NotesPanel } from "@/components/dashboard/NotesPanel";

interface DashboardLayoutProps {
    children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);

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

            {/* Sticky eslatmalar tugmasi */}
            <button
                onClick={() => setNotesOpen(true)}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 rounded-l-xl border border-r-0 border-amber-300 bg-amber-500 px-2 py-3 text-white shadow-lg transition-all hover:px-3 hover:shadow-xl dark:border-amber-700 dark:bg-amber-600"
                title="Eslatmalar"
            >
                <StickyNote className="h-5 w-5" />
            </button>

            {/* O'ng tarafdan ochiladigan eslatmalar paneli */}
            <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
                <SheetContent side="right" className="w-[400px] sm:max-w-[420px] p-0 flex flex-col">
                    <SheetHeader className="px-4 pt-4 pb-0">
                        <SheetTitle className="text-lg">Eslatmalar</SheetTitle>
                        <SheetDescription className="sr-only">Eslatmalar paneli</SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-hidden">
                        <NotesPanel embedded />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};
