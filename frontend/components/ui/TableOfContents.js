'use client';

export default function TableOfContents({ headings = [], activeHeadingId = '', onHeadingClick }) {
    // Function to strip markdown formatting from text
    const stripMarkdown = (text) => {
        if (!text) return '';

        // Remove common markdown formatting
        return text
            // Remove bold/strong formatting (**text** or __text__)
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/__(.*?)__/g, '$1')
            // Remove italic formatting (*text* or _text_)
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/_(.*?)_/g, '$1')
            // Remove inline code formatting (`code`)
            .replace(/`(.*?)`/g, '$1')
            // Remove markdown links ([text](url))
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Trim whitespace
            .trim();
    };

    if (headings.length === 0) {
        return (
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                No headings found in this article.
            </div>
        );
    }

    return (
        <nav style={{ fontSize: '0.85rem' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {headings.map((heading, index) => {
                    const isActive = activeHeadingId === heading.id;
                    const displayText = stripMarkdown(heading.text);

                    return (
                        <li
                            key={`${heading.id}-${index}`}
                            style={{
                                marginBottom: '8px',
                                paddingLeft: `${(heading.level - 1) * 16}px`
                            }}
                        >
                            <a
                                href={`#${heading.id}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (onHeadingClick) {
                                        onHeadingClick(heading.id);
                                    } else {
                                        const element = document.getElementById(heading.id);
                                        if (element) {
                                            const offset = 120;
                                            const elementPosition = element.getBoundingClientRect().top;
                                            const offsetPosition = elementPosition + window.pageYOffset - offset;
                                            window.scrollTo({
                                                top: offsetPosition,
                                                behavior: 'smooth'
                                            });
                                        }
                                    }
                                }}
                                style={{
                                    color: isActive ? '#2563eb' : '#475569',
                                    textDecoration: 'none',
                                    display: 'block',
                                    padding: '4px 8px',
                                    transition: 'all 0.2s',
                                    borderRadius: '4px',
                                    background: isActive ? '#eff6ff' : 'transparent',
                                    borderLeft: isActive ? '2px solid #2563eb' : '2px solid transparent',
                                    fontWeight: isActive ? '600' : '400'
                                }}
                                onMouseOver={(e) => {
                                    if (!isActive) {
                                        e.target.style.background = '#f1f5f9';
                                        e.target.style.color = '#334155';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isActive) {
                                        e.target.style.background = 'transparent';
                                        e.target.style.color = '#475569';
                                    }
                                }}
                                title={displayText}
                            >
                                {displayText}
                                {isActive && (
                                    <span
                                        style={{
                                            float: 'right',
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: '#2563eb',
                                            animation: 'pulse 2s infinite'
                                        }}
                                    />
                                )}
                            </a>
                        </li>
                    );
                })}
            </ul>

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </nav>
    );
}