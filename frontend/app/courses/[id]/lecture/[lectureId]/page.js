'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL, apiFetch } from '@/lib/api';
import Button from '../../../../../components/ui/Button';
import Card from '../../../../../components/ui/Card';
import { VideoSkeleton } from '../../../../../components/ui/Skeleton';
import VideoPlayer from '../../../../../components/ui/VideoPlayer';
import BunnyPlayer from '../../../../../components/ui/BunnyPlayer';
import { ArrowLeft, PlayCircle, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import { convertToYouTubeEmbed, isIframeVideo, isBunnyVideo } from '../../../../../lib/videoUtils';
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('../../../../../components/PdfViewer'), {
    ssr: false,
    loading: () => <div className="text-white p-8 text-center">Loading PDF Support...</div>
});

export default function LecturePlayer() {
    const params = useParams();
    const router = useRouter();
    const { id: courseId, lectureId } = params;

    const [course, setCourse] = useState(null);
    const [currentLecture, setCurrentLecture] = useState(null);
    const [allLectures, setAllLectures] = useState([]); // Flattened list for easy navigation
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState({});
    const [isPlaying, setIsPlaying] = useState(false);
    const iframeRef = useRef(null);
    const [userDetails, setUserDetails] = useState(null);
    const [completedLectures, setCompletedLectures] = useState(new Set());

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserDetails(user);
    }, []);

    // Handle keyboard events - focus the iframe for player's built-in keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                // Focus the iframe so the Bunny.net player can receive the spacebar
                if (iframeRef.current) {
                    iframeRef.current.focus();
                    // The player will handle play/pause internally
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Auto-rotate to landscape when video goes fullscreen on mobile
    useEffect(() => {
        const handleFullscreenChange = () => {
            try {
                if (document.fullscreenElement) {
                    // Entering fullscreen — lock to landscape
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock('landscape').catch(() => {
                            // Silently fail if not supported (e.g. desktop browsers)
                        });
                    }
                } else {
                    // Exiting fullscreen — unlock orientation
                    if (screen.orientation && screen.orientation.unlock) {
                        screen.orientation.unlock();
                    }
                }
            } catch (e) {
                // screen.orientation API not available
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        if (!courseId) return;

        const fetchCourse = async () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (!savedUser.token) {
                router.push(`/login?redirect=/courses/${courseId}/lecture/${lectureId}`);
                return;
            }

            try {
                // apiFetch auto-handles 401 → logout + redirect
                const res = await apiFetch(`/api/courses/${courseId}`);

                if (res.ok) {
                    const data = await res.json();
                    setCourse(data);

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

                    if (flattened.length > 0) {
                        const found = flattened.find(l => l._id?.toString() === lectureId);
                        setCurrentLecture(found || flattened[0]);
                    }

                    // Fetch progress (also uses apiFetch for auto-401 handling)
                    apiFetch(`/api/progress/${courseId}`)
                        .then(r => r.ok ? r.json() : null)
                        .then(progressData => {
                            if (progressData?.completedLectures) {
                                setCompletedLectures(new Set(progressData.completedLectures.map(id => id.toString())));
                            }
                        }).catch(() => {});
                }
            } catch (error) {
                // apiFetch throws on 401 → user gets redirected to login
                if (!error.message.includes('Session expired')) {
                    console.error('Failed to load course', error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();

        // Listen for completion events from BunnyPlayer (to update sidebar checkmarks in real-time)
        const handleCompletionMessage = (event) => {
            // BunnyPlayer fires a custom event when the progress API is called
            if (event.data?.type === 'lectureCompleted' && event.data?.lectureId) {
                setCompletedLectures(prev => new Set([...prev, event.data.lectureId.toString()]));
            }
        };
        window.addEventListener('message', handleCompletionMessage);
        return () => window.removeEventListener('message', handleCompletionMessage);

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

    if (loading) return (
        <div style={{ background: '#000', minHeight: '100vh', paddingTop: '80px' }}>
            <div className="lecture-layout">
                <VideoSkeleton />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Card style={{ height: '120px', background: '#111', border: '1px solid #333' }} />
                    <Card style={{ height: '400px', background: '#111', border: '1px solid #333' }} />
                </div>
            </div>
        </div>
    );
    if (!course || !currentLecture) return <div className="container" style={{ paddingTop: '40px', color: 'white' }}>Lecture not found</div>;

    // FULL SCREEN PDF LAYOUT
    if (currentLecture.type === 'pdf') {
        return (
            <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col h-[100dvh]">
                <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700 shadow-md z-10 shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Link href={`/courses/${courseId}`}>
                            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors" style={{ width: '32px', height: '32px', borderRadius: '10%' }}>
                                <ArrowLeft size={18} />
                            </button>
                        </Link>
                        <div className="flex flex-col overflow-hidden">
                            <h1 className="text-white text-sm md:text-base font-medium truncate">{currentLecture.title}</h1>
                        </div>
                    </div>
                </div>

                {/* PDF Viewer Container */}
                <div className="flex-1 relative bg-gray-900 overflow-hidden" style={{ height: '100%' }}>
                    <PdfViewer
                        url={currentLecture.pdfUrl}
                        userDetails={userDetails}
                    />
                </div>
            </div>
        );
    }

    // STANDARD VIDEO LAYOUT
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
                        <div className="video-container">
                            {!currentLecture.videoUrl ? (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    Video Unavailable
                                </div>
                            ) : isBunnyVideo(currentLecture.videoUrl) ? (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                                    <BunnyPlayer
                                        src={currentLecture.videoUrl}
                                        lectureId={currentLecture._id}
                                    />
                                </div>
                            ) : isIframeVideo(currentLecture.videoUrl) ? (
                                <iframe
                                    ref={iframeRef}
                                    id="video-player"
                                    src={convertToYouTubeEmbed(currentLecture.videoUrl)}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
                                    allowFullScreen
                                    loading="lazy"
                                    tabIndex="0"
                                    playsInline
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
                                Previous
                            </Button>
                            <Button
                                onClick={() => navigateLecture('next')}
                                disabled={getCurrentIndex() === allLectures.length - 1}
                                style={{ flex: 1, opacity: getCurrentIndex() === allLectures.length - 1 ? 0.5 : 1 }}
                            >
                                Next
                            </Button>
                        </div>
                    </Card>

                    {/* Lecture List */}
                    <Card style={{ padding: '0', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', backgroundColor: '#111', border: '1px solid #333' }} className="custom-scrollbar">
                        <div style={{ padding: '16px', borderBottom: '1px solid #333', position: 'sticky', top: 0, background: '#111', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: completedLectures.size > 0 ? '10px' : '0' }}>
                                <h3 style={{ fontSize: '1.1rem', color: 'white', margin: 0 }}>Course Content</h3>
                                {completedLectures.size > 0 && (
                                    <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>
                                        {completedLectures.size} completed
                                    </span>
                                )}
                            </div>
                            {completedLectures.size > 0 && (() => {
                                const bunnyCount = allLectures.filter(l => isBunnyVideo(l.videoUrl)).length || 1;
                                const pct = Math.min(100, Math.round((completedLectures.size / bunnyCount) * 100));
                                return (
                                    <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                                    </div>
                                );
                            })()}
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
                                                        >
                                                            {completedLectures.has(lecture._id?.toString()) ? (
                                                                <CheckCircle size={14} style={{ flexShrink: 0, color: '#22c55e' }} />
                                                            ) : (
                                                                <PlayCircle size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                                                            )}
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
                                                {completedLectures.has(lecture._id?.toString()) ? (
                                                    <CheckCircle size={14} style={{ flexShrink: 0, color: '#22c55e' }} />
                                                ) : (
                                                    <PlayCircle size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                                                )}
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
