'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

export default function CourseDetails() {
    const params = useParams();
    // Unwrap params safely if needed, though useParams returns object directly in client
    const id = params?.id;

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!id) return;

        const fetchCourse = async () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const token = savedUser.token;

            // 1. Strict Auth Check
            if (!token) {
                router.push(`/login?redirect=/courses/${id}`);
                return;
            }

            try {
                // First fetch user profile to check enrollment
                const profileRes = await fetch('http://localhost:5000/api/users/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                let userEnrolled = false;
                let isAdmin = false;

                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    isAdmin = profileData.role === 'admin';
                    // Check if user is enrolled in this specific course
                    userEnrolled = profileData.enrolledCourses?.some(
                        (course) => course._id === id || course === id
                    );
                }

                // Fetch course details
                const res = await fetch(`http://localhost:5000/api/courses/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) throw new Error('Failed to fetch course');

                const data = await res.json();
                setCourse(data);

                // Set enrollment status based on actual user profile, not just if lectures exist
                // Admins can view content but should still see "not enrolled" UI unless they buy
                setIsEnrolled(userEnrolled);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [id, router]);

    const handleEnroll = () => {
        router.push(`/payment/${id}`);
    };

    if (loading) return <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>Loading course...</div>;
    if (!course) return <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>Course not found</div>;

    return (
        <div className="container" style={{ paddingTop: '40px' }}>
            <div className="responsive-grid">
                <div>
                    <h1 style={{ marginBottom: '16px' }}>{course.title}</h1>
                    <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '1.1rem' }}>{course.description}</p>

                    {/* Course Highlights / What you'll learn */}
                    {course.courseDetails && course.courseDetails.length > 0 && (
                        <div style={{ marginBottom: '40px', background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
                            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>✨</span> What you'll learn
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                                {course.courseDetails.map((detail, index) => (
                                    <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#cbd5e1' }}>
                                        <span style={{ color: '#22c55e', marginTop: '2px' }}>✓</span>
                                        <span>{detail}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isEnrolled ? (
                        <div className="animate-fade-in">
                            <h2 style={{ marginBottom: '20px' }}>Course Content</h2>

                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1.4rem', color: '#6366f1' }}>Lectures</h3>
                                {course.lectures && course.lectures.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        {course.lectures.map((lecture, index) => (
                                            <Card key={index} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <span style={{ color: '#94a3b8', marginRight: '12px' }}>{index + 1}.</span>
                                                    <span style={{ fontWeight: 500 }}>{lecture.title}</span>
                                                </div>
                                                <Link href={`/courses/${id}/lecture/${lecture._id || index}`}>
                                                    <Button variant="outline" style={{ fontSize: '0.9rem', padding: '8px 12px' }}>Watch</Button>
                                                </Link>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#94a3b8' }}>No lectures available yet.</p>
                                )}
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.4rem', color: '#ec4899' }}>Mock Tests</h3>
                                {course.mockTests && course.mockTests.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        {course.mockTests.map((test) => (
                                            <Card key={test._id} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <span style={{ fontWeight: 500 }}>{test.title}</span>
                                                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8' }}>{test.durationMinutes} mins</span>
                                                </div>
                                                <Link href={`/courses/${id}/mock-test/${test._id}`}>
                                                    <Button style={{ fontSize: '0.9rem', padding: '8px 12px' }}>Start Test</Button>
                                                </Link>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#94a3b8' }}>No mock tests available yet.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Card style={{ padding: '40px', textAlign: 'center' }}>
                            <h3 style={{ marginBottom: '16px' }}>Unlock Full Access</h3>
                            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                                Get access to all lectures, mock tests, and video solutions.
                            </p>
                            <Button onClick={handleEnroll} style={{ fontSize: '1.2rem', padding: '16px 40px', width: '100%' }}>
                                Buy Now for ₹{course.price}
                            </Button>
                        </Card>
                    )}
                </div>

                <div>
                    <div style={{ position: 'sticky', top: '100px' }}>
                        <Card style={{ padding: '0', overflow: 'hidden' }}>
                            <img src={course.thumbnail} alt="Thumbnail" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                            <div style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ color: '#94a3b8' }}>Price</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{course.price}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <span style={{ color: '#94a3b8' }}>Instructor</span>
                                    <span style={{ fontWeight: 500 }}>{course.instructor}</span>
                                </div>
                                {!isEnrolled && (
                                    <Button onClick={handleEnroll} style={{ width: '100%' }}>Enroll Now</Button>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
