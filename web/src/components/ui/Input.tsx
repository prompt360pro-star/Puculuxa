import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon, error, id, className = '', ...props }) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
        <div className="w-full space-y-2">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                >
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-puculuxa-orange transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={error ? "true" : "false"}
                    className={`input-premium ${icon ? 'pl-12' : 'pl-4'} ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''} ${className}`}
                    {...props}
                />
            </div>
            {error && (
                <p id={errorId} role="alert" className="text-red-600 dark:text-red-400 font-medium text-xs mt-1.5 animate-fade-in-up">
                    {error}
                </p>
            )}
        </div>
    );
};
