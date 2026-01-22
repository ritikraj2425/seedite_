'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items }) {
    return (
        <nav
            aria-label="Breadcrumb"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem',
                flexWrap: 'wrap'
            }}
        >
            {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {index === 0 ? (
                        <Link
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#64748b',
                                textDecoration: 'none'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#2563eb'}
                            onMouseOut={(e) => e.target.style.color = '#64748b'}
                        >
                            <Home size={14} />
                        </Link>
                    ) : item.active ? (
                        <span style={{ color: '#0f172a', fontWeight: '500' }}>
                            {item.label}
                        </span>
                    ) : (
                        <Link
                            href={item.href}
                            style={{
                                color: '#64748b',
                                textDecoration: 'none'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#2563eb'}
                            onMouseOut={(e) => e.target.style.color = '#64748b'}
                        >
                            {item.label}
                        </Link>
                    )}

                    {index < items.length - 1 && (
                        <ChevronRight size={12} color="#cbd5e1" />
                    )}
                </div>
            ))}

            {/* Schema.org structured data for breadcrumbs */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": items.map((item, index) => ({
                            "@type": "ListItem",
                            "position": index + 1,
                            "name": item.label,
                            "item": `${window.location.origin}${item.href}`
                        }))
                    })
                }}
            />
        </nav>
    );
}