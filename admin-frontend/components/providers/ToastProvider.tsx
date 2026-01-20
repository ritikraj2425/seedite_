'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
                style: {
                    background: '#1e293b',
                    color: '#fff',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    padding: '12px 24px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
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
