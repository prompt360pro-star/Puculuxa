'use client';

import React from 'react';
import { Plus, Bell, Search, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const DashboardHeader = () => {
    return (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="flex items-center gap-2 text-puculuxa-orange font-black text-[10px] tracking-[0.3em] uppercase mb-2">
                    <Zap size={14} fill="currentColor" />
                    Operação em Tempo Real
                </div>
                <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">Resumo Executivo</h1>
                <p className="text-text-secondary font-medium mt-1">Status operacional e indicadores de crescimento para hoje.</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative group hidden lg:block">
                    <div className="absolute inset-0 bg-puculuxa-orange/5 blur-xl group-focus-within:bg-puculuxa-orange/10 transition-all rounded-full" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-puculuxa-orange transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar (CMD+K)"
                        className="relative pl-12 pr-4 h-12 w-64 bg-bg-card border border-border-main rounded-xl focus:ring-4 focus:ring-puculuxa-orange/10 focus:border-puculuxa-orange outline-none transition-all font-medium text-text-primary"
                    />
                </div>
                <button
                    title="Notificações"
                    aria-label="Ver notificações"
                    className="p-3 bg-bg-card border border-border-main rounded-xl text-text-secondary hover:text-puculuxa-orange transition-colors relative shadow-sm"
                >
                    <Bell size={24} />
                    <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                </button>
                <Button className="h-12 px-6 bg-gradient-to-r from-puculuxa-orange to-puculuxa-gold text-white border-0 shadow-puculuxa-orange/20 shadow-lg hover:opacity-90 transition-opacity whitespace-nowrap">
                    <Plus size={20} className="mr-2" />
                    CADASTRAR PEDIDO
                </Button>
            </div>
        </header>
    );
};
