'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Fetch profile
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || localStorage.getItem('token');
        // Note: httpOnly cookie is not accessible by js, but if our auth middleware checks it, we just need to make the request with credentials.
        // If we used localStorage for token in login, we use it here.
        // My login page set localStorage 'user'. I didn't set 'token' separately in localStorage in login.js, only 'user' object which has token.
        // But backend sets httpOnly cookie.
        // So fetch with `credentials: 'include'` should work.

        // Wait, the login page code: `localStorage.setItem('user', JSON.stringify(data));`
        // data has `token`.

        const fetchProfile = async () => {
            // We can use the token from localStorage if we want authorization header
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const token = savedUser.token;

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/profile`, {
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
                // router.push('/login'); // Redirect if failed
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    if (loading) return <Loader />;

    if (!user) return <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>Please <Link href="/login" style={{ color: 'var(--primary)' }}>login</Link> to view dashboard.</div>;

    return (
        <div className="container" style={{ paddingTop: '40px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ marginBottom: '8px' }}>Welcome back, {user.name}</h1>
                <p style={{ color: '#94a3b8' }}>Here are your enrolled courses.</p>
            </div>

            {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {user.enrolledCourses.map(course => (
                        <Card key={course._id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '160px', background: '#334155', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
                                <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{course.title}</h3>
                            <div style={{ marginTop: 'auto' }}>
                                <Link href={`/courses/${course._id}`}>
                                    <Button style={{ width: '100%' }}>Continue Learning</Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card style={{ textAlign: 'center', padding: '60px' }}>
                    <h3 style={{ marginBottom: '16px' }}>You haven't enrolled in any courses yet.</h3>
                    <Link href="/courses">
                        <Button>Browse Courses</Button>
                    </Link>
                </Card>
            )}
        </div>
    );
}
