'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ onSearch, placeholder = "Search articles..." }) {
    const [searchValue, setSearchValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSearch = (value) => {
        setSearchValue(value);
        onSearch(value);
    };

    const clearSearch = () => {
        setSearchValue('');
        onSearch('');
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'white',
                border: `1px solid ${isFocused ? '#2563eb' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '10px 16px',
                transition: 'all 0.2s',
                boxShadow: isFocused ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none'
            }}>
                <Search
                    size={18}
                    color={isFocused ? '#2563eb' : '#94a3b8'}
                    style={{ marginRight: '12px' }}
                />

                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        color: '#0f172a',
                        fontSize: '0.95rem',
                        minWidth: 0
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') clearSearch();
                    }}
                />

                {searchValue && (
                    <button
                        onClick={clearSearch}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            marginLeft: '8px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
                        onMouseOut={(e) => e.target.style.background = 'transparent'}
                        aria-label="Clear search"
                    >
                        <X size={16} color="#94a3b8" />
                    </button>
                )}
            </div>

            {/* Search tips */}
            {isFocused && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 100,
                    fontSize: '0.85rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ color: '#64748b' }}>💡</span>
                        <span style={{ color: '#64748b' }}>Search tips:</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b' }}>
                        <li>Try searching by title, tag, or content</li>
                        <li>Use quotes for exact phrases</li>
                        <li>Press ESC to clear search</li>
                    </ul>
                </div>
            )}
        </div>
    );
}