'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import CourseCardSkeleton from '../../components/ui/CourseCardSkeleton';
import { useRouter } from 'next/navigation';
import { Layout, BookOpen, ArrowRight, Sparkles } from 'lucide-react';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const token = savedUser.token;

            try {
                const res = await fetch(`${API_URL}/api/users/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch profile');
                }
                const data = await res.json();
                setUser(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    if (loading) return (
        <div className="container" style={{ paddingTop: '50px' }}>
            <div style={{ marginBottom: '40px' }}>
                <CourseCardSkeleton />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
                {Array(3).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
            </div>
        </div>
    );

    if (!user) return (
        <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
            <div style={{
                maxWidth: '400px',
                margin: '0 auto',
                padding: '60px 40px',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1px solid #e2e8f0'
            }}>
                <Layout size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
                <h2 style={{ marginBottom: '12px', color: '#0f172a' }}>Access Required</h2>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>
                    Please login to view your dashboard
                </p>
                <Link href="/login">
                    <Button style={{
                        padding: '12px 32px'
                    }}>
                        Login
                    </Button>
                </Link>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Header Section */}
            <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderBottom: '1px solid #e2e8f0',
                padding: '50px 0 40px'
            }}>
                <div className="container">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            background: 'linear-gradient(135deg, #3e4451ff 0%, #1a1919ff 100%)',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            boxShadow: '0 8px 30px -4px rgba(37, 99, 235, 0.35)'
                        }}>
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '4px' }}>Welcome back,</p>
                            <h1 style={{
                                fontSize: '1.75rem',
                                margin: 0,
                                background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                {user?.name}
                            </h1>
                        </div>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '1rem' }}>
                        Continue learning from where you left off
                    </p>
                </div>
            </div>

            <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
                {/* Section Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '28px',
                    flexWrap: 'wrap',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                        }}>
                            <BookOpen size={20} color="#2563eb" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
                            Your Courses
                            <span style={{
                                color: '#64748b',
                                fontSize: '1rem',
                                fontWeight: '400',
                                marginLeft: '8px'
                            }}>
                                ({user?.enrolledCourses?.length || 0})
                            </span>
                        </h2>
                    </div>
                    <Link href="/courses">
                        <Button variant="outline" style={{
                            fontSize: '0.9rem',
                            padding: '10px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            Browse More
                            <ArrowRight size={16} />
                        </Button>
                    </Link>
                </div>

                {user?.enrolledCourses && user?.enrolledCourses?.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
                        {[...user?.enrolledCourses]?.reverse().map(course => (
                            <div key={course?._id} className="modern-card" style={{
                                padding: '0',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{
                                    height: '170px',
                                    background: '#f1f5f9',
                                    overflow: 'hidden'
                                }}>
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.3s ease'
                                        }}
                                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                    />
                                </div>
                                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{
                                        fontSize: '1.15rem',
                                        marginBottom: '16px',
                                        color: '#0f172a',
                                        fontWeight: '700'
                                    }}>
                                        {course?.title}
                                    </h3>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Link href={`/courses/${course?._id}`}>
                                            <Button style={{
                                                width: '100%',
                                                fontSize: '1.1rem',
                                                padding: '16px 32px',
                                                borderRadius: '12px',
                                                background: 'var(--gradient-primary)',
                                                boxShadow: '0 8px 30px -4px rgba(37, 99, 235, 0.35)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                Continue Learning
                                                <ArrowRight size={18} />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Card style={{
                        textAlign: 'center',
                        padding: '80px 40px',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%)',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <Sparkles size={36} color="#2563eb" />
                        </div>
                        <h3 style={{ marginBottom: '12px', color: '#0f172a', fontSize: '1.25rem' }}>
                            Start Your Learning Journey
                        </h3>
                        <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                            You haven't enrolled in any courses yet. Explore our collection and find the perfect course for you.
                        </p>
                        <Link href="/courses">
                            <Button style={{
                                padding: '14px 32px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                Browse Courses
                                <ArrowRight size={18} />
                            </Button>
                        </Link>
                    </Card>
                )}
            </div>
        </div>
    );
}
