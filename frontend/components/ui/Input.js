import React from 'react';

const Input = ({ label, id, className = '', ...props }) => {
    return (
        <div className={`input-group ${className}`} style={{ marginBottom: '16px' }}>
            {label && <label htmlFor={id} style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#e2e8f0' }}>{label}</label>}
            <input id={id} className="input" {...props} />
        </div>
    );
};

export default Input;
