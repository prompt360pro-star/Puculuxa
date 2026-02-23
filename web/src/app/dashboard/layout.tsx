import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-bg-main text-text-primary transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden">
                <div className="max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
