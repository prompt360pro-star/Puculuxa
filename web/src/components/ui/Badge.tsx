import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
    const variants = {
        success: 'bg-green-100 text-green-700 border-green-200',
        warning: 'bg-amber-100 text-amber-700 border-amber-200',
        danger: 'bg-red-100 text-red-700 border-red-200',
        info: 'bg-blue-100 text-blue-700 border-blue-200',
        neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
