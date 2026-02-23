'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, MessageSquare, PieChart, LayoutDashboard, ClipboardList, Store, Users, Settings, LogOut } from 'lucide-react';
import { AuthWebService } from '@/services/authService';
import { ThemeToggle } from './ThemeToggle';

export const Sidebar = () => {
    const pathname = usePathname();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
        { icon: ClipboardList, label: 'Pedidos', href: '/dashboard/orders' },
        { icon: Store, label: 'Catálogo', href: '/dashboard/catalog' },
        { icon: Users, label: 'Clientes', href: '/dashboard/customers' },
        { icon: PieChart, label: 'Relatórios', href: '/dashboard/stats' },
        { icon: MessageSquare, label: 'Avaliações', href: '/dashboard/reviews' },
        { icon: Settings, label: 'Configurações', href: '/dashboard/settings' },
    ];

    return (
        <aside className="w-72 bg-bg-card border-r border-border-main flex flex-col h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-colors duration-300">
            {/* Branding Section */}
            <div className="p-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-puculuxa-orange to-puculuxa-gold rounded-[2rem] flex items-center justify-center shadow-puculuxa mb-5 rotate-3 hover:rotate-0 transition-transform duration-500">
                    <ChefHat size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-text-primary tracking-tight transition-colors">Puculuxa</h2>
                <p className="text-[10px] text-puculuxa-orange font-black tracking-[0.3em] uppercase mt-1">Cakes & Catering</p>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 px-6 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${isActive
                                ? 'bg-puculuxa-orange/10 text-puculuxa-orange font-bold'
                                : 'text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-text-primary'
                                }`}
                        >
                            <item.icon
                                size={22}
                                className={`transition-transform duration-300 ${isActive ? 'scale-110 text-puculuxa-orange' : 'text-text-secondary group-hover:scale-110 group-hover:text-text-primary'}`}
                            />
                            <span className="text-[15px]">{item.label}</span>
                            {isActive && <div className="ml-auto w-1.5 h-6 bg-puculuxa-orange rounded-full" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section: Theme + Profile/Logout */}
            <div className="p-6 mt-auto border-t border-border-main space-y-2">
                <ThemeToggle />

                <button
                    onClick={() => AuthWebService.logout()}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-text-secondary hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 transition-all group"
                >
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden">
                        <Users size={20} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-text-primary group-hover:text-red-500 transition-colors">Admin Elite</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Sair do Sistema</span>
                    </div>
                    <LogOut size={18} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        </aside>
    );
};
