'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setMounted(true);
            const savedTheme = localStorage.getItem('puculuxa-theme') as 'light' | 'dark' | null;
            if (savedTheme) {
                setTheme(savedTheme);
                document.documentElement.classList.toggle('dark', savedTheme === 'dark');
            } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setTheme('dark');
                document.documentElement.classList.add('dark');
            }
        }, 0);
    }, []);

    if (!mounted) {
        return <div className="w-full p-3 h-[64px] rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />;
    }

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('puculuxa-theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 hover:bg-puculuxa-orange/10 group"
            aria-label="Toggle Theme"
        >
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-puculuxa-gold group-hover:scale-110 transition-transform">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <span className="font-bold text-sm text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </span>
        </button>
    );
};
