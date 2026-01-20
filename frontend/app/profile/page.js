'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import { User, BookOpen, Trophy, Calendar, ArrowRight } from 'lucide-react';
import { ProfileCardSkeleton, ListItemSkeleton } from '../../components/ui/Skeleton';

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const token = savedUser.token;

            if (!token) {
                window.location.href = '/login';
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setUser(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            <div style={{ height: '40px', width: '200px', background: '#f1f5f9', marginBottom: '32px', borderRadius: '8px' }}></div>
            <div className="profile-grid">
                <div>
                    <ProfileCardSkeleton />
                </div>
                <div>
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ height: '30px', width: '250px', background: '#f1f5f9', marginBottom: '20px', borderRadius: '8px' }}></div>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <ListItemSkeleton />
                            <ListItemSkeleton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!user) return <div className="container" style={{ paddingTop: '40px' }}>User not found</div>;

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            <h1 style={{ marginBottom: '32px' }}>My Profile</h1>

            <div className="profile-grid">
                {/* Profile Card */}
                <div>
                    <Card style={{
                        textAlign: 'center',
                        padding: '32px 24px',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            background: 'linear-gradient(135deg, #3e4451ff 0%, #1a1919ff 100%)',
                            borderRadius: '50%',
                            margin: '0 auto 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            color: 'white',
                            fontWeight: '700',
                            boxShadow: '0 8px 30px -4px rgba(37, 99, 235, 0.35)'
                        }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 style={{ marginBottom: '8px', fontSize: '1.4rem', color: '#0f172a' }}>{user.name}</h2>
                        <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '0.95rem' }}>{user.email}</p>
                        <span style={{
                            background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                            color: '#2563eb',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 16px',
                            borderRadius: '100px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em'
                        }}>
                            <User size={14} />
                            {user.role}
                        </span>

                        {/* Quick Stats */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            marginTop: '24px',
                            paddingTop: '24px',
                            borderTop: '1px solid #e2e8f0'
                        }}>
                            <div style={{
                                background: '#f8fafc',
                                padding: '16px 12px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: '#2563eb',
                                    marginBottom: '4px'
                                }}>
                                    {user.enrolledCourses?.length || 0}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Courses</div>
                            </div>
                            <div style={{
                                background: '#f8fafc',
                                padding: '16px 12px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: '#7c3aed',
                                    marginBottom: '4px'
                                }}>
                                    {user.mockTestResults?.length || 0}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Tests Taken</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Content Area */}
                <div>
                    {/* Enrolled Courses Section */}
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '20px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <BookOpen size={20} color="#2563eb" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                                Enrolled Courses
                                <span style={{ color: '#64748b', fontWeight: '400', marginLeft: '8px' }}>
                                    ({user.enrolledCourses ? user.enrolledCourses.length : 0})
                                </span>
                            </h3>
                        </div>

                        {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {[...user.enrolledCourses]?.reverse().map(course => (
                                    <Card key={course._id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '16px',
                                        padding: '16px',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <div style={{
                                            width: '90px',
                                            height: '65px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            flexShrink: 0
                                        }}>
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{
                                                marginBottom: '4px',
                                                fontSize: '1rem',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {course.title}
                                            </h4>
                                            <Link
                                                href={`/courses/${course._id}`}
                                                style={{
                                                    fontSize: '0.9rem',
                                                    color: '#2563eb',
                                                    fontWeight: '500',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                Continue Learning
                                                <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card style={{
                                textAlign: 'center',
                                padding: '40px',
                                background: '#f8fafc'
                            }}>
                                <BookOpen size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
                                <p style={{ color: '#64748b', marginBottom: '16px' }}>No enrolled courses yet.</p>
                                <Link href="/courses">
                                    <Button variant="outline" style={{ fontSize: '0.9rem' }}>
                                        Browse Courses
                                    </Button>
                                </Link>
                            </Card>
                        )}
                    </div>

                    {/* Mock Test History Section */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '20px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #fae8ff 0%, #f5d0fe 100%)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Trophy size={20} color="#a855f7" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                                Mock Test History
                                <span style={{ color: '#64748b', fontWeight: '400', marginLeft: '8px' }}>
                                    ({user.mockTestResults ? user.mockTestResults.length : 0})
                                </span>
                            </h3>
                        </div>

                        {user.mockTestResults && user.mockTestResults.length > 0 ? (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {[...user.mockTestResults]?.reverse().map((result, index) => (
                                    <Card key={index} style={{
                                        padding: '20px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '16px'
                                    }}>
                                        <div style={{ minWidth: '200px' }}>
                                            <h4 style={{
                                                marginBottom: '6px',
                                                fontSize: '1rem',
                                                color: '#0f172a'
                                            }}>
                                                {result.test ? result.test.title : 'Test Removed'}
                                            </h4>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '0.85rem',
                                                color: '#64748b'
                                            }}>
                                                <Calendar size={14} />
                                                Completed on {new Date(result.completedAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                        <div style={{
                                            textAlign: 'right',
                                            background: result.score >= 0 ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                            padding: '12px 20px',
                                            borderRadius: '12px',
                                            minWidth: '100px'
                                        }}>
                                            <span style={{
                                                fontSize: '1.3rem',
                                                fontWeight: 'bold',
                                                color: result.score >= 0 ? '#16a34a' : '#dc2626'
                                            }}>
                                                {result.score}/{result.totalMarks || (result.totalQuestions * 4)}
                                            </span>
                                            <span style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                color: result.score >= 0 ? '#166534' : '#991b1b',
                                                fontWeight: '500',
                                                marginTop: '2px'
                                            }}>
                                                MARKS
                                            </span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card style={{
                                textAlign: 'center',
                                padding: '40px',
                                background: '#f8fafc'
                            }}>
                                <Trophy size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
                                <p style={{ color: '#64748b' }}>No mock tests attempted yet.</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
