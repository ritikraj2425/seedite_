'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Loader from '../../../components/ui/Loader';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
                const profileRes = await fetch(`${API_URL}/api/users/profile`, {
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
                const res = await fetch(`${API_URL}/api/courses/${id}`, {
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

    const [feedbackText, setFeedbackText] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleFeedbackSubmit = async () => {
        if (!feedbackText.trim()) return;

        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (!savedUser.token) {
            router.push(`/login?redirect=/courses/${id}`);
            return;
        }

        setSubmittingFeedback(true);
        try {
            const res = await fetch(`${API_URL}/api/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${savedUser.token}`
                },
                body: JSON.stringify({
                    courseId: id,
                    text: feedbackText
                })
            });

            if (res.ok) {
                toast.success('Thank you! Your feedback has been recorded.');
                setFeedbackText('');
            } else {
                toast.error('Failed to submit feedback.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong.');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    if (loading) return <Loader />;
    if (!course) return <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>Course not found</div>;

    return (
        <div className="container" style={{ paddingTop: '40px' }}>
            <div className="responsive-grid">
                <div>
                    <h1 style={{ marginBottom: '16px' }}>{course.title}</h1>
                    {isEnrolled ? <></> : <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '1.1rem' }}>{course.description}</p>}

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
                                <h3 style={{ fontSize: '1.4rem', color: '#6366f1', marginBottom: '16px' }}>Lectures</h3>

                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {/* Sections as Dropdown Rows */}
                                    {course.sections && course.sections.map((section) => {
                                        const isExpanded = !!expandedSections[section._id];
                                        return (
                                            <div key={section._id}>
                                                {/* Section Row */}
                                                <Card style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <span style={{ fontWeight: 500 }}>{section.title}</span>
                                                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', marginLeft: '12px' }}>({section.lectures?.length || 0} lectures)</span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => toggleSection(section._id)}
                                                        style={{ fontSize: '0.9rem', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                        {isExpanded ? 'Hide' : 'Show'}
                                                    </Button>
                                                </Card>

                                                {/* Expanded Lectures */}
                                                {isExpanded && section.lectures && section.lectures.length > 0 && (
                                                    <div style={{ paddingLeft: '24px', marginTop: '12px', display: 'grid', gap: '12px' }}>
                                                        {section.lectures.map((lecture, index) => (
                                                            <Card key={lecture._id} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div>
                                                                    <span style={{ color: '#94a3b8', marginRight: '12px' }}>{index + 1}.</span>
                                                                    <span style={{ fontWeight: 500 }}>{lecture.title}</span>
                                                                </div>
                                                                <Link href={`/courses/${id}/lecture/${lecture._id}`}>
                                                                    <Button variant="outline" style={{ fontSize: '0.9rem', padding: '8px 12px' }}>Watch</Button>
                                                                </Link>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Ungrouped Lectures */}
                                    {course.lectures && course.lectures.map((lecture, index) => (
                                        <Card key={lecture._id || index} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                                {(!course.lectures?.length && !course.sections?.length) && (
                                    <p style={{ color: '#94a3b8' }}>No lectures available yet.</p>
                                )}
                            </div>

                            <div style={{ marginBottom: '40px' }}>
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
                    <div style={{ position: 'sticky', top: '100px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                        <Card style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
                            <img src={course.thumbnail} alt="Thumbnail" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                            <div style={{ padding: '24px' }}>
                                {!isEnrolled ?
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ color: '#94a3b8' }}>Price</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{course.price}</span>
                                    </div>
                                    :
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ color: '#94a3b8' }}>Enrolled</span>
                                        <span style={{ fontWeight: 500, color: '#2563eb' }}>Yes</span>
                                    </div>}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <span style={{ color: '#94a3b8' }}>Instructor</span>
                                    <span style={{ fontWeight: 500 }}>{course.instructor}</span>
                                </div>
                                {!isEnrolled && (
                                    <Button onClick={handleEnroll} style={{ width: '100%' }}>Enroll Now</Button>
                                )}
                            </div>
                        </Card>

                        {/* Feedback / Request Section */}
                        {/* Feedback / Request Section */}
                        <Card style={{
                            padding: '24px',
                            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem',
                                    boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)'
                                }}>
                                    ✨
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>Request Features</h3>
                            </div>

                            <p style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '20px', lineHeight: '1.5' }}>
                                Let us know what you want to see in this batch.
                            </p>

                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="I wish there was a module about..."
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '16px',
                                    background: 'rgba(2, 6, 23, 0.5)',
                                    border: '1px solid rgba(51, 65, 85, 0.5)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '0.95rem',
                                    marginBottom: '16px',
                                    resize: 'vertical',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(51, 65, 85, 0.5)'}
                            />

                            <Button
                                onClick={handleFeedbackSubmit}
                                disabled={submittingFeedback || !feedbackText.trim()}
                                style={{
                                    width: '100%',
                                    background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
                                    border: 'none',
                                    padding: '12px',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    opacity: submittingFeedback ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {submittingFeedback ? (
                                    'Sending...'
                                ) : (
                                    <>
                                        <span>Submit Request</span>
                                        <span>→</span>
                                    </>
                                )}
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
