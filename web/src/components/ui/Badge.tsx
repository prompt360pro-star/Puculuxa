import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
    const variants = {
        success: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
