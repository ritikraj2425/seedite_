'use client';

import { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import { API_URL } from '@/lib/api';

export default function QuickUpdateBanner() {
    const [banner, setBanner] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if already dismissed in this session
        const dismissed = sessionStorage.getItem('bannerDismissed');
        if (dismissed) {
            setIsDismissed(true);
            return;
        }

        // Fetch banner settings from API
        const fetchBanner = async () => {
            try {
                const res = await fetch(`${API_URL}/api/settings/banner`);
                if (res.ok) {
                    const data = await res.json();

                    // Check if banner is active and not expired
                    if (data && data.active && data.text) {
                        // Check expiry
                        if (data.expiresAt) {
                            const expiryDate = new Date(data.expiresAt);
                            if (expiryDate < new Date()) {
                                return; // Banner expired
                            }
                        }
                        setBanner(data);
                        setIsVisible(true);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch banner:', error);
            }
        };

        fetchBanner();
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        sessionStorage.setItem('bannerDismissed', 'true');
    };

    if (!isVisible || isDismissed || !banner) {
        return null;
    }

    return (
        <div className="quick-update-banner">
            <div className="banner-content">
                <Megaphone size={16} className="banner-icon" />
                <span className="banner-text">{banner.text}</span>
                {banner.link && (
                    <a href={banner.link} className="banner-link" target="_blank" rel="noopener noreferrer">
                        Learn More →
                    </a>
                )}
            </div>
            <button
                onClick={handleDismiss}
                className="banner-close"
                aria-label="Dismiss announcement"
            >
                <X size={18} />
            </button>
        </div>
    );
}
