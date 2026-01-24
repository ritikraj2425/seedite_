'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Head from 'next/head';
import { API_URL } from '@/lib/api';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Loader from '../../../components/ui/Loader';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { convertToYouTubeEmbed } from '../../../lib/videoUtils';

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
    const [selectedDemoVideo, setSelectedDemoVideo] = useState(null);

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
        <>
            <Head>
                <title>{course.title} | Seedite</title>
                <meta name="description" content={course.description.substring(0, 160)} />
                <meta property="og:title" content={`${course.title} | Seedite`} />
                <meta property="og:description" content={course.description.substring(0, 160)} />
                <meta property="og:type" content="website" />
                <meta property="og:image" content={course.thumbnail} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={course.title} />
                <meta name="twitter:description" content={course.description.substring(0, 160)} />
                <meta name="twitter:image" content={course.thumbnail} />
            </Head>
            <div className="container" style={{ paddingTop: '40px' }}>
                <div className="responsive-grid">
                    <div>
                        <h1 className="course-title">{course.title}</h1>
                        {isEnrolled ? <></> : <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '1.1rem' }}>{course.description}</p>}

                        {/* Course Highlights / What you'll learn */}
                        {course.courseDetails && course.courseDetails.length > 0 && (
                            <div className="learn-box" style={{ marginBottom: '40px' }}>
                                <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{
                                        width: '32px',
                                        height: '32px',
                                        background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem'
                                    }}>📝</span>
                                    What you'll learn
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                                    {course.courseDetails.map((detail, index) => (
                                        <div key={index} className="learn-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#475569' }}>
                                            <span className="check-icon" style={{ color: '#22c55e', marginTop: '2px', fontWeight: 'bold' }}>✓</span>
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
                                                                <Link key={lecture._id} href={`/courses/${id}/lecture/${lecture._id}`}>
                                                                    <Card style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div>
                                                                            <span style={{ color: '#94a3b8', marginRight: '12px' }}>{index + 1}.</span>
                                                                            <span style={{ fontWeight: 500 }}>{lecture.title}</span>
                                                                        </div>
                                                                        <Button variant="outline" style={{ fontSize: '0.9rem', padding: '8px 12px' }}>Watch</Button>
                                                                    </Card>
                                                                </Link>
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
                                    {course?.mockTests && course?.mockTests?.length > 0 ? (
                                        <div style={{ display: 'grid', gap: '16px' }}>
                                            {course?.mockTests?.map((test) => (
                                                <Card key={test._id} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <span style={{ fontWeight: 500 }}>{test?.title}</span>
                                                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8' }}>{test?.duration} mins</span>
                                                    </div>
                                                    <Link href={`/courses/${id}/mock-test/${test._id}`}>
                                                        <Button style={{ fontSize: '0.9rem', padding: '8px 12px', width: '120px', justifyContent: 'center' }}>Start Test</Button>
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
                            <div className="animate-fade-in">
                                {/* Demo Videos Section */}
                                {(() => {
                                    // Collect all demo lectures
                                    const demoLectures = [];
                                    if (course.sections) {
                                        course.sections.forEach(section => {
                                            if (section.lectures) {
                                                section.lectures.forEach(lecture => {
                                                    if (lecture.isFree) demoLectures.push(lecture);
                                                });
                                            }
                                        });
                                    }
                                    if (course.lectures) {
                                        course.lectures.forEach(lecture => {
                                            if (lecture.isFree) demoLectures.push(lecture);
                                        });
                                    }

                                    if (demoLectures.length > 0) {
                                        // Auto-select first demo if none selected
                                        const currentDemo = selectedDemoVideo || demoLectures[0];

                                        return (
                                            <div style={{ marginBottom: '32px' }}>
                                                <h2 style={{ marginBottom: '20px' }}>Free Preview</h2>

                                                {/* Demo Video Player */}
                                                <Card style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
                                                    <div style={{
                                                        position: 'relative',
                                                        paddingTop: '56.25%',
                                                        background: '#000'
                                                    }}>
                                                        <iframe
                                                            src={convertToYouTubeEmbed(currentDemo.videoUrl)}
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                border: 'none'
                                                            }}
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share; keyboard-map"
                                                            allowFullScreen
                                                            loading="lazy"
                                                            referrerPolicy="no-referrer"
                                                            tabIndex="0"
                                                            playsInline
                                                            title={currentDemo.title || 'Demo Video'}
                                                        />
                                                    </div>
                                                    <div style={{ padding: '16px' }}>
                                                        <p style={{ fontWeight: 500, margin: 0, fontSize: '1.1rem' }}>{currentDemo.title}</p>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            marginTop: '8px',
                                                            background: 'rgba(34, 197, 94, 0.2)',
                                                            color: '#22c55e',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600
                                                        }}>FREE PREVIEW</span>
                                                    </div>
                                                </Card>

                                                {/* Demo Lectures List */}
                                                <h3 style={{ fontSize: '1.2rem', color: '#6366f1', marginBottom: '16px' }}>Available Previews</h3>
                                                <div style={{ display: 'grid', gap: '12px' }}>
                                                    {demoLectures.map((lecture, index) => (
                                                        <Card
                                                            key={lecture._id || index}
                                                            style={{
                                                                padding: '16px',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                border: currentDemo._id === lecture._id ? '2px solid #6366f1' : undefined
                                                            }}
                                                        >
                                                            <div>
                                                                <span style={{ color: '#94a3b8', marginRight: '12px' }}>{index + 1}.</span>
                                                                <span style={{ fontWeight: 500 }}>{lecture.title}</span>
                                                                <span style={{
                                                                    marginLeft: '12px',
                                                                    background: 'rgba(34, 197, 94, 0.2)',
                                                                    color: '#22c55e',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.7rem'
                                                                }}>FREE</span>
                                                            </div>
                                                            <Button
                                                                variant={currentDemo._id === lecture._id ? 'primary' : 'outline'}
                                                                onClick={() => setSelectedDemoVideo(lecture)}
                                                                style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                                                            >
                                                                {currentDemo._id === lecture._id ? 'Playing' : 'Watch'}
                                                            </Button>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                <Card style={{ padding: '40px', textAlign: 'center' }}>
                                    <h3 style={{ marginBottom: '16px' }}>Unlock Full Access</h3>
                                    <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                                        Get access to all lectures, mock tests, and video solutions.
                                    </p>
                                    <Button onClick={handleEnroll} style={{ fontSize: '1.2rem', padding: '16px 40px', width: '100%' }}>
                                        Buy Now for ₹{course.price}
                                    </Button>
                                </Card>
                            </div>
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

                                    {isEnrolled && (
                                        <a
                                            href={course.telegramUrl || "https://t.me/+xiJsaZjnDf02YWY1"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <Button
                                                style={{
                                                    width: '100%',
                                                    marginBottom: '16px',
                                                    background: '#0088cc', // Telegram Blue
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.863 1.13c-1.197.501-1.642 1.298-1.584 1.846a1.95 1.95 0 0 0 1.218 1.626c1.27.514 3.794 1.258 4.755 1.705.408.19.923.498 1.492 1.859l1.631 3.882c.243.581.565.753.847.753.308 0 .543-.198.718-.382l2.846-3.033 4.888 3.633c.854.636 1.732.484 2.053-.591l3.541-16.712a2.205 2.205 0 0 0-.255-1.928 2.227 2.227 0 0 0-1.782-.962Z" /></svg>
                                                Join Telegram Group
                                            </Button>
                                        </a>
                                    )}

                                    {!isEnrolled && (
                                        <Button onClick={handleEnroll} style={{ width: '100%' }}>Enroll Now</Button>
                                    )}
                                </div>
                            </Card>

                            {/* Feedback / Request Section */}
                            {/* Feedback / Request Section */}
                            {isEnrolled && (
                                <Card style={{
                                    padding: '24px',
                                    background: 'linear-gradient(180deg, rgba(14, 116, 144, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
                                    backdropFilter: 'blur(12px)',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, #0891b2 0%, #2563eb 100%)',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.2rem',
                                            boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)'
                                        }}>
                                            ✨
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>Request Features</h3>
                                    </div>

                                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '20px', lineHeight: '1.5' }}>
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
                                            border: '1px solid rgba(6, 182, 212, 0.3)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '0.95rem',
                                            marginBottom: '16px',
                                            resize: 'vertical',
                                            outline: 'none',
                                            transition: 'all 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)'}
                                    />

                                    <Button
                                        onClick={handleFeedbackSubmit}
                                        disabled={submittingFeedback || !feedbackText.trim()}
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(to right, #0891b2, #2563eb)',
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
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
