'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import Button from '../../../../../components/ui/Button';
import Card from '../../../../../components/ui/Card';
import Loader from '../../../../../components/ui/Loader';
import VideoPlayer from '../../../../../components/ui/VideoPlayer';
import { ArrowLeft, PlayCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { convertToYouTubeEmbed } from '../../../../../lib/videoUtils';

export default function LecturePlayer() {
    const params = useParams();
    const router = useRouter();
    const { id: courseId, lectureId } = params;

    const [course, setCourse] = useState(null);
    const [currentLecture, setCurrentLecture] = useState(null);
    const [allLectures, setAllLectures] = useState([]); // Flattened list for easy navigation
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState({});

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
                const res = await fetch(`${API_URL}/api/courses/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setCourse(data);

                    // Flatten lectures: Sections first (ordered), then Ungrouped
                    // OR: Ungrouped first? Usually sections are the main content.
                    // Let's do: Sections... then Ungrouped.
                    let flattened = [];

                    if (data.sections) {
                        data.sections.forEach(section => {
                            if (section.lectures) flattened.push(...section.lectures);
                        });
                    }
                    if (data.lectures) {
                        flattened.push(...data.lectures);
                    }

                    setAllLectures(flattened);

                    // Find current lecture
                    if (flattened.length > 0) {
                        const found = flattened.find(l => l._id?.toString() === lectureId);
                        setCurrentLecture(found || flattened[0]);
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

    // Expand section containing current lecture when loaded
    useEffect(() => {
        if (currentLecture && course?.sections) {
            const activeSection = course.sections.find(s => s.lectures?.some(l => l._id === currentLecture._id));
            if (activeSection) {
                setExpandedSections(prev => ({ ...prev, [activeSection._id]: true }));
            }
        }
    }, [currentLecture, course]);

    // Scroll to top when lecture changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [lectureId]);

    const navigateLecture = (direction) => {
        if (!allLectures.length || !currentLecture) return;

        const currentIndex = allLectures.findIndex(l => l._id === currentLecture._id);
        if (currentIndex === -1) return;

        const newIndex = direction === 'next'
            ? Math.min(currentIndex + 1, allLectures.length - 1)
            : Math.max(currentIndex - 1, 0);

        const nextLecture = allLectures[newIndex];
        setCurrentLecture(nextLecture);
        router.push(`/courses/${courseId}/lecture/${nextLecture._id}`);
    };

    // Helper to get index for UI
    const getCurrentIndex = () => {
        if (!allLectures.length || !currentLecture) return 0;
        return allLectures.findIndex(l => l._id === currentLecture._id);
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
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
                        <p style={{ color: '#aaa' }}>Lecture {getCurrentIndex() + 1} of {allLectures.length}</p>
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
                                disabled={getCurrentIndex() === 0}
                                style={{ flex: 1, opacity: getCurrentIndex() === 0 ? 0.5 : 1 }}
                            >
                                ← Prev
                            </Button>
                            <Button
                                onClick={() => navigateLecture('next')}
                                disabled={getCurrentIndex() === allLectures.length - 1}
                                style={{ flex: 1, opacity: getCurrentIndex() === allLectures.length - 1 ? 0.5 : 1 }}
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
                            {/* Sections */}
                            {course.sections && course.sections.map(section => {
                                const isExpanded = !!expandedSections[section._id];
                                return (
                                    <div key={section._id} style={{ marginBottom: '8px' }}>
                                        {/* Section Header - Acts like a Dropdown Trigger */}
                                        <div
                                            onClick={() => toggleSection(section._id)}
                                            style={{
                                                padding: '10px 12px',
                                                marginBottom: '4px',
                                                background: 'transparent',
                                                color: '#cbd5e1',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                transition: 'all 0.2s',
                                            }}
                                            className="hover:bg-gray-800"
                                        >
                                            <div style={{ marginRight: '8px', color: '#94a3b8' }}>
                                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: '1.4', textTransform: 'uppercase' }}>
                                                {section.title}
                                            </span>
                                        </div>

                                        {/* Section Content */}
                                        {isExpanded && (
                                            <div style={{ paddingLeft: '12px' }}>
                                                {section.lectures && section.lectures.map((lecture) => {
                                                    const isActive = currentLecture?._id === lecture._id;
                                                    return (
                                                        <div
                                                            key={lecture._id}
                                                            onClick={() => {
                                                                setCurrentLecture(lecture);
                                                                router.push(`/courses/${courseId}/lecture/${lecture._id}`);
                                                            }}
                                                            style={{
                                                                padding: '10px 12px',
                                                                marginBottom: '4px',
                                                                background: isActive ? '#2563eb' : 'transparent',
                                                                color: isActive ? 'white' : '#cbd5e1',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '12px',
                                                                transition: 'all 0.2s',
                                                            }}
                                                            className={!isActive ? "hover:bg-gray-800" : ""}
                                                        >
                                                            <PlayCircle size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: '1.4' }}>
                                                                {lecture.title}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Ungrouped Lectures */}
                            {course.lectures && course.lectures.length > 0 && (
                                <div style={{ marginTop: '16px' }}>
                                    {course.sections && course.sections.length > 0 && (
                                        <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '8px' }}>
                                            Additional
                                        </h4>
                                    )}
                                    {course.lectures.map((lecture) => {
                                        const isActive = currentLecture?._id === lecture._id;
                                        return (
                                            <div
                                                key={lecture._id}
                                                onClick={() => {
                                                    setCurrentLecture(lecture);
                                                    router.push(`/courses/${courseId}/lecture/${lecture._id}`);
                                                }}
                                                style={{
                                                    padding: '10px 12px',
                                                    marginBottom: '4px',
                                                    background: isActive ? '#2563eb' : 'transparent',
                                                    color: isActive ? 'white' : '#cbd5e1',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    transition: 'all 0.2s',
                                                }}
                                                className={!isActive ? "hover:bg-gray-800" : ""}
                                            >
                                                <PlayCircle size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: '1.4' }}>
                                                    {lecture.title}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}


                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
