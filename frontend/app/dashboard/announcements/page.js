'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '../../../components/ui/Card';
import Loader from '../../../components/ui/Loader';
import { format } from 'date-fns';

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const token = savedUser.token;

            if (!token) {
                router.push('/login?redirect=/dashboard/announcements');
                return;
            }

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/announcements/my-announcements`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setAnnouncements(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, [router]);

    if (loading) return <Loader />;

    return (
        <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>Announcements</h1>
                <p style={{ color: '#64748b', marginBottom: '32px' }}>Latest updates from your enrolled batches.</p>

                {announcements.length === 0 ? (
                    <Card style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                        <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '8px' }}>No Announcements</h3>
                        <p style={{ color: '#94a3b8' }}>
                            You don't have any announcements yet. They will appear here once posted by your instructors.
                        </p>
                    </Card>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {announcements.map((announcement) => (
                            <Card key={announcement._id} style={{ padding: '24px', borderLeft: '4px solid #2563eb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        {announcement.course && (
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 8px',
                                                background: '#eff6ff',
                                                color: '#2563eb',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                marginBottom: '8px'
                                            }}>
                                                {announcement.course.title}
                                            </span>
                                        )}
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>{announcement.title}</h3>
                                    </div>
                                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                        {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                                    </span>
                                </div>
                                <p style={{ color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{announcement.message}</p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
