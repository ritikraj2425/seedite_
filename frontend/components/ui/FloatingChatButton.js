'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';

export default function FloatingChatButton() {
    const router = useRouter();
    const pathname = usePathname();
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const handleClick = () => {
        if (pathname === '/') {
            // Already on homepage, just scroll to chatbot
            const el = document.getElementById('chatbot-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Navigate to homepage with a hash to trigger scroll
            router.push('/#chatbot-section');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '8px',
        }}>
            {/* Close/dismiss button */}
            <button
                onClick={() => setDismissed(true)}
                style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease',
                    padding: 0,
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#64748b';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#94a3b8';
                }}
                aria-label="Dismiss chat button"
            >
                <X size={12} strokeWidth={3} />
            </button>

            {/* Chat button */}
            <button
                onClick={handleClick}
                style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 24px rgba(37, 99, 235, 0.35)',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1) translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 32px rgba(124, 58, 237, 0.45)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(37, 99, 235, 0.35)';
                }}
                aria-label="Chat with us"
            >
                <MessageCircle size={22} strokeWidth={2.5} />
            </button>
        </div>
    );
}
