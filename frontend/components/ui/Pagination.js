'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange, maxVisible = 5 }) {
    if (totalPages <= 1) return null;

    const generatePageNumbers = () => {
        const half = Math.floor(maxVisible / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        const pages = [];
        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('ellipsis-start');
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push('ellipsis-end');
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = generatePageNumbers();

    return (
        <nav
            role="navigation"
            aria-label="Pagination"
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '40px'
            }}
        >
            {/* Previous button */}
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    color: currentPage === 1 ? '#cbd5e1' : '#475569',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                    if (currentPage !== 1) {
                        e.target.style.borderColor = '#2563eb';
                        e.target.style.color = '#2563eb';
                    }
                }}
                onMouseOut={(e) => {
                    if (currentPage !== 1) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.color = '#475569';
                    }
                }}
                aria-label="Previous page"
            >
                <ChevronLeft size={16} />
                Previous
            </button>

            {/* Page numbers */}
            <div style={{ display: 'flex', gap: '4px' }}>
                {pageNumbers.map((page, index) => {
                    if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                        return (
                            <span
                                key={page === 'ellipsis-start' ? 'start' : 'end'}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '40px',
                                    height: '40px',
                                    color: '#94a3b8'
                                }}
                            >
                                <MoreHorizontal size={16} />
                            </span>
                        );
                    }

                    const isActive = page === currentPage;
                    return (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            style={{
                                width: '40px',
                                height: '40px',
                                background: isActive ? '#2563eb' : 'white',
                                border: `1px solid ${isActive ? '#2563eb' : '#e2e8f0'}`,
                                borderRadius: '6px',
                                color: isActive ? 'white' : '#475569',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                if (!isActive) {
                                    e.target.style.borderColor = '#2563eb';
                                    e.target.style.color = '#2563eb';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!isActive) {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.color = '#475569';
                                }
                            }}
                            aria-label={`Page ${page}`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    );
                })}
            </div>

            {/* Next button */}
            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    color: currentPage === totalPages ? '#cbd5e1' : '#475569',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                    if (currentPage !== totalPages) {
                        e.target.style.borderColor = '#2563eb';
                        e.target.style.color = '#2563eb';
                    }
                }}
                onMouseOut={(e) => {
                    if (currentPage !== totalPages) {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.color = '#475569';
                    }
                }}
                aria-label="Next page"
            >
                Next
                <ChevronRight size={16} />
            </button>

            {/* Page info */}
            <div style={{
                marginLeft: '16px',
                fontSize: '0.85rem',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span>Page {currentPage} of {totalPages}</span>
            </div>
        </nav>
    );
}