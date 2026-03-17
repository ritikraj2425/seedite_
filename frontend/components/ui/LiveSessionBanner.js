'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock } from 'lucide-react';
import { API_URL } from '@/lib/api';
import LiveSessionConfirmModal from './LiveSessionConfirmModal';

export default function LiveSessionBanner() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Check if user is logged in
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (savedUser.token) {
            setUser(savedUser);
        }

        fetchActiveSession();
    }, []);

    const fetchActiveSession = async () => {
        try {
            const res = await fetch(`${API_URL}/api/live-sessions/active`);
            if (res.ok) {
                const data = await res.json();
                setSession(data);
            }
        } catch (error) {
            console.error('Error fetching active live session:', error);
        } finally {
            setLoading(false);
        }
    };

    const isLoggedIn = !!user;
    const userToken = user?.token || '';
    const isRegistered = user && session?.registeredUsers?.includes(user._id);

    const handleRegisterClick = () => {
        if (!isLoggedIn) {
            router.push('/login?redirect=/'); // Redirect to login
            return;
        }

        if (isRegistered) return;

        // Open confirmation modal
        setIsModalOpen(true);
    };

    const handleRegistrationSuccess = () => {
        // Optimistically update the session state to include this user
        // so the button instantly changes to 'Registered'
        if (session && user) {
            setSession(prev => ({
                ...prev,
                registeredUsers: [...(prev.registeredUsers || []), user._id]
            }));
        }
    };

    if (loading || !session) return null;

    const sessionDateObj = new Date(session.sessionDate);
    const dateStr = sessionDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    // Format "14:30" to "2:30 PM"
    let timeStr = session.sessionTime;
    if (timeStr && timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHours = h % 12 || 12;
        timeStr = `${formattedHours}:${minutes} ${ampm}`;
    }

    // Ensure session banner isn't past its end time (double check)
    if (new Date(session.endTime) < new Date()) {
        return null;
    }

    return (
        <div className="ls-banner">
            <div className="container">
                <div className="ls-banner-inner">
                    <div className="ls-banner-left">
                        <div className="ls-banner-badge">
                            <span className="pulse-dot"></span>
                            Upcoming Live
                        </div>
                        <div className="ls-banner-info">
                            <h3 className="ls-banner-title">{session.title}</h3>                            <div className="ls-banner-time">
                                <Calendar size={14} />
                                <span>{dateStr}</span>
                                <span className="opacity-40">•</span>
                                <Clock size={14} />
                                <span>{timeStr}</span>
                            </div>
                        </div>
                    </div>

                    <div className="ls-banner-right">
                        <button
                            onClick={handleRegisterClick}
                            className={`btn ls-banner-btn ${isRegistered ? 'registered' : ''}`}
                            disabled={isRegistered}
                        >
                            {isRegistered ? 'Registered' : 'Register Now'}
                        </button>
                    </div>
                </div>
            </div>

            <LiveSessionConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                session={session}
                userToken={userToken}
                onSuccess={handleRegistrationSuccess}
            />
        </div>
    );
}
