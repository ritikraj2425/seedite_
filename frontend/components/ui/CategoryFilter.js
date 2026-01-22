'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';

export default function CategoryFilter({ categories = [], selected = 'all', onChange }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#475569',
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.borderColor = '#cbd5e1'}
                onMouseOut={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
                <Filter size={16} />
                {selected === 'all' ? 'All Categories' : selected}
                <svg
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        marginLeft: '4px'
                    }}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 40
                        }}
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            right: 0,
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 0',
                            minWidth: '200px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            zIndex: 50
                        }}
                    >
                        <div style={{ padding: '0 12px 8px', borderBottom: '1px solid #f1f5f9' }}>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Filter by category</p>
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {categories.map((category, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        onChange(category);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '10px 16px',
                                        background: selected === category ? '#f1f5f9' : 'transparent',
                                        border: 'none',
                                        color: selected === category ? '#2563eb' : '#475569',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                    onMouseOver={(e) => {
                                        if (selected !== category) {
                                            e.target.style.background = '#f8fafc';
                                            e.target.style.color = '#334155';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (selected !== category) {
                                            e.target.style.background = 'transparent';
                                            e.target.style.color = '#475569';
                                        }
                                    }}
                                >
                                    {category === 'all' ? 'All Categories' : category}
                                    {selected === category && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>

                        {selected !== 'all' && (
                            <div style={{ padding: '8px 16px', borderTop: '1px solid #f1f5f9' }}>
                                <button
                                    onClick={() => {
                                        onChange('all');
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: 'transparent',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        color: '#dc2626',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = '#fef2f2';
                                        e.target.style.borderColor = '#dc2626';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'transparent';
                                        e.target.style.borderColor = '#e2e8f0';
                                    }}
                                >
                                    Clear Filter
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}