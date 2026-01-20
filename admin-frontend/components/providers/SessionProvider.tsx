'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

declare global {
    interface Window {
        sessionExpiredAlertShown?: boolean;
    }
}

export default function SessionProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);

                if (response.status === 401) {
                    const clone = response.clone();
                    try {
                        const body = await clone.json();

                        // Check for specific session expired code
                        if (body.code === 'SESSION_EXPIRED') {
                            // Prevent multiple alerts
                            if (!window.sessionExpiredAlertShown) {
                                window.sessionExpiredAlertShown = true;

                                // Clear admin data
                                localStorage.removeItem('adminUser');
                                // Force clear cookie if possible (though HttpOnly won't clear, it helps if standard cookie)
                                document.cookie = 'token=; Max-Age=0; path=/;';

                                toast.error(body.message || 'Session expired. You have been logged in on another device.', {
                                    duration: 5000,
                                    icon: '🔒'
                                });

                                // Reset flag
                                setTimeout(() => {
                                    window.sessionExpiredAlertShown = false;
                                }, 5000);

                                // Redirect to login
                                router.push('/login');
                            }
                        }
                    } catch (e) {
                        // Response might not be JSON, ignore
                    }
                }

                return response;
            } catch (error) {
                throw error;
            }
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, [router]);

    return <>{children}</>;
}
