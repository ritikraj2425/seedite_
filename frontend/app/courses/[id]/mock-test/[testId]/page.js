'use client';

import { API_URL } from '@/lib/api';
import {
    AlertCircle,
    CheckCircle,
    ChevronRight,
    Clock,
    FileText,
    Flag,
    Maximize, Minimize,
    Monitor,
    RotateCcw,
    XCircle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import useMockTestPersistence from '../../../../../hooks/useMockTestPersistence';
import Button from '../../../../../components/ui/Button';
import Card from '../../../../../components/ui/Card';
import MarkdownRenderer from '../../../../../components/ui/MarkdownRenderer';
import Skeleton from '../../../../../components/ui/Skeleton';
import VideoPlayer from '../../../../../components/ui/VideoPlayer';
import { convertToYouTubeEmbed, isIframeVideo } from '../../../../../lib/videoUtils';

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
    const [isRestoringProgress, setIsRestoringProgress] = useState(true);

    // Ref to track current answers for timer auto-submit (avoids stale closure)
    const answersRef = useRef({});
    const timeRemainingRef = useRef(180 * 60);

    // Get userId for persistence
    const savedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
    const userId = savedUser.id || savedUser._id || 'anonymous';

    // Persistence hook
    const { saveProgress, restoreProgress, clearProgress, hasProgress } = useMockTestPersistence(userId, testId);

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

                const testDuration = (testData.duration || testData.durationMinutes || 180) * 60;

                // PRIORITY RESTORATION: Check localStorage FIRST
                const restoredProgress = restoreProgress();

                if (restoredProgress) {
                    // Check if time expired during browser closure
                    if (restoredProgress.timeExpired) {
                        // Auto-submit with saved answers
                        setAnswers(restoredProgress.answers);
                        answersRef.current = restoredProgress.answers;
                        setCurrentQuestion(restoredProgress.currentQuestion);
                        setMarkedForReview(restoredProgress.markedForReview);
                        setViewedQuestions(restoredProgress.viewedQuestions);
                        setTimeRemaining(0);
                        timeRemainingRef.current = 0;
                        // Will trigger auto-submit via timer effect
                        setViewMode('test');
                        setIsRestoringProgress(false);
                        setLoading(false);
                        return;
                    }

                    // Restore progress and resume test
                    setAnswers(restoredProgress.answers);
                    answersRef.current = restoredProgress.answers;
                    setCurrentQuestion(restoredProgress.currentQuestion);
                    setTimeRemaining(restoredProgress.timeRemaining);
                    timeRemainingRef.current = restoredProgress.timeRemaining;
                    setMarkedForReview(restoredProgress.markedForReview);
                    setViewedQuestions(restoredProgress.viewedQuestions);
                    setViewMode('test');
                    setIsRestoringProgress(false);

                    // Still fetch course for display
                    const courseRes = await fetch(`${API_URL}/api/courses/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (courseRes.ok) {
                        setCourse(await courseRes.json());
                    }
                    setLoading(false);
                    return;
                }

                // No local progress - set default timer
                setTimeRemaining(testDuration);
                timeRemainingRef.current = testDuration;
                setIsRestoringProgress(false);

                // Fetch Course Data for Image
                const courseRes = await fetch(`${API_URL}/api/courses/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (courseRes.ok) {
                    const courseData = await courseRes.json();
                    setCourse(courseData);
                }

                // Only check for previous results if NO local progress exists
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
                setIsRestoringProgress(false);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [testId, restoreProgress, id]);

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
                const newTime = prev - 1;
                timeRemainingRef.current = newTime;
                if (newTime <= 0) {
                    // CRITICAL: Use answersRef.current to avoid stale closure
                    handleSubmitWithAnswers(answersRef.current);
                    return 0;
                }
                return newTime;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [viewMode, submitted]);

    // Save progress to localStorage whenever state changes
    useEffect(() => {
        if (viewMode !== 'test' || submitted || isRestoringProgress) return;

        saveProgress({
            answers,
            currentQuestion,
            timeRemaining: timeRemainingRef.current,
            markedForReview,
            viewedQuestions
        });
    }, [answers, currentQuestion, markedForReview, viewedQuestions, viewMode, submitted, isRestoringProgress, saveProgress]);

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

    const renderSmartPreview = (content) => {
        if (content === null || content === undefined || content === '') return '';
        let str = String(content);

        // Convert escaped newlines (literal \n from database) to actual newlines
        str = str.replace(/\\n/g, '\n');

        // If already has markdown code blocks, return as-is
        if (str.trim().startsWith('```')) {
            return str;
        }

        // Check for multiline content
        const hasNewlines = str.includes('\n');

        // Improved heuristic: keywords OR algo symbols OR indentation
        const codeKeywords = [
            'def ', 'class ', 'import ', 'from ', 'public ', 'private ', 'function ', 'var ', 'const ', 'let ',
            'INPUT', 'OUTPUT', 'IF ', 'ELSE ', 'WHILE ', 'FOR ', 'THEN ', 'DO ', 'END', 'PRINT', 'STEP', 'ALGORITHM',
            'for ', 'if ', 'else ', 'while ', 'end ', 'print ', 'arr', 'sum ', 'length('
        ];
        const algoSymbols = ['←', '≤', '≥', '≠', '×', '÷', 'mod ', '==', '!=', '>=', '<=', '= 0', '= [', '++', '--', '+=', '-='];

        // Use simple string matching instead of regex to avoid special character issues
        const lowerStr = str.toLowerCase();
        const hasCodeKeyword = codeKeywords.some(k => lowerStr.includes(k.toLowerCase()));
        const hasAlgoSymbol = algoSymbols.some(s => str.includes(s));
        const hasIndentation = /^[ \t]{2,}/m.test(str);

        // If it has multiple lines and looks like code/pseudocode, wrap in code block
        const isCodeLike = hasNewlines && (hasCodeKeyword || hasAlgoSymbol || hasIndentation);

        if (isCodeLike) {
            return `\n\n\`\`\`\n${str}\n\`\`\`\n\n`;
        }

        // For any content with newlines that isn't code-like, preserve line breaks
        // using markdown soft breaks (two trailing spaces)
        if (hasNewlines) {
            return str.split('\n').join('  \n');
        }

        return str;
    };

    const handleOptionSelect = (optionIndex) => {
        if (submitted) return;
        const newAnswers = { ...answers, [currentQuestion]: optionIndex };
        setAnswers(newAnswers);
        answersRef.current = newAnswers;
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
        answersRef.current = newAnswers;
    };

    const calculateScore = () => {
        if (!test) return { raw: 0, normalized: 0 };
        let rawScore = 0;
        const cMarks = test.correctMarks !== undefined ? parseInt(test.correctMarks) : 4;
        const iMarks = test.incorrectMarks !== undefined ? parseInt(test.incorrectMarks) : -1;

        test.questions.forEach((q, index) => {
            if (q.isUnrated) return; // Ignore unrated questions in scoring

            if (answers[index] !== undefined) {
                const isCorrect = answers[index] == (q.correctOption || q.correctOptionIndex);
                if (isCorrect) {
                    rawScore += (q.marks !== undefined ? parseInt(q.marks) : cMarks);
                } else {
                    rawScore += iMarks; // iMarks is already negative usually (e.g., -1)
                }
            }
        });
        const ratedQuestions = test.questions.filter(q => !q.isUnrated);
        const maxPossible = ratedQuestions.reduce((sum, q) => sum + (q.marks !== undefined ? parseInt(q.marks) : cMarks), 0);
        const normalized = maxPossible > 0 ? Math.max(0, Math.min(10, (rawScore / maxPossible) * 10)) : 0;
        return { raw: rawScore, normalized: parseFloat(normalized.toFixed(2)), totalMarks: maxPossible };
    };

    // Submit handler that accepts answers parameter (for timer auto-submit with ref)
    const handleSubmitWithAnswers = async (answersToSubmit) => {
        if (!test) return;
        if (document.fullscreenElement) document.exitFullscreen().catch(console.error);

        // Calculate score with provided answers
        let rawScore = 0;
        const cMarks = test.correctMarks !== undefined ? parseInt(test.correctMarks) : 4;
        const iMarks = test.incorrectMarks !== undefined ? parseInt(test.incorrectMarks) : -1;

        test.questions.forEach((q, index) => {
            if (q.isUnrated) return;
            if (answersToSubmit[index] !== undefined) {
                const isCorrect = answersToSubmit[index] == (q.correctOption || q.correctOptionIndex);
                if (isCorrect) {
                    rawScore += (q.marks !== undefined ? parseInt(q.marks) : cMarks);
                } else {
                    rawScore += iMarks;
                }
            }
        });
        const ratedQuestions = test.questions.filter(q => !q.isUnrated);
        const maxPossible = ratedQuestions.reduce((sum, q) => sum + (q.marks !== undefined ? parseInt(q.marks) : cMarks), 0);
        const normalized = maxPossible > 0 ? Math.max(0, Math.min(10, (rawScore / maxPossible) * 10)) : 0;

        setScore(rawScore);
        setNormalizedScore(parseFloat(normalized.toFixed(2)));
        setSubmitted(true);
        setViewMode('result');

        // Clear localStorage progress after submission
        clearProgress();

        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        try {
            await fetch(`${API_URL}/api/mock-tests/${testId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${savedUser.token}`
                },
                body: JSON.stringify({
                    score: rawScore,
                    totalMarks: maxPossible,
                    normalizedScore: parseFloat(normalized.toFixed(2)),
                    totalQuestions: test.questions.length,
                    answers: answersToSubmit
                })
            });
        } catch (error) {
            console.error('Failed to save result', error);
        }
    };

    // Regular submit (uses current answers state)
    const handleSubmit = async () => {
        await handleSubmitWithAnswers(answersRef.current);
    };

    const handleRetake = () => {
        // CRITICAL: Clear progress FIRST to ensure reload doesn't restore old progress
        clearProgress();

        const newAnswers = {};
        setAnswers(newAnswers);
        answersRef.current = newAnswers;
        setCurrentQuestion(0);
        const newTime = (test?.duration || test?.durationMinutes || 180) * 60;
        setTimeRemaining(newTime);
        timeRemainingRef.current = newTime;
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

    if (loading) return (
        <div className="container" style={{ paddingTop: '80px', maxWidth: '1200px' }}>
            <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1.5fr', gap: '48px' }}>
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', height: '500px', padding: '24px' }}>
                    <Skeleton height="200px" width="100%" borderRadius="12px" style={{ marginBottom: '24px' }} />
                    <Skeleton height="32px" width="70%" style={{ marginBottom: '16px' }} />
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <Skeleton height="40px" width="100%" />
                        <Skeleton height="40px" width="100%" />
                        <Skeleton height="40px" width="100%" />
                    </div>
                </div>
                <div>
                    <Skeleton height="48px" width="40%" style={{ marginBottom: '32px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Skeleton width="48px" height="48px" borderRadius="12px" />
                            <div style={{ flex: 1 }}><Skeleton height="20px" width="80%" /><Skeleton height="14px" width="40%" style={{ marginTop: '8px' }} /></div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Skeleton width="48px" height="48px" borderRadius="12px" />
                            <div style={{ flex: 1 }}><Skeleton height="20px" width="80%" /><Skeleton height="14px" width="40%" style={{ marginTop: '8px' }} /></div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Skeleton width="48px" height="48px" borderRadius="12px" />
                            <div style={{ flex: 1 }}><Skeleton height="20px" width="80%" /><Skeleton height="14px" width="40%" style={{ marginTop: '8px' }} /></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
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
                                <span><span style={{ background: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fdba74', fontSize: '0.85rem' }}>All Questions</span> are mandatory to attempt.</span>,
                                <span>Each correct answer earns <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>+{test.correctMarks || 4} marks</span>, while each incorrect answer deducts <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>{test.incorrectMarks || -1} marks</span>.</span>,
                                `The test duration is ${test.duration || 180} minutes, with a total of ${test.questions?.length || test.totalQuestions || 0} questions.`
                            ]}
                        />

                        <InstructionItem
                            title="Invigilation Instructions (This is just to give you actual NSAT feel)"
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
                                    `Correct: +${test.correctMarks || 4} marks, Incorrect: ${test.incorrectMarks || -1} marks.`,
                                    `Duration: ${test.duration || 180} minutes.`,
                                    `Total Questions: ${test.questions?.length || test.totalQuestions || 0}`
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
                            onClick={toggleFullScreen}
                            variant="outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}
                        >
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
                        </Button>
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
                                <MarkdownRenderer content={renderSmartPreview(currentQ.questionText || currentQ.text)} />
                            </div>
                            {currentQ.image && renderQuestionImage(currentQ.image)}
                        </div>

                        {/* Options Cards */}
                        {currentQ.type !== 'code' && (
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
                                                alignItems: 'flex-start',
                                                gap: '20px',
                                                transition: 'all 0.2s',
                                                padding: '20px'
                                            }}
                                        >
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: isSelected ? '#2563eb' : '#f1f5f9',
                                                color: isSelected ? 'white' : '#64748b',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 'bold',
                                                flexShrink: 0,
                                                marginTop: '4px'
                                            }}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <MarkdownRenderer content={renderSmartPreview(option)} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Coding Question Area */}
                        {currentQ.type === 'code' && (
                            <div style={{ marginTop: '24px' }}>
                                {currentQ.externalLink && (
                                    <div style={{ marginBottom: '20px', padding: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ fontWeight: 'bold', color: '#0369a1', fontSize: '1rem' }}>Solve on External Platform</p>
                                            <p style={{ fontSize: '0.85rem', color: '#0c4a6e' }}>Please solve this problem on the linked platform and paste your final solution below.</p>
                                        </div>
                                        <a href={currentQ.externalLink} target="_blank" rel="noopener noreferrer" style={{ background: '#0284c7', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            Solve Now <ChevronRight size={18} />
                                        </a>
                                    </div>
                                )}
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Write your code below:</label>
                                <textarea
                                    value={answers[currentQuestion] || ''}
                                    onChange={(e) => {
                                        const newAnswers = { ...answers, [currentQuestion]: e.target.value };
                                        setAnswers(newAnswers);
                                        answersRef.current = newAnswers;
                                    }}
                                    placeholder="// Paste your code here..."
                                    style={{
                                        width: '100%',
                                        height: '400px',
                                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                        fontSize: '0.95rem',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        border: '2px solid #e2e8f0',
                                        background: '#f8fafc',
                                        outline: 'none',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                        )}

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
                        <div style={{ maxHeight: '400px', overflowY: 'scroll' }}>
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
                {
                    zoomedImage && (
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
                    )
                }
            </div >
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
        const isCorrect = currentQ && userAnswerIndex == (currentQ.correctOption || currentQ.correctOptionIndex);
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
                            {userScore} <span style={{ fontSize: '1.25rem', color: '#64748b' }}>/ {(test.questions.filter(q => !q.isUnrated).length) * 4}</span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', marginTop: '4px' }}>Marks Obtained (Rated Only)</p>
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
                                    background: currentQ.isUnrated ? '#fef9c3' : isCorrect ? '#dcfce7' : isSkipped ? '#f1f5f9' : '#fee2e2',
                                    color: currentQ.isUnrated ? '#854d0e' : isCorrect ? '#166534' : isSkipped ? '#64748b' : '#991b1b'
                                }}>
                                    {currentQ.isUnrated ? <AlertCircle size={16} /> : isCorrect ? <CheckCircle size={16} /> : isSkipped ? <AlertCircle size={16} /> : <XCircle size={16} />}
                                    {currentQ.isUnrated ? 'Unrated' : isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                                </span>
                            </div>

                            <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', lineHeight: '1.6', color: '#1e293b' }}>
                                <MarkdownRenderer content={renderSmartPreview(currentQ.questionText || currentQ.text)} />
                            </h2>
                            {currentQ.image && renderQuestionImage(currentQ.image)}

                            {currentQ.type !== 'code' && (
                                <div style={{ display: 'grid', gap: '16px', marginTop: '32px' }}>
                                    {currentQ.options.map((option, idx) => {
                                        const isSelected = userAnswerIndex === idx;
                                        const isCorrectOpt = idx == (currentQ.correctOption || currentQ.correctOptionIndex);

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
                                                padding: '20px', border: `2px solid ${borderColor}`, background: bg, borderRadius: '12px',
                                                display: 'flex', gap: '20px', alignItems: 'flex-start'
                                            }}>
                                                <div style={{
                                                    width: '28px', height: '28px', borderRadius: '6px',
                                                    background: isCorrectOpt ? '#16a34a' : (isSelected && !isCorrectOpt) ? '#dc2626' : '#f1f5f9',
                                                    color: (isCorrectOpt || (isSelected && !isCorrectOpt)) ? 'white' : '#64748b',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0,
                                                    marginTop: '4px'
                                                }}>
                                                    {String.fromCharCode(65 + idx)}
                                                </div>
                                                <div style={{ flex: 1, fontSize: '1rem', color: '#334155' }}>
                                                    <MarkdownRenderer content={renderSmartPreview(option)} />
                                                </div>
                                                {icon}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Coding Question Result */}
                            {currentQ.type === 'code' && (
                                <div style={{ marginTop: '32px', display: 'grid', gap: '24px' }}>
                                    <div>
                                        <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>Your Solution:</p>
                                        <MarkdownRenderer content={renderSmartPreview(userAnswerIndex || 'No answer provided')} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>Model Solution:</p>
                                        <MarkdownRenderer content={renderSmartPreview(currentQ.correctOption || 'No solution key provided')} />
                                    </div>
                                </div>
                            )}

                            {/* Solution Explanation */}
                            {currentQ.solution && (
                                <div style={{
                                    marginTop: '32px',
                                    padding: '20px',
                                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)',
                                    borderRadius: '12px',
                                    border: '1px solid #bbf7d0'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '12px',
                                        fontWeight: 'bold',
                                        color: '#166534'
                                    }}>
                                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 16v-4M12 8h.01" />
                                        </svg>
                                        Solution Explanation
                                    </div>
                                    <div style={{ color: '#334155', lineHeight: '1.7' }}>
                                        <MarkdownRenderer content={renderSmartPreview(currentQ.solution)} />
                                    </div>
                                </div>
                            )}
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
                        <Card className="modern-card" style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '16px' }}>Question Overview</h3>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                    {test.questions.map((q, idx) => {
                                        const ans = (resultToDisplay?.answers || {})[idx];
                                        const isCorr = ans == (q.correctOption || q.correctOptionIndex);
                                        const isSkp = ans === undefined;
                                        const isCurr = idx === currentQuestion;

                                        let bg = q.isUnrated ? '#fef9c3' : isSkp ? '#f1f5f9' : isCorr ? '#dcfce7' : '#fee2e2';
                                        let color = q.isUnrated ? '#854d0e' : isSkp ? '#64748b' : isCorr ? '#166534' : '#991b1b';
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
                                    {isIframeVideo(test.videoSolutionUrl) ? (
                                        <iframe
                                            src={convertToYouTubeEmbed(test.videoSolutionUrl)}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share; keyboard-map"
                                            allowFullScreen
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                            tabIndex="0"
                                            playsInline
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
