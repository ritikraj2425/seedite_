import React from 'react';

// Plan said Vanilla CSS. I defined .btn .btn-primary in global.css.
// So I will just use className.

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseClass = 'btn';
    const variantClass = variant === 'outline' ? 'btn-outline' : 'btn-primary';

    return (
        <button className={`${baseClass} ${variantClass} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
