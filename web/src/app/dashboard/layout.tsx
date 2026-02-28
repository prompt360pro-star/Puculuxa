import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-bg-main text-text-primary transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative">
                {/* Frosted Glass Header */}
                <header className="sticky top-0 z-30 w-full bg-bg-main/70 backdrop-blur-xl border-b border-white/10 dark:border-white/5 shadow-sm transition-all duration-300">
                    <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-puculuxa-orange to-puculuxa-gold animate-fade-in-up">
                                Puculuxa Admin
                            </h1>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-sm font-bold text-text-primary">Admin Elite</span>
                                <span className="text-[10px] text-puculuxa-lime uppercase tracking-wider font-bold">Online</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 border-2 border-puculuxa-orange/50 p-0.5 shadow-sm">
                                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-puculuxa-orange">AE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-[1600px] mx-auto p-8 pt-6 animate-fade-in-up">
                    {children}
                </div>
            </main>
        </div>
    );
}
