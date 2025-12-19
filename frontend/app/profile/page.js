'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';

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
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/profile`, {
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

    if (loading) return <Loader />;
    if (!user) return <div className="container" style={{ paddingTop: '40px' }}>User not found</div>;

    return (
        <div className="container" style={{ paddingTop: '40px' }}>
            <h1 style={{ marginBottom: '32px' }}>My Profile</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                <div>
                    <Card style={{ textAlign: 'center' }}>
                        <div style={{ width: '100px', height: '100px', background: '#334155', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                            {user.name.charAt(0)}
                        </div>
                        <h2 style={{ marginBottom: '8px' }}>{user.name}</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '16px' }}>{user.email}</p>
                        <p style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'inline-block', padding: '4px 12px', borderRadius: '4px', fontSize: '0.9rem' }}>
                            {user.role.toUpperCase()}
                        </p>
                    </Card>
                </div>

                <div>
                    <h3 style={{ marginBottom: '16px' }}>Enrolled Courses ({user.enrolledCourses ? user.enrolledCourses.length : 0})</h3>
                    {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                        <div style={{ display: 'grid', gap: '16px', marginBottom: '40px' }}>
                            {[...user.enrolledCourses]?.reverse().map(course => (
                                <Card key={course._id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
                                    <img src={course.thumbnail} alt={course.title} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ marginBottom: '4px', fontSize: '1rem' }}>{course.title}</h4>
                                        <Link href={`/courses/${course._id}`} style={{ fontSize: '0.9rem', color: '#6366f1' }}>View Course</Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#94a3b8', marginBottom: '40px' }}>No enrolled courses.</p>
                    )}

                    <h3 style={{ marginBottom: '16px' }}>Mock Test History ({user.mockTestResults ? user.mockTestResults.length : 0})</h3>
                    {user.mockTestResults && user.mockTestResults.length > 0 ? (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {[...user.mockTestResults]?.reverse().map((result, index) => (
                                <Card key={index} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ marginBottom: '4px', fontSize: '1rem' }}>
                                            {result.test ? result.test.title : 'Test Removed'}
                                        </h4>
                                        <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                            Completed on {new Date(result.completedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80' }}>
                                            {result.score}/{result.totalMarks || (result.totalQuestions * 4)}
                                        </span>
                                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8' }}>Marks</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#94a3b8' }}>No mock tests attempted yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
