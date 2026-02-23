import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
    return (
        <div className={`glass-card p-8 ${className}`}>
            {children}
        </div>
    );
};
