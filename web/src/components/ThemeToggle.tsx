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
            {/* Animated Switch Track */}
            <div className="relative w-14 h-8 bg-slate-200 dark:bg-slate-700 rounded-full transition-colors duration-500 flex-shrink-0">
                {/* Sliding Knob */}
                <div className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-500 flex items-center justify-center shadow-sm ${theme === 'dark' ? 'left-7 bg-indigo-500' : 'left-1 bg-puculuxa-gold'}`}>
                    {theme === 'light' ? <Sun size={14} className="text-white" /> : <Moon size={14} className="text-white" />}
                </div>
            </div>
            <span className="font-bold text-sm text-text-secondary uppercase tracking-widest group-hover:text-text-primary transition-colors">
                {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </span>
        </button>
    );
};
