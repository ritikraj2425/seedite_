'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Loader from '../../../../components/ui/Loader';

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const errorParam = searchParams.get('error');
            const stateRedirect = searchParams.get('state') || '/';

            if (errorParam) {
                setError('Google authentication was cancelled or failed.');
                setLoading(false);
                return;
            }

            if (!code) {
                setError('No authorization code received from Google.');
                setLoading(false);
                return;
            }

            try {
                // Send the authorization code to our backend
                const response = await fetch(`${API_URL}/api/auth/google`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code,
                        redirectUri: `${window.location.origin}/auth/google/callback`
                    }),
                    credentials: 'include'
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Authentication failed');
                }

                // Store user data (same as regular login)
                localStorage.setItem('user', JSON.stringify(data));

                // Redirect to the original page the user was on
                router.push(stateRedirect);
                router.refresh();

            } catch (err) {
                setError(err.message || 'Authentication failed. Please try again.');
                setLoading(false);
            }
        };

        handleCallback();
    }, [searchParams, router]);

    if (loading && !error) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                gap: '20px'
            }}>
                <div className="spinner"></div>
                <style jsx>{`
                    .spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid rgba(37, 99, 235, 0.3);
                        border-radius: 50%;
                        border-top-color: #2563eb;
                        animation: spin 1s ease-in-out infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
                <p style={{ color: '#64748b', fontSize: '1rem' }}>
                    Signing you in with Google...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '20px',
                textAlign: 'center'
            }}>
                <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '400px'
                }}>
                    <h2 style={{ color: '#dc2626', marginBottom: '12px', fontSize: '1.2rem' }}>
                        Authentication Failed
                    </h2>
                    <p style={{ color: '#7f1d1d', marginBottom: '20px' }}>
                        {error}
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        style={{
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={<Loader />}>
            <GoogleCallbackContent />
        </Suspense>
    );
}
