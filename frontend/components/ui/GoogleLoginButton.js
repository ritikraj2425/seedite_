'use client';

import { API_URL } from '@/lib/api';

/**
 * Google Sign-In Button Component
 * 
 * This component initiates the Google OAuth flow by redirecting to Google's
 * authorization page. After user authenticates, Google redirects back to
 * /auth/google/callback with an authorization code.
 */
export default function GoogleLoginButton({
    text = 'Continue with Google',
    disabled = false,
    redirectUrl = '/',
    style = {},
    className = ''
}) {
    const handleGoogleLogin = () => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

        if (!clientId) {
            console.error('Google Client ID not configured');
            alert('Google login is not configured. Please contact support.');
            return;
        }

        // Build Google OAuth URL
        const redirectUri = `${window.location.origin}/auth/google/callback`;

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'select_account',
            state: redirectUrl || '/dashboard', // Default to dashboard like email auth
        });

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        // Redirect to Google
        window.location.href = googleAuthUrl;
    };

    return (
        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={disabled}
            className={className}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: '500',
                color: '#374151',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: disabled ? 0.6 : 1,
                ...style
            }}
            onMouseOver={(e) => {
                if (!disabled) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                }
            }}
            onMouseOut={(e) => {
                if (!disabled) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                }
            }}
        >
            {/* Google Logo */}
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
            </svg>
            {text}
        </button>
    );
}
