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
    const baseStyles = 'btn-premium';
    const variants = {
        premium: '',
        outline: 'bg-transparent border-2 border-puculuxa-orange text-puculuxa-orange hover:bg-puculuxa-orange/5',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 shadow-none',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className} disabled:opacity-50`}
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
