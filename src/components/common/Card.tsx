import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
    return (
        <div
            className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${hover ? 'card-hover' : ''
                } ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;
