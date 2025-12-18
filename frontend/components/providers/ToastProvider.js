'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
    return (
        <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
                style: {
                    background: '#1e293b',
                    color: '#fff',
                    border: '1px solid #334155',
                },
                success: {
                    iconTheme: {
                        primary: '#22c55e',
                        secondary: '#fff',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                    },
                },
            }}
        />
    );
}
