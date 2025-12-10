'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Button from '../../../../../components/ui/Button';
import Card from '../../../../../components/ui/Card';
import Loader from '../../../../../components/ui/Loader';
import { convertToYouTubeEmbed } from '../../../../../lib/videoUtils';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

    useEffect(() => {
        const fetchData = async () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const token = savedUser.token;

            try {
                // Fetch test
                const testRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/mock-tests/${testId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!testRes.ok) throw new Error('Failed to fetch test');
                const testData = await testRes.json();
                setTest(testData);

                // Check for previous result
                const resultRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/me/mock-test-results/${testId}`, {
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

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [viewMode, submitted]);

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
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/mock-tests/${testId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    score: raw,
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

    // Previous Result View
    if (viewMode === 'previousResult' && previousResult) {
        return (
            <div className="container" style={{ paddingTop: '40px', maxWidth: '900px' }}>
                <Card style={{ padding: '32px', marginBottom: '24px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(236, 72, 153, 0.1))' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>You've already taken this test</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>
                        {previousResult.normalizedScore || 0} / 10
                    </div>
                    <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '24px' }}>
                        Raw Score: {previousResult.score} | Normalized Score: {previousResult.normalizedScore}
                    </p>
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>
                        Taken on: {new Date(previousResult.completedAt).toLocaleDateString()}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <Button onClick={handleRetake}>
                            🔄 Retake Test
                        </Button>
                        <Button variant="outline" onClick={() => router.push(`/courses/${id}`)}>
                            ← Back to Course
                        </Button>
                    </div>
                </Card>

                {test.videoSolutionUrl && (
                    <Card style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#2563eb' }}>📹 Video Solution</h3>
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', background: '#000', borderRadius: '12px' }}>
                            {test.videoSolutionUrl.includes('youtube.com') || test.videoSolutionUrl.includes('youtu.be') ? (
                                <iframe
                                    src={convertToYouTubeEmbed(test.videoSolutionUrl)}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title="Video Solution"
                                />
                            ) : (
                                <video
                                    src={`${test.videoSolutionUrl}?token=${JSON.parse(localStorage.getItem('user') || '{}').token}`}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                    controls
                                    controlsList="nodownload"
                                    onContextMenu={(e) => e.preventDefault()}
                                />
                            )}
                        </div>
                    </Card>
                )}
            </div>
        );
    }

    // Test Taking View
    if (viewMode === 'test' && !submitted) {
        const currentQ = test.questions[currentQuestion];
        return (
            <div className="container" style={{ paddingTop: '40px', maxWidth: '1200px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1>{test.title}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: timeRemaining < 600 ? '#fee2e2' : '#f8fafc', padding: '12px 24px', borderRadius: '8px', border: `2px solid ${timeRemaining < 600 ? '#ef4444' : '#e2e8f0'}` }}>
                        <Clock size={20} color={timeRemaining < 600 ? '#ef4444' : '#64748b'} />
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: timeRemaining < 600 ? '#ef4444' : '#0f172a' }}>
                            {formatTime(timeRemaining)}
                        </span>
                    </div>
                </div>

                <div className="responsive-grid" style={{ gridTemplateColumns: '3fr 1fr' }}>
                    {/* Main Question Area */}
                    <div>
                        <Card style={{ padding: '32px', marginBottom: '24px' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <span style={{ background: '#2563eb', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '0.9rem' }}>
                                    Question {currentQuestion + 1} of {test.questions.length}
                                </span>
                            </div>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '24px', lineHeight: '1.6' }}>
                                {currentQ.questionText}
                            </h2>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {currentQ.options.map((option, optIndex) => {
                                    const isSelected = answers[currentQuestion] === optIndex;
                                    return (
                                        <div
                                            key={optIndex}
                                            onClick={() => handleOptionSelect(currentQuestion, optIndex)}
                                            style={{
                                                padding: '16px',
                                                border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                                                background: isSelected ? 'rgba(37, 99, 235, 0.1)' : 'white',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}
                                        >
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                border: `2px solid ${isSelected ? '#2563eb' : '#cbd5e1'}`,
                                                background: isSelected ? '#2563eb' : 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                {isSelected && '✓'}
                                            </div>
                                            <span style={{ fontWeight: isSelected ? 500 : 400 }}>{option}</span>
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
                                style={{ opacity: currentQuestion === 0 ? 0.5 : 1 }}
                            >
                                ← Previous
                            </Button>
                            <Button onClick={handleSubmit} style={{ background: '#16a34a' }}>
                                Submit Test
                            </Button>
                            <Button
                                onClick={() => setCurrentQuestion(Math.min(test.questions.length - 1, currentQuestion + 1))}
                                disabled={currentQuestion === test.questions.length - 1}
                                style={{ opacity: currentQuestion === test.questions.length - 1 ? 0.5 : 1 }}
                            >
                                Next →
                            </Button>
                        </div>
                    </div>

                    {/* Question Palette */}
                    <Card style={{ padding: '16px', maxHeight: '600px', overflowY: 'auto', position: 'sticky', top: '100px' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Questions</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                            {test.questions.map((_, index) => {
                                const answered = answers[index] !== undefined;
                                const isCurrent = index === currentQuestion;
                                return (
                                    <div
                                        key={index}
                                        onClick={() => setCurrentQuestion(index)}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            background: isCurrent ? '#2563eb' : answered ? '#16a34a' : '#e2e8f0',
                                            color: isCurrent || answered ? 'white' : '#64748b',
                                            border: `2px solid ${isCurrent ? '#1e40af' : 'transparent'}`
                                        }}
                                    >
                                        {index + 1}
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: '16px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ width: '16px', height: '16px', background: '#16a34a', borderRadius: '4px' }}></div>
                                <span>Answered</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ width: '16px', height: '16px', background: '#e2e8f0', borderRadius: '4px' }}></div>
                                <span>Not Answered</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div style={{ width: '16px', height: '16px', background: '#2563eb', borderRadius: '4px', border: '2px solid #1e40af' }}></div>
                                <span>Current</span>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.85rem', color: '#92400e' }}>
                                <strong>Marking:</strong> +4 correct, -1 incorrect, 0 unanswered
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // Results View (after submission)
    if (viewMode === 'result' && submitted) {
        return (
            <div className="container" style={{ paddingTop: '40px', maxWidth: '900px' }}>
                <Card style={{ textAlign: 'center', padding: '48px', marginBottom: '32px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(236, 72, 153, 0.1))', borderColor: '#2563eb', borderWidth: '2px' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Test Completed! 🎉</h2>
                    <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>
                        {normalizedScore} / 10
                    </div>
                    <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '8px' }}>
                        Raw Score: {score} points
                    </p>
                    <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '32px' }}>
                        Answered: {Object.keys(answers).length} / {test.questions.length}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <Button onClick={handleRetake}>
                            🔄 Retake Test
                        </Button>
                        <Button variant="outline" onClick={() => router.push(`/courses/${id}`)}>
                            ← Back to Course
                        </Button>
                    </div>
                </Card>

                {/* Video Solution */}
                {test.videoSolutionUrl && (
                    <Card style={{ padding: '24px', marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#2563eb' }}>📹 Video Solution</h3>
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', background: '#000', borderRadius: '12px' }}>
                            {test.videoSolutionUrl.includes('youtube.com') || test.videoSolutionUrl.includes('youtu.be') ? (
                                <iframe
                                    src={convertToYouTubeEmbed(test.videoSolutionUrl)}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title="Video Solution"
                                />
                            ) : (
                                <video
                                    src={`${test.videoSolutionUrl}?token=${JSON.parse(localStorage.getItem('user') || '{}').token}`}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                    controls
                                    controlsList="nodownload"
                                    onContextMenu={(e) => e.preventDefault()}
                                />
                            )}
                        </div>
                    </Card>
                )}

                {/* Answer Review */}
                <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>📝 Review Your Answers</h3>
                {test.questions.map((q, index) => {
                    const userAnswer = answers[index];
                    const isCorrect = userAnswer === q.correctOptionIndex;
                    const wasAnswered = userAnswer !== undefined;

                    return (
                        <Card key={index} style={{
                            marginBottom: '20px',
                            padding: '20px',
                            borderLeft: `4px solid ${!wasAnswered ? '#f59e0b' : isCorrect ? '#4ade80' : '#f87171'}`
                        }}>
                            <h4 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>
                                Question {index + 1}: {q.questionText}
                            </h4>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                                {wasAnswered ? (
                                    <>
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong style={{ color: isCorrect ? '#16a34a' : '#dc2626' }}>
                                                Your Answer:
                                            </strong>
                                            <span style={{ marginLeft: '8px', color: isCorrect ? '#16a34a' : '#dc2626' }}>
                                                {q.options[userAnswer]}
                                                {isCorrect ? ' ✓' : ' ✗'}
                                            </span>
                                        </div>
                                        {!isCorrect && (
                                            <div>
                                                <strong style={{ color: '#16a34a' }}>
                                                    Correct Answer:
                                                </strong>
                                                <span style={{ marginLeft: '8px', color: '#16a34a' }}>
                                                    {q.options[q.correctOptionIndex]} ✓
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ color: '#f59e0b' }}>
                                        <strong>Not Answered</strong>
                                        <div style={{ marginTop: '8px' }}>
                                            <strong style={{ color: '#16a34a' }}>Correct Answer: </strong>
                                            <span style={{ color: '#16a34a' }}>{q.options[q.correctOptionIndex]}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {q.explanation && (
                                <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                                    <strong style={{ color: '#92400e' }}>💡 Explanation: </strong>
                                    <span style={{ color: '#78350f' }}>{q.explanation}</span>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        );
    }

    return null;
}
