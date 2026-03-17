'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_URL } from '@/lib/api';
import { Loader2, X } from 'lucide-react';

export default function LiveSessionConfirmModal({ isOpen, onClose, session, userToken, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen || !session || !mounted) return null;

    const handleRegister = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/live-sessions/${session._id}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                if (onSuccess) onSuccess();
                setTimeout(() => {
                    onClose();
                    setTimeout(() => setSuccess(false), 300);
                }, 3000);
            } else {
                setError(data.message || 'Failed to register. Please try again.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const sessionDateObj = new Date(session.sessionDate);
    const dateStr = sessionDateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let timeStr = session.sessionTime;
    if (timeStr && timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHours = h % 12 || 12;
        timeStr = `${formattedHours}:${minutes} ${ampm}`;
    }

    const modal = (
        <div
            className="lsm-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="lsm-sheet">

                {/* Stripe */}
                {/* <div className={`lsm-stripe ${success ? 'lsm-stripe--success' : ''}`} /> */}

                {success ? (
                    <div className="lsm-success">
                        <div className="lsm-success__ring">✓</div>
                        <h4 className="lsm-success__title">You&apos;re Registered!</h4>
                        <p className="lsm-success__desc">
                            A confirmation has been sent to your inbox.
                            See you on {dateStr} at {timeStr}.
                        </p>
                        <button onClick={onClose} className="lsm-btn lsm-btn--dark">
                            Done
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="lsm-header">
                            <div className="lsm-header__text">
                                <span className="lsm-eyebrow">Live Session</span>
                                <h3 className="lsm-title">{session.title}</h3>
                            </div>
                            <button onClick={onClose} className="lsm-close" aria-label="Close">
                                <X size={15} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Scrollable description */}
                        <div className="lsm-body">
                            {session.description && (
                                <p className="lsm-desc">{session.description}</p>
                            )}
                        </div>

                        {/* Meta tiles — always visible */}
                        <div className="lsm-meta">
                            <div className="lsm-meta__rule" />
                            <div className="lsm-meta__grid">
                                <div className="lsm-meta__tile">
                                    <span className="lsm-meta__label">Date</span>
                                    <span className="lsm-meta__value">{dateStr}</span>
                                </div>
                                <div className="lsm-meta__tile">
                                    <span className="lsm-meta__label">Time</span>
                                    <span className="lsm-meta__value">{timeStr}</span>
                                </div>
                            </div>
                            {error && <div className="lsm-error">{error}</div>}
                        </div>

                        {/* Footer */}
                        <div className="lsm-footer">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="lsm-btn lsm-btn--ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRegister}
                                disabled={loading}
                                className="lsm-btn lsm-btn--dark"
                            >
                                {loading
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : 'Confirm Registration'
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}