import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'premium' | 'outline' | 'ghost';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'premium',
    isLoading,
    className = '',
    ...props
}) => {
    const baseStyles = 'relative inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-300 overflow-hidden active:scale-95';
    const variants = {
        premium: 'px-8 py-4 bg-gradient-to-br from-puculuxa-orange to-puculuxa-gold text-white shadow-puculuxa hover:shadow-glow hover:-translate-y-1',
        outline: 'px-8 py-4 bg-transparent border-2 border-slate-200 dark:border-slate-700 text-text-primary hover:border-puculuxa-orange hover:text-puculuxa-orange hover:bg-slate-50 dark:hover:bg-slate-800',
        ghost: 'px-6 py-3 bg-transparent text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-puculuxa-orange shadow-none',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className} disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-puculuxa-orange/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-shadow`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processando...
                </div>
            ) : children}
        </button>
    );
};
