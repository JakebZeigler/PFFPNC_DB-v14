
import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    return (
        <div className={`animate-spin rounded-full border-t-2 border-b-2 border-brand-red ${sizeClasses[size]}`}></div>
    );
};

export default Spinner;
