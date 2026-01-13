'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Button from '../../../../../components/ui/Button';
import Card from '../../../../../components/ui/Card';
import Loader from '../../../../../components/ui/Loader';
import { convertToYouTubeEmbed } from '../../../../../lib/videoUtils';
import {
    Clock, CheckCircle, XCircle, AlertCircle, Maximize, Minimize,
    Globe, Smartphone, Monitor, FileText, ChevronRight, LayoutGrid,
    Bookmark, RotateCcw, Flag
} from 'lucide-react';
import VideoPlayer from '../../../../../components/ui/VideoPlayer';

export default function MockTestPage() {
    const params = useParams();
    const { id, testId } = params;
    const router = useRouter();

    const [course, setCourse] = useState(null);
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previousResult, setPreviousResult] = useState(null);
    const [viewMode, setViewMode] = useState('');  // 'instructions', 'test', 'result', 'previousResult'

    // Flow State
    const [showInstructionModal, setShowInstructionModal] = useState(false);
    const [instructionChecked, setInstructionChecked] = useState(false);

    // Test taking state
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(180 * 60);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [normalizedScore, setNormalizedScore] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [markedForReview, setMarkedForReview] = useState(new Set());
    const [viewedQuestions, setViewedQuestions] = useState(new Set([0]));
    const [zoomedImage, setZoomedImage] = useState(null);

    const testContainerRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const token = savedUser.token;

            try {
                // Fetch Test Data
                const testRes = await fetch(`${API_URL}/api/mock-tests/${testId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!testRes.ok) throw new Error('Failed to fetch test');
                const testData = await testRes.json();
                setTest(testData);

                if (testData.durationMinutes) {
                    setTimeRemaining(testData.durationMinutes * 60);
                }

                // Fetch Course Data for Image
                const courseRes = await fetch(`${API_URL}/api/courses/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (courseRes.ok) {
                    const courseData = await courseRes.json();
                    setCourse(courseData);
                }

                const resultRes = await fetch(`${API_URL}/api/users/me/mock-test-results/${testId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (resultRes.ok) {
                    const resultData = await resultRes.json();
                    setPreviousResult(resultData);
                    setViewMode('previousResult');
                } else {
                    setViewMode('instructions');
                }
            } catch (error) {
                console.error(error);
                setViewMode('instructions');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [testId]);

    // Timer countdown
    useEffect(() => {
        if (viewMode !== 'test' || submitted) return;

        const enterFullScreen = async () => {
            try {
                if (testContainerRef.current && !document.fullscreenElement) {
                    await testContainerRef.current.requestFullscreen();
                }
            } catch (err) {
                console.log("Full screen request failed:", err);
            }
        };
        enterFullScreen();

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [viewMode, submitted]);

    // Track viewed questions
    useEffect(() => {
        if (viewMode === 'test') {
            setViewedQuestions(prev => new Set(prev).add(currentQuestion));
        }
    }, [currentQuestion, viewMode]);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            testContainerRef.current?.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')} : ${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (optionIndex) => {
        if (submitted) return;
        setAnswers({ ...answers, [currentQuestion]: optionIndex });
    };

    const toggleMarkForReview = () => {
        const newSet = new Set(markedForReview);
        if (newSet.has(currentQuestion)) {
            newSet.delete(currentQuestion);
        } else {
            newSet.add(currentQuestion);
        }
        setMarkedForReview(newSet);
    };

    const clearSelection = () => {
        const newAnswers = { ...answers };
        delete newAnswers[currentQuestion];
        setAnswers(newAnswers);
    };

    const calculateScore = () => {
        if (!test) return { raw: 0, normalized: 0 };
        let rawScore = 0;
        test.questions.forEach((q, index) => {
            if (answers[index] !== undefined) {
                if (answers[index] === q.correctOptionIndex) {
                    rawScore += 4;
                } else {
                    rawScore -= 1;
                }
            }
        });
        const maxPossible = test.questions.length * 4;
        const normalized = Math.max(0, Math.min(10, (rawScore / maxPossible) * 10));
        return { raw: rawScore, normalized: parseFloat(normalized.toFixed(2)) };
    };

    const handleSubmit = async () => {
        if (!test) return;
        if (document.fullscreenElement) document.exitFullscreen().catch(console.error);

        const { raw, normalized } = calculateScore();
        setScore(raw);
        setNormalizedScore(normalized);
        setSubmitted(true);
        setViewMode('result');

        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        try {
            await fetch(`${API_URL}/api/mock-tests/${testId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${savedUser.token}`
                },
                body: JSON.stringify({
                    score: raw,
                    totalMarks: test.questions.length * 4,
                    normalizedScore: normalized,
                    totalQuestions: test.questions.length,
                    answers: answers
                })
            });
        } catch (error) {
            console.error('Failed to save result', error);
        }
    };

    const handleRetake = () => {
        setAnswers({});
        setCurrentQuestion(0);
        setTimeRemaining((test?.durationMinutes || 180) * 60);
        setSubmitted(false);
        setScore(0);
        setMarkedForReview(new Set());
        setViewedQuestions(new Set([0]));
        setViewMode('instructions');
        setPreviousResult(null);
    };

    const startTest = () => {
        setShowInstructionModal(false);
        setViewMode('test');
    };

    // Helper for images
    const renderQuestionImage = (imgUrl) => (
        <div
            style={{
                marginTop: '20px',
                marginBottom: '20px',
                position: 'relative',
                display: 'inline-block',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer'
            }}
            onClick={() => setZoomedImage(imgUrl)}
        >
            <img
                src={imgUrl}
                alt="Question"
                style={{
                    maxHeight: '250px',
                    maxWidth: '100%',
                    display: 'block',
                    objectFit: 'contain'
                }}
            />
            <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '6px',
                borderRadius: '6px',
                opacity: 0.8
            }}>
                <Maximize size={16} />
            </div>
        </div>
    );

    if (loading) return <Loader />;
    if (!test) return <div className="container" style={{ paddingTop: '40px' }}>Test not found</div>;

    // --- RENDER: Instructions Page ---
    if (viewMode === 'instructions') {
        const InstructionItem = ({ title, items }) => (
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>{title}</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {items.map((item, i) => (
                        <li key={i} style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            <span style={{ fontSize: '1.2rem', lineHeight: '1', marginTop: '-2px' }}>•</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );


        return (
            <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '1200px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, padding: '8px 40px', background: '#fbbf24', color: 'white', fontWeight: 'bold', transform: 'rotate(-45deg) translate(-28%, -100%)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>MOCK EXAM</div>

                <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1.5fr', gap: '48px', alignItems: 'start' }}>
                    {/* Left Card */}
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ height: '200px', position: 'relative' }}>
                            <img
                                src={course?.thumbnail || "/university-bg-pattern.png"}
                                alt={course?.title || "Course"}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', padding: '20px', color: 'white' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '500', opacity: 0.9 }}>{course?.title}</span>
                            </div>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px', color: '#0f172a' }}>{test.title}</h1>

                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Clock size={20} color="#64748b" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.05em' }}>DURATION OF EXAM</p>
                                        <p style={{ fontWeight: '600', color: '#334155' }}>{test.duration ? `${test.duration} minutes` : '180 minutes'}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Monitor size={20} color="#64748b" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.05em' }}>DEVICE REQUIREMENTS</p>
                                        <p style={{ fontWeight: '600', color: '#334155' }}>Recommended: Laptops and PCs</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={20} color="#64748b" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.05em' }}>ATTEMPT LEFT</p>
                                        <p style={{ fontWeight: '600', color: '#334155' }}>Unlimited</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => setShowInstructionModal(true)}
                                style={{ width: '100%', marginTop: '32px', background: '#2563eb', padding: '16px', fontSize: '1rem', borderRadius: '8px' }}
                            >
                                Start Exam &rarr;
                            </Button>
                        </div>
                    </div>

                    {/* Right Instructions */}
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '32px', color: '#0f172a' }}>Instructions</h2>

                        <InstructionItem
                            title="Scoring Mechanism"
                            items={[
                                <span>The <span style={{ background: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fdba74', fontSize: '0.85rem' }}>All Questions</span> are mandatory to attempt.</span>,
                                <span>Each correct answer earns <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>+4 marks</span>, while each incorrect answer deducts <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>-1 marks</span>.</span>,
                                `The test duration is ${test.duration ? test.duration : 180} minutes, with a total of ${test.totalQuestions} questions.`
                            ]}
                        />

                        <InstructionItem
                            title="Invigilation Instructions (This is just to give you actual NSAT feel, ignore it)"
                            items={[
                                "Test the proctoring environment before starting the exam to ensure smooth functioning.",
                                "Stay in full-screen mode throughout the test. Close all other tabs and refrain from switching tabs.",
                                "Using a calculator, mobile phone, or unauthorized device may result in severe consequences.",
                                "Do not exit full-screen mode and sit in a well-lit, quiet area where your face is clearly visible.",
                                "Ensure your face is clearly visible within the camera frame at all times."
                            ]}
                        />
                    </div>
                </div>

                {/* MODAL */}
                {showInstructionModal && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}>
                        <div style={{ background: 'white', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
                            <button onClick={() => setShowInstructionModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none' }}>
                                <XCircle size={24} color="#94a3b8" />
                            </button>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px' }}>Instructions</h2>

                            <InstructionItem
                                title="Scoring Mechanism"
                                items={[
                                    "All Questions are mandatory.",
                                    "Correct: +4 marks, Incorrect: -1 marks.",
                                    `Duration: ${test.duration ? test.duration : 180} minutes.`
                                ]}
                            />

                            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '24px' }}>
                                    <input
                                        type="checkbox"
                                        checked={instructionChecked}
                                        onChange={(e) => setInstructionChecked(e.target.checked)}
                                        style={{ width: '20px', height: '20px', accentColor: '#2563eb' }}
                                    />
                                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>I have read and understood the instructions</span>
                                </label>

                                <Button
                                    onClick={startTest}
                                    disabled={!instructionChecked}
                                    style={{ width: '100%', background: instructionChecked ? '#1e293b' : '#cbd5e1', cursor: instructionChecked ? 'pointer' : 'not-allowed' }}
                                >
                                    Start Exam &rarr;
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER: Test Interface ---
    if (viewMode === 'test' && !submitted) {
        const currentQ = test.questions[currentQuestion];
        const isMarked = markedForReview.has(currentQuestion);
        const isAnswered = answers[currentQuestion] !== undefined;

        return (
            <div ref={testContainerRef} style={{ background: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {/* Top Bar */}
                <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 50, flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{test.title}</h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ padding: '8px 16px', background: '#f8fafc', borderRadius: '8px', fontWeight: '700', fontSize: '1.2rem', color: '#0f172a', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} color="#64748b" />
                            {formatTime(timeRemaining)}
                        </div>
                        <Button
                            onClick={handleSubmit}
                            style={{ background: '#10b981', padding: '8px 16px', fontSize: '0.9rem' }}
                        >
                            Submit
                        </Button>
                    </div>
                </div>

                {/* Main Content: Split Question & Options */}
                <div className="responsive-grid" style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', alignItems: 'start' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Section Title & Controls */}
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>General Section</h2>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button variant="outline" onClick={toggleMarkForReview} style={{ gap: '8px', color: isMarked ? '#7c3aed' : '#64748b' }}>
                                    <Flag size={16} fill={isMarked ? "currentColor" : "none"} /> <span className="desktop-only" style={{ display: 'inline' }}>Mark for Review</span>
                                </Button>
                                <Button variant="outline" onClick={clearSelection} style={{ gap: '8px', color: '#ef4444' }}>
                                    <RotateCcw size={16} /> <span className="desktop-only" style={{ display: 'inline' }}>Clear Selection</span>
                                </Button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '40px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Question {currentQuestion + 1} / {test.questions.length}</span>
                            <div style={{ marginTop: '16px', fontSize: '1.25rem', lineHeight: '1.6', fontWeight: '500', color: '#1e293b' }}>
                                {currentQ.questionText}
                            </div>
                            {currentQ.image && renderQuestionImage(currentQ.image)}
                        </div>

                        {/* Options Cards */}
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {currentQ.options.map((option, idx) => {
                                const isSelected = answers[currentQuestion] === idx;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleOptionSelect(idx)}
                                        style={{
                                            padding: '20px',
                                            borderRadius: '12px',
                                            border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                                            background: isSelected ? '#eff6ff' : 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '20px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            background: isSelected ? '#2563eb' : '#f1f5f9',
                                            color: isSelected ? 'white' : '#64748b',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold',
                                            flexShrink: 0
                                        }}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span style={{ fontSize: '1rem', color: '#334155' }}>{option}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bottom Nav for Questions */}
                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                            <Button
                                onClick={() => setCurrentQuestion(p => Math.max(0, p - 1))}
                                disabled={currentQuestion === 0}
                                variant="outline"
                            >
                                &larr; Previous
                            </Button>
                            <Button
                                onClick={() => setCurrentQuestion(p => Math.min(test.questions.length - 1, p + 1))}
                                disabled={currentQuestion === test.questions.length - 1}
                                style={{ background: '#1e293b' }}
                            >
                                Next &rarr;
                            </Button>
                        </div>
                    </div>

                    {/* Right Sidebar: Palette */}
                    <div style={{
                        background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0',
                        display: 'flex', flexDirection: 'column', gap: '20px',
                        position: 'sticky', top: '100px'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Question Palette</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                            {test.questions.map((_, idx) => {
                                const isCurr = idx === currentQuestion;
                                const isAns = answers[idx] !== undefined;
                                const isMark = markedForReview.has(idx);
                                const isView = viewedQuestions.has(idx);

                                let bg = 'white';
                                let border = '#e2e8f0';
                                let color = '#64748b';

                                if (isCurr) {
                                    border = '#2563eb';
                                    color = '#2563eb';
                                    bg = 'white';
                                } else if (isMark) {
                                    bg = '#f3e8ff';
                                    border = '#a855f7';
                                    color = '#7e22ce';
                                } else if (isAns) {
                                    bg = '#dcfce7';
                                    border = '#22c55e';
                                    color = '#15803d';
                                } else if (isView) {
                                    bg = '#ffedd5';
                                    border = '#fdba74';
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentQuestion(idx)}
                                        style={{
                                            width: '100%', aspectRatio: '1', borderRadius: '8px',
                                            border: `2px solid ${border}`,
                                            background: bg,
                                            color: color,
                                            fontWeight: '600',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: '#dcfce7', border: '1px solid #22c55e', borderRadius: '50%' }}></div> Attempted</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: '#f3e8ff', border: '1px solid #a855f7', borderRadius: '50%' }}></div> Marked</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: '#ffedd5', border: '1px solid #fdba74', borderRadius: '50%' }}></div> Viewed</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%' }}></div> Skipped</div>
                        </div>

                        <Button onClick={handleSubmit} style={{ width: '100%', background: '#10b981', marginTop: '12px' }}>Submit Test</Button>
                    </div>
                </div>

                {/* ZOOM MODAL */}
                {zoomedImage && (
                    <div
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
                        }}
                        onClick={() => setZoomedImage(null)}
                    >
                        <img
                            src={zoomedImage}
                            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
                            alt="Full Size"
                        />
                        <button
                            onClick={() => setZoomedImage(null)}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}
                        >
                            <XCircle size={40} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER: Detailed Result Review ---
    if (viewMode === 'result' || viewMode === 'previousResult') {
        const resultToDisplay = viewMode === 'previousResult' ? previousResult : {
            score: score,
            normalizedScore: normalizedScore,
            answers: answers
        };
        const currentQ = test.questions[currentQuestion];
        const userAnswerIndex = (resultToDisplay?.answers || {})[currentQuestion];
        const isCorrect = currentQ && userAnswerIndex === currentQ.correctOptionIndex;
        const isSkipped = userAnswerIndex === undefined;

        // Calculate progress stats
        const totalQ = test.questions.length;
        const totalScore = totalQ * 4;
        const userScore = resultToDisplay.score;

        return (
            <div className="container" style={{ paddingTop: '40px', paddingLeft: '20px', paddingRight: '20px', maxWidth: '1400px', paddingBottom: '80px' }}>

                {/* Header Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <Button variant="outline" onClick={() => router.push(`/courses/${id}`)} style={{ marginBottom: '16px', gap: '8px' }}>
                            <ChevronRight style={{ transform: 'rotate(180deg)' }} size={16} /> Back to Course
                        </Button>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>Test Results</h1>
                    </div>
                    <div style={{ textAlign: 'right', background: 'white', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2563eb', lineHeight: '1' }}>
                            {userScore} <span style={{ fontSize: '1.25rem', color: '#64748b' }}>/ {totalScore}</span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', marginTop: '4px' }}>Total Score</p>
                    </div>
                </div>

                <div className="responsive-grid" style={{ gridTemplateColumns: 'minmax(0, 3fr) 1fr', gap: '32px', alignItems: 'start' }}>

                    {/* Main Question Review */}
                    <div style={{ minWidth: 0 }}>
                        <Card className="modern-card" style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                                <span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>
                                    Question {currentQuestion + 1}
                                </span>
                                <span style={{
                                    padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px',
                                    background: isCorrect ? '#dcfce7' : isSkipped ? '#f1f5f9' : '#fee2e2',
                                    color: isCorrect ? '#166534' : isSkipped ? '#64748b' : '#991b1b'
                                }}>
                                    {isCorrect ? <CheckCircle size={16} /> : isSkipped ? <AlertCircle size={16} /> : <XCircle size={16} />}
                                    {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                                </span>
                            </div>

                            <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', lineHeight: '1.6', color: '#1e293b' }}>
                                {currentQ.questionText}
                            </h2>
                            {currentQ.image && renderQuestionImage(currentQ.image)}

                            <div style={{ display: 'grid', gap: '16px', marginTop: '32px' }}>
                                {currentQ.options.map((option, idx) => {
                                    const isSelected = userAnswerIndex === idx;
                                    const isCorrectOpt = idx === currentQ.correctOptionIndex;

                                    let borderColor = '#e2e8f0';
                                    let bg = 'white';
                                    let icon = null;

                                    if (isCorrectOpt) {
                                        borderColor = '#22c55e';
                                        bg = '#f0fdf4';
                                        icon = <CheckCircle size={20} color="#16a34a" />;
                                    } else if (isSelected && !isCorrectOpt) {
                                        borderColor = '#ef4444';
                                        bg = '#fef2f2';
                                        icon = <XCircle size={20} color="#dc2626" />;
                                    } else if (isSelected) {
                                        borderColor = '#22c55e';
                                        bg = '#f0fdf4';
                                        icon = <CheckCircle size={20} color="#16a34a" />;
                                    }

                                    return (
                                        <div key={idx} style={{
                                            padding: '16px', border: `2px solid ${borderColor}`, background: bg, borderRadius: '12px',
                                            display: 'flex', gap: '16px', alignItems: 'center'
                                        }}>
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '6px',
                                                background: isCorrectOpt ? '#16a34a' : (isSelected && !isCorrectOpt) ? '#dc2626' : '#f1f5f9',
                                                color: (isCorrectOpt || (isSelected && !isCorrectOpt)) ? 'white' : '#64748b',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0
                                            }}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <div style={{ flex: 1, fontSize: '1rem', color: '#334155' }}>{option}</div>
                                            {icon}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentQuestion(p => Math.max(0, p - 1))}
                                disabled={currentQuestion === 0}
                                style={{ background: 'white' }}
                            >
                                &larr; Previous Question
                            </Button>
                            <Button
                                onClick={() => setCurrentQuestion(p => Math.min(test.questions.length - 1, p + 1))}
                                disabled={currentQuestion === test.questions.length - 1}
                                style={{ background: '#1e293b' }}
                            >
                                Next Question &rarr;
                            </Button>
                        </div>
                    </div>

                    {/* Result Sidebar: Palette & Video */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Card className="modern-card" style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '16px' }}>Question Overview</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                {test.questions.map((q, idx) => {
                                    const ans = (resultToDisplay?.answers || {})[idx];
                                    const isCorr = ans === q.correctOptionIndex;
                                    const isSkp = ans === undefined;
                                    const isCurr = idx === currentQuestion;

                                    let bg = isSkp ? '#f1f5f9' : isCorr ? '#dcfce7' : '#fee2e2';
                                    let color = isSkp ? '#64748b' : isCorr ? '#166534' : '#991b1b';
                                    let border = isCurr ? '2px solid #2563eb' : '1px solid transparent';

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentQuestion(idx)}
                                            style={{
                                                width: '100%', aspectRatio: '1', borderRadius: '6px', background: bg, color: color,
                                                border: border, fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#dcfce7', borderRadius: '50%' }}></div> Correct</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#fee2e2', borderRadius: '50%' }}></div> Incorrect</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#f1f5f9', borderRadius: '50%' }}></div> Skipped</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                <Button onClick={handleRetake} style={{ width: '100%' }}>Retake Test</Button>
                            </div>
                        </Card>

                        {/* Video Solution in Sidebar */}
                        {test.videoSolutionUrl && (
                            <Card className="modern-card" style={{ padding: '20px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Monitor size={18} /> Video Solution
                                </h3>
                                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', background: '#000' }}>
                                    {test.videoSolutionUrl.includes('youtube') || test.videoSolutionUrl.includes('youtu.be') ? (
                                        <iframe
                                            src={convertToYouTubeEmbed(test.videoSolutionUrl)}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                            frameBorder="0" allowFullScreen
                                        />
                                    ) : (
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                                            <VideoPlayer src={`${test.videoSolutionUrl}?token=${JSON.parse(localStorage.getItem('user') || '{}').token}`} />
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                {/* ZOOM MODAL */}
                {zoomedImage && (
                    <div
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
                        }}
                        onClick={() => setZoomedImage(null)}
                    >
                        <img
                            src={zoomedImage}
                            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
                            alt="Full Size"
                        />
                        <button
                            onClick={() => setZoomedImage(null)}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}
                        >
                            <XCircle size={40} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return null;
}
