'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SessionProvider({ children }) {
    const router = useRouter();

    useEffect(() => {
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);

                // Check for 401 Unauthorized
                if (response.status === 401) {
                    const clone = response.clone();
                    try {
                        const body = await clone.json();

                        // Check for specific session expired code
                        if (body.code === 'SESSION_EXPIRED') {
                            // Prevent multiple alerts if multiple requests fail at once
                            if (!window.sessionExpiredAlertShown) {
                                window.sessionExpiredAlertShown = true;

                                // Clear user data
                                localStorage.removeItem('user');
                                document.cookie = 'token=; Max-Age=0; path=/;';

                                toast.error(body.message || 'Session expired. Please login again.', {
                                    duration: 5000,
                                    icon: '🔒'
                                });

                                // Reset flag after delay
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

    return children;
}
