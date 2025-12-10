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
    }, [courseId, lectureId, router]);

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
        <div style={{ background: '#000', minHeight: '100vh', paddingTop: '70px' }}>
            {/* Video Player */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                    <Link href={`/courses/${courseId}`}>
                        <Button variant="outline" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
                            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                            Back to Course
                        </Button>
                    </Link>
                </div>

                {/* Main Video Player */}
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

                {/* Lecture Info */}
                <div className="responsive-grid" style={{ marginTop: '20px', color: 'white' }}>
                    <Card style={{ padding: '24px', backgroundColor: '#111', border: '1px solid #333' }}>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'white' }}>{currentLecture.title || 'Untitled Lecture'}</h2>
                        <p style={{ color: '#aaa', marginBottom: '16px' }}>
                            Lecture {currentIndex + 1} of {course.lectures.length}
                        </p>

                        {/* Navigation */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <Button
                                variant="outline"
                                onClick={() => navigateLecture('prev')}
                                disabled={currentIndex === 0}
                                style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}
                            >
                                ← Previous Lecture
                            </Button>
                            <Button
                                onClick={() => navigateLecture('next')}
                                disabled={currentIndex === course.lectures.length - 1}
                                style={{ opacity: currentIndex === course.lectures.length - 1 ? 0.5 : 1 }}
                            >
                                Next Lecture →
                            </Button>
                        </div>
                    </Card>

                    {/* Lecture List */}
                    <Card style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Course Content</h3>
                        <div style={{ display: 'grid', gap: '8px' }}>
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
                                        background: index === currentIndex ? '#2563eb' : '#f8fafc',
                                        color: index === currentIndex ? 'white' : '#0f172a',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <PlayCircle size={18} />
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{index + 1}. {lecture.title || 'Untitled Lecture'}</span>
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
