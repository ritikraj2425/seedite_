'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { ChevronLeft, Trophy, Clock, Target, Award, BarChart2, TrendingUp, Hash, CheckCircle, XCircle, MinusCircle, Users, Percent, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

export default function MockTestAnalytics({ testId, courseId = null, isIQTest = false }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [test, setTest] = useState(null);
    const [result, setResult] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    // Theme (forced light theme across the board per user request)
    const dark = false;
    const t = {
        pageBg: dark ? '#030712' : '#f8fafc',
        cardBg: dark ? '#0c1222' : '#ffffff',
        cardBorder: dark ? '#1a2236' : '#e2e8f0',
        text: dark ? '#e2e8f0' : '#0f172a',
        textSec: dark ? '#94a3b8' : '#64748b',
        textMuted: dark ? '#64748b' : '#94a3b8',
        tooltipBg: dark ? '#1e293b' : '#ffffff',
        tooltipBorder: dark ? '#334155' : '#e2e8f0',
        tooltipText: dark ? '#f1f5f9' : '#0f172a',
        lbRowBg: dark ? 'transparent' : '#ffffff',
        lbHighlight: dark ? 'rgba(99,102,241,0.08)' : '#f0f9ff',
        lbHighlightText: dark ? '#a5b4fc' : '#0369a1',
        lbBadgeBg: dark ? 'rgba(99,102,241,0.15)' : '#e0f2fe',
        lbScoreBg: dark ? '#111827' : '#f1f5f9',
        lbScoreHighlight: dark ? 'rgba(99,102,241,0.12)' : '#bae6fd',
        sectionBorder: dark ? '#111827' : '#f1f5f9',
        statGlass: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    };

    useEffect(() => {
        setIsVisible(true);
        const fetchAnalyticsData = async () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const token = savedUser.token;
            setCurrentUserId(savedUser.id || savedUser._id || '');

            if (!token) { router.push('/login'); return; }

            try {
                const [testRes, resultRes, lbRes] = await Promise.all([
                    fetch(`${API_URL}/api/mock-tests/${testId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/api/users/me/mock-test-results/${testId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/api/mock-tests/${testId}/leaderboard`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (!testRes.ok) throw new Error('Failed to fetch test details');
                setTest(await testRes.json());

                if (!resultRes.ok) throw new Error('Failed to fetch your results');
                setResult(await resultRes.json());

                if (lbRes.ok) {
                    const lbData = await lbRes.json();
                    setLeaderboard(Array.isArray(lbData) ? lbData : (lbData.leaderboard || []));
                }
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalyticsData();
    }, [testId, router]);

    // Loading
    if (loading) {
        return (
            <main style={{ minHeight: '100vh', background: t.pageBg }}>
                {isIQTest && <Navbar />}
                <div className="container" style={{ paddingTop: isIQTest ? '100px' : '80px', maxWidth: '1100px' }}>
                    <Skeleton height="120px" width="100%" borderRadius="14px" style={{ marginBottom: '24px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        {[1,2,3,4].map(i => <Skeleton key={i} height="90px" borderRadius="12px" />)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <Skeleton height="340px" borderRadius="14px" />
                        <Skeleton height="340px" borderRadius="14px" />
                    </div>
                </div>
            </main>
        );
    }

    // Error
    if (error || !result || !test) {
        return (
            <main style={{ minHeight: '100vh', background: t.pageBg }}>
                {isIQTest && <Navbar />}
                <div className="container" style={{ paddingTop: isIQTest ? '100px' : '80px', textAlign: 'center' }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Error Loading Analytics</h2>
                    <p style={{ color: t.textSec }}>{error || "Could not find test results."}</p>
                    <Button onClick={() => router.back()} style={{ marginTop: '24px' }}>Go Back</Button>
                </div>
            </main>
        );
    }

    // — Data computation —
    const questionsList = test.questions || [];
    let correct = 0, incorrect = 0, skipped = 0;
    
    const questionDetails = questionsList.map((q, idx) => {
        if (q.isUnrated) return null;
        const ans = (result.answers || {})[idx];
        let status = 'skipped';
        if (ans !== undefined) {
            status = ans == (q.correctOption || q.correctOptionIndex) ? 'correct' : 'incorrect';
        }
        if (status === 'correct') correct++;
        else if (status === 'incorrect') incorrect++;
        else skipped++;
        return { idx, status };
    }).filter(Boolean);

    const totalAttempted = correct + incorrect;
    const totalRated = correct + incorrect + skipped;
    const accuracy = totalAttempted > 0 ? Math.round((correct / totalAttempted) * 100) : 0;
    const scorePercent = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;

    // Rank computation
    const userRankIdx = leaderboard.findIndex(lb => lb._id === currentUserId);
    const userRank = userRankIdx >= 0 ? userRankIdx + 1 : 0;
    const totalParticipants = leaderboard.length;
    const percentile = totalParticipants > 1 && userRank > 0
        ? Math.round(((totalParticipants - userRank) / (totalParticipants - 1)) * 100)
        : (totalParticipants === 1 && userRank === 1 ? 100 : 0);

    // Avg & top scores from leaderboard
    const avgScore = totalParticipants > 0
        ? Math.round(leaderboard.reduce((s, lb) => s + (lb.score || 0), 0) / totalParticipants)
        : 0;
    const topScore = totalParticipants > 0 ? leaderboard[0]?.score || 0 : 0;
    const scoreDiffFromAvg = result.score - avgScore;

    const pieData = [
        { name: 'Correct', value: correct, color: '#22c55e' },
        { name: 'Incorrect', value: incorrect, color: '#ef4444' },
        { name: 'Skipped', value: skipped, color: dark ? '#334155' : '#cbd5e1' }
    ].filter(d => d.value > 0);

    const formatTime = (seconds) => {
        if (!seconds) return '0s';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.round(seconds % 60);
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    const handleBack = () => {
        if (isIQTest) router.push(`/iq-tests/${testId}`);
        else if (courseId) router.push(`/courses/${courseId}/mock-test/${testId}`);
        else router.back();
    };

    // Grade letter
    const getGrade = (pct) => {
        if (pct >= 90) return { letter: 'A+', color: '#22c55e' };
        if (pct >= 80) return { letter: 'A', color: '#22c55e' };
        if (pct >= 70) return { letter: 'B', color: '#60a5fa' };
        if (pct >= 60) return { letter: 'C', color: '#fbbf24' };
        if (pct >= 50) return { letter: 'D', color: '#f97316' };
        return { letter: 'F', color: '#ef4444' };
    };
    const grade = getGrade(scorePercent);

    return (
        <>
        <style>{`
            .ana-page { min-height: 100vh; }
            .ana-wrap { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
            
            .ana-fade-up {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
            }
            .ana-fade-up.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .ana-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
            .ana-stat {
                padding: 18px;
                border-radius: 12px;
                background: ${t.cardBg};
                border: 1px solid ${t.cardBorder};
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
            }
            .ana-stat-label {
                font-size: 0.72rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                margin-bottom: 6px;
            }
            .ana-stat-val {
                font-size: 1.6rem;
                font-weight: 700;
                line-height: 1.2;
                color: ${t.text};
            }
            .ana-stat-sub { font-size: 0.78rem; margin-top: 4px; }
            .ana-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
            .ana-card {
                border-radius: 14px;
                background: ${t.cardBg};
                border: 1px solid ${t.cardBorder};
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
            }
            .ana-card-head {
                padding: 18px 22px 14px;
                font-size: 0.95rem;
                font-weight: 650;
                color: ${t.text};
                display: flex;
                align-items: center;
                gap: 8px;
                border-bottom: 1px solid ${t.sectionBorder};
            }
            .ana-card-body { padding: 20px 22px; }
            .ana-q-row {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 0;
                border-bottom: 1px solid ${dark ? 'rgba(26,34,54,0.6)' : '#f1f5f9'};
                font-size: 0.82rem;
            }
            .ana-q-row:last-child { border-bottom: none; }
            .ana-q-num { width: 38px; font-weight: 600; color: ${t.textSec}; }
            .ana-q-badge {
                padding: 2px 10px;
                border-radius: 5px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            .ana-lb-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 20px;
                transition: background 0.15s;
            }
            .ana-lb-info { display: flex; align-items: center; gap: 12px; min-width: 0; }
            .ana-lb-rank { width: 26px; text-align: center; font-weight: 700; font-size: 0.82rem; flex-shrink: 0; }
            .ana-lb-name { font-weight: 600; font-size: 0.88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .ana-lb-time { font-size: 0.72rem; color: ${t.textMuted}; display: flex; align-items: center; gap: 3px; margin-top: 2px; }
            .ana-lb-score {
                padding: 3px 12px;
                border-radius: 6px;
                font-weight: 700;
                font-size: 0.82rem;
                flex-shrink: 0;
            }
            @media (max-width: 768px) {
                .ana-stat-grid { grid-template-columns: repeat(2, 1fr); }
                .ana-grid { grid-template-columns: 1fr; }
            }
        `}</style>

        <main className="ana-page" style={{ background: t.pageBg }}>
            {isIQTest && <Navbar />}
            <div className="ana-wrap" style={{ paddingTop: isIQTest ? '100px' : '40px', paddingBottom: '80px' }}>

                {/* Back */}
                <button
                    onClick={handleBack}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'none', border: 'none', color: t.textSec,
                        fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer',
                        padding: '8px 0', marginBottom: '20px'
                    }}
                >
                    <ChevronLeft size={16} /> Back to test
                </button>

                {/* Title bar */}
                <div className={`ana-fade-up ${isVisible ? 'visible' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{
                            fontSize: '1.5rem', fontWeight: '700', color: t.text, margin: 0,
                            background: 'none', WebkitTextFillColor: t.text
                        }}>
                            {test.title}
                        </h1>
                        <p style={{ color: t.textSec, fontSize: '0.85rem', marginTop: '4px' }}>
                            Performance Report
                        </p>
                    </div>
                    {/* Grade badge */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 16px', borderRadius: '10px',
                        background: `${grade.color}15`, border: `1px solid ${grade.color}30`
                    }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: grade.color }}>{grade.letter}</span>
                        <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: '600', color: grade.color, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Grade</p>
                            <p style={{ fontSize: '0.75rem', color: t.textSec, margin: 0 }}>{scorePercent}% score</p>
                        </div>
                    </div>
                </div>

                {/* Stat cards */}
                <div className={`ana-stat-grid ana-fade-up ${isVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.1s' }}>
                    <div className="ana-stat">
                        <p className="ana-stat-label" style={{ color: '#60a5fa' }}>Score</p>
                        <p className="ana-stat-val">{result.score}<span style={{ fontSize: '0.9rem', color: t.textMuted, fontWeight: '400' }}> / {result.totalMarks || totalRated * 4}</span></p>
                        <p className="ana-stat-sub" style={{ color: scoreDiffFromAvg >= 0 ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {scoreDiffFromAvg >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                            {Math.abs(scoreDiffFromAvg)} {scoreDiffFromAvg >= 0 ? 'above' : 'below'} avg
                        </p>
                    </div>
                    <div className="ana-stat">
                        <p className="ana-stat-label" style={{ color: '#4ade80' }}>Accuracy</p>
                        <p className="ana-stat-val">{accuracy}%</p>
                        <p className="ana-stat-sub" style={{ color: t.textMuted }}>{correct}/{totalAttempted} correct</p>
                    </div>
                    <div className="ana-stat">
                        <p className="ana-stat-label" style={{ color: '#fb923c' }}>Time Taken</p>
                        <p className="ana-stat-val">{formatTime(result.totalTime)}</p>
                        <p className="ana-stat-sub" style={{ color: t.textMuted }}>of {test.duration || 180} min</p>
                    </div>
                    <div className="ana-stat">
                        <p className="ana-stat-label" style={{ color: '#c084fc' }}>Percentile</p>
                        <p className="ana-stat-val">{percentile}%</p>
                        <p className="ana-stat-sub" style={{ color: t.textMuted }}>
                            {userRank > 0 ? `Rank #${userRank}` : 'N/A'} / {totalParticipants}
                        </p>
                    </div>
                </div>

                {/* Main grid */}
                <div className={`ana-grid ana-fade-up ${isVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.2s' }}>
                    {/* Left column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* Pie + performance summary */}
                        <div className="ana-card">
                            <div className="ana-card-head">
                                <Target size={16} color="#60a5fa" /> Question Analysis
                            </div>
                            <div className="ana-card-body" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {/* Pie */}
                                <div style={{ width: '160px', height: '160px', position: 'relative', flexShrink: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                                                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <RechartsTooltip content={({ active, payload }) => {
                                                if (active && payload?.[0]) {
                                                    const d = payload[0].payload;
                                                    return <div style={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: '6px', padding: '8px 12px', fontSize: '0.8rem' }}>
                                                        <p style={{ color: d.color, fontWeight: '600' }}>{d.name}: {d.value}</p>
                                                    </div>;
                                                }
                                                return null;
                                            }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '1.4rem', fontWeight: '700', color: t.text }}>{totalRated}</span>
                                        <span style={{ fontSize: '0.65rem', color: t.textMuted, textTransform: 'uppercase' }}>Total</span>
                                    </div>
                                </div>
                                {/* Stats beside pie */}
                                <div style={{ flex: 1, minWidth: '120px' }}>
                                    {[
                                        { label: 'Correct', val: correct, color: '#22c55e', icon: <CheckCircle size={13} /> },
                                        { label: 'Incorrect', val: incorrect, color: '#ef4444', icon: <XCircle size={13} /> },
                                        { label: 'Skipped', val: skipped, color: t.textMuted, icon: <Minus size={13} /> },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 2 ? `1px solid ${t.sectionBorder}` : 'none' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: item.color, fontSize: '0.82rem', fontWeight: '500' }}>
                                                {item.icon} {item.label}
                                            </span>
                                            <span style={{ fontWeight: '700', color: t.text, fontSize: '0.9rem' }}>{item.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Performance comparison */}
                        <div className="ana-card">
                            <div className="ana-card-head">
                                <BarChart2 size={16} color="#a78bfa" /> How You Compare
                            </div>
                            <div className="ana-card-body">
                                {/* Score bars */}
                                {[
                                    { label: 'Your Score', value: result.score, max: result.totalMarks || totalRated * 4, color: '#818cf8' },
                                    { label: 'Average Score', value: avgScore, max: result.totalMarks || totalRated * 4, color: '#64748b' },
                                    { label: 'Top Score', value: topScore, max: result.totalMarks || totalRated * 4, color: '#fbbf24' },
                                ].map((bar, i) => {
                                    const pct = bar.max > 0 ? Math.max(0, (bar.value / bar.max) * 100) : 0;
                                    return (
                                        <div key={i} style={{ marginBottom: i < 2 ? '16px' : 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: '500', color: t.textSec }}>{bar.label}</span>
                                                <span style={{ fontSize: '0.78rem', fontWeight: '600', color: t.text }}>{bar.value}</span>
                                            </div>
                                            <div style={{ height: '6px', borderRadius: '3px', background: dark ? '#111827' : '#e2e8f0' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: '3px',
                                                    width: `${Math.min(pct, 100)}%`,
                                                    background: bar.color,
                                                    transition: 'width 0.8s ease-out'
                                                }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Question breakdown table */}
                        <div className="ana-card">
                            <div className="ana-card-head">
                                <Hash size={16} color="#fbbf24" /> Question Status
                            </div>
                            <div className="ana-card-body" style={{ padding: '12px 22px', maxHeight: '340px', overflowY: 'auto' }}>
                                {questionDetails.map((q) => (
                                    <div key={q.idx} className="ana-q-row">
                                        <span className="ana-q-num">Q{q.idx + 1}</span>
                                        <span className="ana-q-badge" style={{
                                            background: q.status === 'correct' ? 'rgba(34,197,94,0.12)' : q.status === 'incorrect' ? 'rgba(239,68,68,0.12)' : `${t.statGlass}`,
                                            color: q.status === 'correct' ? '#22c55e' : q.status === 'incorrect' ? '#ef4444' : t.textMuted
                                        }}>
                                            {q.status === 'correct' ? 'Correct' : q.status === 'incorrect' ? 'Wrong' : 'Skipped'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* Leaderboard */}
                        <div className="ana-card">
                            <div className="ana-card-head" style={{ background: dark ? '#0a0f1a' : '#f8fafc' }}>
                                <Trophy size={16} color="#eab308" /> Leaderboard
                                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: t.textMuted, fontWeight: '400' }}>
                                    {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div>
                                {leaderboard.length === 0 ? (
                                    <div style={{ padding: '48px 20px', textAlign: 'center', color: t.textMuted }}>
                                        <p style={{ fontSize: '0.9rem' }}>No results yet</p>
                                    </div>
                                ) : (
                                    leaderboard.map((lb, i) => {
                                        const isMe = lb._id === currentUserId;
                                        const medals = ['#eab308', '#94a3b8', '#cd7f32'];
                                        return (
                                            <div key={i} className="ana-lb-row" style={{
                                                background: isMe ? t.lbHighlight : t.lbRowBg,
                                                borderBottom: i < leaderboard.length - 1 ? `1px solid ${t.sectionBorder}` : 'none'
                                            }}>
                                                <div className="ana-lb-info">
                                                    <span className="ana-lb-rank" style={{ color: i < 3 ? medals[i] : t.textMuted }}>
                                                        {i < 3 ? `${i + 1}` : `${i + 1}`}
                                                    </span>
                                                    <div>
                                                        <p className="ana-lb-name" style={{ color: isMe ? t.lbHighlightText : t.text, margin: 0 }}>
                                                            {lb.name}
                                                            {isMe && <span style={{
                                                                fontSize: '0.6rem', marginLeft: '8px', padding: '1px 7px',
                                                                borderRadius: '4px', background: t.lbBadgeBg, color: t.lbHighlightText, fontWeight: '500'
                                                            }}>You</span>}
                                                        </p>
                                                        <p className="ana-lb-time"><Clock size={9} /> {formatTime(lb.totalTime)}</p>
                                                    </div>
                                                </div>
                                                <span className="ana-lb-score" style={{
                                                    background: isMe ? t.lbScoreHighlight : t.lbScoreBg,
                                                    color: isMe ? t.lbHighlightText : t.text
                                                }}>
                                                    {lb.score}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Score Summary */}
                        <div className="ana-card">
                            <div className="ana-card-head">
                                <Percent size={16} color="#22c55e" /> Score Summary
                            </div>
                            <div className="ana-card-body">
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                    <tbody>
                                        {[
                                            ['Total Questions', totalRated],
                                            ['Attempted', totalAttempted],
                                            ['Correct Answers', correct],
                                            ['Incorrect Answers', incorrect],
                                            ['Unanswered', skipped],
                                            ['Your Score', `${result.score} / ${result.totalMarks || totalRated * 4}`],
                                            ['Score Percentage', `${scorePercent}%`],
                                            ['Accuracy', `${accuracy}%`],
                                            ['Time Used', formatTime(result.totalTime)],
                                            ['Percentile', `${percentile}%`],
                                        ].map(([label, val], i) => (
                                            <tr key={i} style={{ borderBottom: `1px solid ${dark ? 'rgba(26,34,54,0.6)' : '#f1f5f9'}` }}>
                                                <td style={{ padding: '9px 0', color: t.textSec, fontWeight: '500' }}>{label}</td>
                                                <td style={{ padding: '9px 0', color: t.text, fontWeight: '600', textAlign: 'right' }}>{val}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        </>
    );
}
