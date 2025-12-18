'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Button from '../../../../../components/ui/Button';
import Card from '../../../../../components/ui/Card';
import Loader from '../../../../../components/ui/Loader';
import VideoPlayer from '../../../../../components/ui/VideoPlayer';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { convertToYouTubeEmbed } from '../../../../../lib/videoUtils';

export default function LecturePlayer() {
    const params = useParams();
    const router = useRouter();
    const { id: courseId, lectureId } = params;

    const [course, setCourse] = useState(null);
    const [currentLecture, setCurrentLecture] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId) return;

        const fetchCourse = async () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const token = savedUser.token;

            if (!token) {
                router.push(`/login?redirect=/courses/${courseId}/lecture/${lectureId}`);
                return;
            }

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/courses/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setCourse(data);

                    // Find current lecture
                    if (data.lectures && data.lectures.length > 0) {
                        const index = lectureId === 'undefined' || !lectureId
                            ? 0
                            : data.lectures.findIndex(l => l._id?.toString() === lectureId);

                        const actualIndex = index >= 0 ? index : parseInt(lectureId) || 0;
                        setCurrentIndex(actualIndex);
                        setCurrentLecture(data.lectures[actualIndex]);
                    }
                }
            } catch (error) {
                console.error('Failed to load course', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
        fetchCourse();
    }, [courseId, lectureId, router]);

    // Scroll to top when lecture changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [lectureId]);

    const navigateLecture = (direction) => {
        if (!course || !course.lectures) return;

        const newIndex = direction === 'next'
            ? Math.min(currentIndex + 1, course.lectures.length - 1)
            : Math.max(currentIndex - 1, 0);

        setCurrentIndex(newIndex);
        setCurrentLecture(course.lectures[newIndex]);

        const newLectureId = course.lectures[newIndex]._id || newIndex;
        router.push(`/courses/${courseId}/lecture/${newLectureId}`);
    };

    if (loading) return <Loader />;
    if (!course || !currentLecture) return <div className="container" style={{ paddingTop: '40px' }}>Lecture not found</div>;

    return (
        <div style={{ background: '#000', minHeight: '100vh', paddingTop: '10px' }}>
            {/* Main Content Grid */}
            <div className="lecture-layout">

                {/* Left Column: Video Player */}
                <div>
                    <div style={{ marginBottom: '16px' }}>
                        <Link href={`/courses/${courseId}`}>
                            <Button variant="outline" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
                                <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                                Back to Course
                            </Button>
                        </Link>
                    </div>

                    <Card style={{ padding: '0', overflow: 'hidden', background: '#000', border: '1px solid #333' }}>
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                            {!currentLecture.videoUrl ? (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    Video Unavailable
                                </div>
                            ) : currentLecture.videoUrl.includes('youtube.com') || currentLecture.videoUrl.includes('youtu.be') ? (
                                <iframe
                                    src={convertToYouTubeEmbed(currentLecture.videoUrl)}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={currentLecture.title || 'Lecture Video'}
                                />
                            ) : (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                                    <VideoPlayer
                                        src={`${currentLecture.videoUrl}?token=${JSON.parse(localStorage.getItem('user') || '{}').token}`}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>

                    <div style={{ marginTop: '20px' }}>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'white' }}>{currentLecture.title || 'Untitled Lecture'}</h2>
                        <p style={{ color: '#aaa' }}>Lecture {currentIndex + 1} of {course.lectures.length}</p>
                    </div>
                </div>

                {/* Right Column: Details & Navigation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Navigation Buttons */}
                    <Card style={{ padding: '20px', backgroundColor: '#111', border: '1px solid #333' }}>
                        <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '1.1rem' }}>Navigation</h3>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                            <Button
                                variant="outline"
                                onClick={() => navigateLecture('prev')}
                                disabled={currentIndex === 0}
                                style={{ flex: 1, opacity: currentIndex === 0 ? 0.5 : 1 }}
                            >
                                ← Prev
                            </Button>
                            <Button
                                onClick={() => navigateLecture('next')}
                                disabled={currentIndex === course.lectures.length - 1}
                                style={{ flex: 1, opacity: currentIndex === course.lectures.length - 1 ? 0.5 : 1 }}
                            >
                                Next →
                            </Button>
                        </div>
                    </Card>

                    {/* Lecture List */}
                    <Card style={{ padding: '0', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', backgroundColor: '#111', border: '1px solid #333' }} className="custom-scrollbar">
                        <div style={{ padding: '16px', borderBottom: '1px solid #333', position: 'sticky', top: 0, background: '#111', zIndex: 1 }}>
                            <h3 style={{ fontSize: '1.1rem', color: 'white', margin: 0 }}>Course Content</h3>
                        </div>
                        <div style={{ padding: '12px' }}>
                            {course.lectures.map((lecture, index) => (
                                <div
                                    key={index}
                                    onClick={() => {
                                        setCurrentIndex(index);
                                        setCurrentLecture(lecture);
                                        router.push(`/courses/${courseId}/lecture/${lecture._id || index}`);
                                    }}
                                    style={{
                                        padding: '12px',
                                        marginBottom: '8px',
                                        background: index === currentIndex ? '#2563eb' : 'rgba(255,255,255,0.05)',
                                        color: index === currentIndex ? 'white' : '#cbd5e1',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'all 0.2s',
                                        border: index === currentIndex ? 'none' : '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <PlayCircle size={16} style={{ flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: '1.4', display: 'block' }}>
                                            {index + 1}. {lecture.title || 'Untitled Lecture'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
