'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Button from '../../../../../components/ui/Button';
import Card from '../../../../../components/ui/Card';
import Loader from '../../../../../components/ui/Loader';
import { convertToYouTubeEmbed } from '../../../../../lib/videoUtils';
import { Clock, CheckCircle, XCircle, AlertCircle, Maximize, Minimize } from 'lucide-react';
import VideoPlayer from '../../../../../components/ui/VideoPlayer';

export default function MockTestPage() {
    const params = useParams();
    const { id, testId } = params;
    const router = useRouter();

    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previousResult, setPreviousResult] = useState(null);
    const [viewMode, setViewMode] = useState('');  // 'test', 'result', or 'previousResult'

    // Test taking state
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(180 * 60); // 180 minutes in seconds
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [normalizedScore, setNormalizedScore] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const testContainerRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const token = savedUser.token;

            try {
                // Fetch test
                const testRes = await fetch(`${API_URL}/api/mock-tests/${testId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!testRes.ok) throw new Error('Failed to fetch test');
                const testData = await testRes.json();
                setTest(testData);

                // Check for previous result
                const resultRes = await fetch(`${API_URL}/api/users/me/mock-test-results/${testId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (resultRes.ok) {
                    const resultData = await resultRes.json();
                    setPreviousResult(resultData);
                    setViewMode('previousResult');
                } else {
                    setViewMode('test');
                }
            } catch (error) {
                console.error(error);
                setViewMode('test');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [testId]);

    // Timer countdown
    useEffect(() => {
        if (viewMode !== 'test' || submitted) return;

        // Auto-enter fullscreen
        const enterFullScreen = async () => {
            try {
                if (testContainerRef.current && !document.fullscreenElement) {
                    await testContainerRef.current.requestFullscreen();
                }
            } catch (err) {
                console.log("Full screen request failed (likely needs user interaction):", err);
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

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            testContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (questionIndex, optionIndex) => {
        if (submitted) return;
        setAnswers({ ...answers, [questionIndex]: optionIndex });
    };

    const calculateScore = () => {
        if (!test) return { raw: 0, normalized: 0 };

        let rawScore = 0;
        test.questions.forEach((q, index) => {
            if (answers[index] !== undefined) {
                if (answers[index] === q.correctOptionIndex) {
                    rawScore += 4; // +4 for correct
                } else {
                    rawScore -= 1; // -1 for incorrect
                }
            }
            // 0 for unanswered
        });

        // Normalize to 0-10
        const maxPossible = test.questions.length * 4;
        const normalized = Math.max(0, Math.min(10, (rawScore / maxPossible) * 10));

        return { raw: rawScore, normalized: parseFloat(normalized.toFixed(2)) };
    };

    const handleSubmit = async () => {
        if (!test) return;

        const { raw, normalized } = calculateScore();
        setScore(raw);
        setNormalizedScore(normalized);
        setSubmitted(true);
        setViewMode('result');

        // Save result
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = savedUser.token;

        try {
            await fetch(`${API_URL}/api/mock-tests/${testId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
        setTimeRemaining(180 * 60);
        setSubmitted(false);
        setScore(0);
        setNormalizedScore(0);
        setViewMode('test');
        setPreviousResult(null);
    };

    if (loading) return <Loader />;
    if (!test) return <div className="container" style={{ paddingTop: '40px' }}>Test not found</div>;

    // Review Mode (Reuse similar layout to Test view but with answers shown)
    if (viewMode === 'previousResult' || (viewMode === 'result' && submitted)) {
        const currentQ = test.questions[currentQuestion];
        const resultToDisplay = viewMode === 'previousResult' ? previousResult : {
            score: score,
            normalizedScore: normalizedScore,
            answers: answers
        };

        const userAnswerIndex = (resultToDisplay.answers || {})[currentQuestion];
        const isCorrect = userAnswerIndex === currentQ.correctOptionIndex;
        const isSkipped = userAnswerIndex === undefined;

        return (
            <div className="container" style={{ paddingTop: '40px', maxWidth: '1200px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <Button variant="outline" onClick={() => router.push(`/courses/${id}`)}>
                        Back to Course
                    </Button>
                </div>

                {/* Score Card Summary */}
                <Card style={{ padding: '32px', marginBottom: '32px', borderLeft: '4px solid #6366f1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', fontWeight: 'bold' }}>Test Results</h2>
                            <p style={{ color: '#64748b' }}>{test.title}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#6366f1' }}>
                                {resultToDisplay.score} / {resultToDisplay.totalMarks || (test?.questions?.length * 4) || 0}
                            </div>
                            <p style={{ color: '#64748b' }}>Marks Obtained</p>
                        </div>
                    </div>
                    {viewMode === 'result' && (
                        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                            <Button onClick={handleRetake}>Retake Test</Button>
                        </div>
                    )}
                    {viewMode === 'previousResult' && (
                        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                            <Button onClick={handleRetake}>Retake Test</Button>
                        </div>
                    )}
                </Card>

                <div className="responsive-grid" style={{ gridTemplateColumns: '3fr 1fr' }}>
                    {/* Main Question Review Area */}
                    <div>
                        <Card style={{ padding: '32px', marginBottom: '24px' }}>
                            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 500 }}>
                                    Question {currentQuestion + 1} of {test.questions.length}
                                </span>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '4px',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    background: isCorrect ? '#dcfce7' : isSkipped ? '#f3f4f6' : '#fee2e2',
                                    color: isCorrect ? '#166534' : isSkipped ? '#4b5563' : '#991b1b'
                                }}>
                                    {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                                </span>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                {currentQ.image && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <img src={currentQ.image} alt="Question" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }} />
                                    </div>
                                )}
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', lineHeight: '1.6' }}>
                                    {currentQ.questionText}
                                </h2>

                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {currentQ.options.map((option, optIndex) => {
                                        const isSelected = userAnswerIndex === optIndex;
                                        const isCorrectOption = currentQ.correctOptionIndex === optIndex;

                                        let borderColor = '#e2e8f0';
                                        let bgColor = 'white';
                                        let icon = null;

                                        if (isCorrectOption) {
                                            borderColor = '#22c55e'; // Green
                                            bgColor = 'rgba(34, 197, 94, 0.1)';
                                            icon = <CheckCircle size={18} color="#16a34a" />;
                                        } else if (isSelected && !isCorrectOption) {
                                            borderColor = '#ef4444'; // Red
                                            bgColor = 'rgba(239, 68, 68, 0.1)';
                                            icon = <XCircle size={18} color="#dc2626" />;
                                        } else if (isSelected) {
                                            // Selected and correct (handled above generally, but safeguard)
                                            borderColor = '#22c55e';
                                            bgColor = 'rgba(34, 197, 94, 0.1)';
                                            icon = <CheckCircle size={18} color="#16a34a" />;
                                        }

                                        return (
                                            <div
                                                key={optIndex}
                                                style={{
                                                    padding: '16px',
                                                    border: `2px solid ${borderColor}`,
                                                    background: bgColor,
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>{option}</div>
                                                {icon}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {currentQ.explanation && (
                                <div style={{ marginTop: '24px', padding: '20px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '8px', color: '#1e3a8a' }}>Explanation</h4>
                                    <p style={{ color: '#334155', lineHeight: '1.6' }}>{currentQ.explanation}</p>
                                </div>
                            )}
                        </Card>

                        {/* Navigation */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                                disabled={currentQuestion === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={() => setCurrentQuestion(Math.min(test.questions.length - 1, currentQuestion + 1))}
                                disabled={currentQuestion === test.questions.length - 1}
                            >
                                Next
                            </Button>
                        </div>
                    </div>

                    {/* Question Palette for Review */}
                    <Card style={{ padding: '20px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', position: 'sticky', top: '100px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '16px' }}>Questions</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                            {test.questions.map((q, index) => {
                                const ans = resultToDisplay.answers[index];
                                const isCorr = ans === q.correctOptionIndex;
                                const isSkip = ans === undefined;
                                const isCurr = index === currentQuestion;

                                return (
                                    <div
                                        key={index}
                                        onClick={() => setCurrentQuestion(index)}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            background: isCurr ? '#3b82f6' : isSkip ? '#f1f5f9' : isCorr ? '#dcfce7' : '#fee2e2',
                                            color: isCurr ? 'white' : isSkip ? '#64748b' : isCorr ? '#166534' : '#991b1b',
                                            border: isCurr ? '2px solid #2563eb' : '1px solid transparent'
                                        }}
                                    >
                                        {index + 1}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: '24px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#dcfce7' }}></div> Correct
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#fee2e2' }}></div> Incorrect
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#f1f5f9' }}></div> Skipped
                            </div>
                        </div>


                        {/* Video Solution moved to main area */}
                        {test.videoSolutionUrl && (
                            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '12px' }}>Video Solution</h4>
                                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', background: '#000', borderRadius: '8px' }}>
                                    {test.videoSolutionUrl.includes('youtube.com') || test.videoSolutionUrl.includes('youtu.be') ? (
                                        <iframe
                                            src={convertToYouTubeEmbed(test.videoSolutionUrl)}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                            frameBorder="0"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                                            <VideoPlayer
                                                src={`${test.videoSolutionUrl}?token=${JSON.parse(localStorage.getItem('user') || '{}').token}`}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        );
    }

    // Test Taking View
    if (viewMode === 'test' && !submitted) {
        const currentQ = test.questions[currentQuestion];
        return (
            <div ref={testContainerRef} className="container" style={{ paddingTop: '40px', maxWidth: '1200px', background: isFullscreen ? 'white' : 'transparent', minHeight: isFullscreen ? '100vh' : 'auto', overflowY: isFullscreen ? 'auto' : 'visible' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '1.5rem' }}>{test.title}</h1>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Button variant="outline" onClick={toggleFullScreen} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                            {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                        </Button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: timeRemaining < 300 ? '#fee2e2' : 'white', padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <Clock size={18} color={timeRemaining < 300 ? '#ef4444' : '#64748b'} />
                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: timeRemaining < 300 ? '#ef4444' : '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                                {formatTime(timeRemaining)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="responsive-grid" style={{ gridTemplateColumns: '3fr 1fr' }}>
                    {/* Main Question Area */}
                    <div>
                        <Card style={{ padding: '32px', marginBottom: '24px' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                                    Question {currentQuestion + 1} of {test.questions.length}
                                </span>
                            </div>

                            {currentQ.image && (
                                <div style={{ marginBottom: '24px' }}>
                                    <img src={currentQ.image} alt="Question" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }} />
                                </div>
                            )}

                            <h2 style={{ fontSize: '1.25rem', marginBottom: '32px', lineHeight: '1.6', fontWeight: 500 }}>
                                {currentQ.questionText}
                            </h2>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {currentQ.options.map((option, optIndex) => {
                                    const isSelected = answers[currentQuestion] === optIndex;
                                    return (
                                        <div
                                            key={optIndex}
                                            onClick={() => handleOptionSelect(currentQuestion, optIndex)}
                                            style={{
                                                padding: '16px 20px',
                                                border: `2px solid ${isSelected ? '#6366f1' : '#e2e8f0'}`,
                                                background: isSelected ? '#eef2ff' : 'white',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px'
                                            }}
                                            className="hover:border-indigo-300"
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                border: `2px solid ${isSelected ? '#6366f1' : '#cbd5e1'}`,
                                                background: isSelected ? '#6366f1' : 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {isSelected && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }}></div>}
                                            </div>
                                            <span style={{ fontSize: '1rem', color: isSelected ? '#312e81' : '#334155' }}>{option}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Navigation */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                                disabled={currentQuestion === 0}
                            >
                                Previous
                            </Button>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button
                                    onClick={() => setCurrentQuestion(Math.min(test.questions.length - 1, currentQuestion + 1))}
                                    disabled={currentQuestion === test.questions.length - 1}
                                    variant="outline"
                                >
                                    Next
                                </Button>
                                <Button onClick={handleSubmit} style={{ background: '#10b981', border: 'none' }}>
                                    Submit Test
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Question Palette */}
                    <Card style={{ padding: '20px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', position: 'sticky', top: '100px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '16px' }}>Test Overview</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                            {test.questions.map((_, index) => {
                                const answered = answers[index] !== undefined;
                                const isCurrent = index === currentQuestion;
                                return (
                                    <div
                                        key={index}
                                        onClick={() => setCurrentQuestion(index)}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            fontSize: '0.85rem',
                                            background: isCurrent ? '#4f46e5' : answered ? '#10b981' : '#f1f5f9',
                                            color: isCurrent || answered ? 'white' : '#64748b',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {index + 1}
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: '20px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }}></div>
                                <span>Answered</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div style={{ width: '12px', height: '12px', background: '#f1f5f9', borderRadius: '3px' }}></div>
                                <span>Not Answered</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div style={{ width: '12px', height: '12px', background: '#4f46e5', borderRadius: '3px' }}></div>
                                <span>Current</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return null;

}
