import Link from 'next/link';
import Card from './ui/Card';
import Button from './ui/Button';
import { Play, Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export default function Testimonials() {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await fetch(`${API_URL}/api/testimonials`);
                if (res.ok) {
                    const data = await res.json();
                    setTestimonials(data.filter(t => t.isVisible !== false));
                }
            } catch (error) {
                console.error('Failed to fetch testimonials', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    if (loading) return <div className="py-20 text-center text-gray-500">Loading stories...</div>;
    if (testimonials.length === 0) return null;

    return (
        <section style={{ padding: '80px 0', background: '#f8fafc' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#dbeafe',
                        color: '#2563eb',
                        padding: '6px 16px',
                        borderRadius: '100px',
                        marginBottom: '16px',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                    }}>
                        <Star size={16} fill="currentColor" />
                        <span>Success Stories</span>
                    </div>
                    <h2 style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        color: '#0f172a',
                        marginBottom: '16px'
                    }}>
                        What Our Students Say
                    </h2>
                    <p style={{
                        fontSize: '1.2rem',
                        color: '#64748b',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        Hear directly from students who achieved their dreams with Seedite.
                    </p>
                </div>

                <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                        {testimonials?.map((t) => (
                            <Card key={t?._id} className="modern-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ marginBottom: '24px', color: '#2563eb' }}>
                                    <Quote size={32} />
                                </div>
                                <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#334155', marginBottom: '24px', flex: 1, fontStyle: 'italic' }}>
                                    "{t.content}"
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} fill={i < t.rating ? "#eab308" : "#e2e8f0"} color={i < t.rating ? "#eab308" : "#e2e8f0"} />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                                    {t?.image ? (
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0' }}>
                                            <img src={t?.image} alt={t?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ) : (
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {t?.name?.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h4 style={{ fontWeight: '700', color: '#0f172a', margin: 0 }}>{t?.name}</h4>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{t?.role}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
