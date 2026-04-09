'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Shield, Clock, Star, Play, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

// ─── Styles (updated for global font consistency) ───────────────────────────
const css = `

  .p-root {
    min-height: 100vh;
    background: #f7f7f9;
    color: #1a1a2e;
    /* 👇 Match global font – replace with your site's actual font stack */
    font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
    font-weight: 400;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Hero ── */
  .p-hero {
    background: #ffffff;
    border-bottom: 1px solid #ebebf0;
    padding: 48px 0 52px;
    position: relative;
    overflow: hidden;
  }
  .p-hero::after {
    content: '';
    position: absolute;
    top: -80px;
    right: -80px;
    width: 420px;
    height: 420px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  .p-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
    position: relative;
    z-index: 1;
  }

  .p-back {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    padding: 7px 16px;
    border-radius: 100px;
    text-decoration: none;
    margin-bottom: 36px;
    transition: background 0.15s, color 0.15s;
  }
  .p-back:hover { background: #ededf5; color: #4338ca; }

  .p-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    color: #4338ca;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 100px;
    margin-bottom: 18px;
  }

  .p-title {
    font-size: clamp(2rem, 4.5vw, 3.1rem);
    font-weight: 500;
    line-height: 1.2;
    color: #111827;
    margin: 0 0 10px;
  }

  .p-meta {
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
    margin-top: 18px;
  }
  .p-meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    color: #6b7280;
  }
  .p-meta-sep {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #d1d5db;
  }

  /* ── Stats row ── */
  .p-stats {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 32px;
  }
  .p-stat {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px 22px;
    min-width: 128px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .p-stat:hover {
    border-color: #c7d2fe;
    box-shadow: 0 4px 16px rgba(99,102,241,0.08);
  }
  .p-stat-num {
    font-size: 1.8rem;
    font-weight: 500;
    color: #111827;
    line-height: 1.2;
    margin-bottom: 4px;
  }
  .p-stat-label {
    font-size: 0.7rem;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ── Section ── */
  .p-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 52px 32px 96px;
  }
  .p-section-hd {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .p-section-eyebrow {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #6366f1;
    margin-bottom: 5px;
  }
  .p-section-title {
    font-size: 1.6rem;
    font-weight: 500;
    color: #111827;
    margin: 0;
  }
  .p-section-count {
    font-size: 1rem;
    font-weight: 400;
    color: #9ca3af;
    margin-left: 8px;
  }
  .p-section-right {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.875rem;
    color: #6b7280;
    background: white;
    border: 1px solid #e5e7eb;
    padding: 8px 16px;
    border-radius: 100px;
  }

  /* ── Course Grid ── */
  .p-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 22px;
  }

  .p-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.22s, transform 0.22s, box-shadow 0.22s;
  }
  .p-card:hover {
    border-color: #a5b4fc;
    transform: translateY(-3px);
    box-shadow: 0 16px 48px -8px rgba(99,102,241,0.14);
  }

  .p-thumb {
    position: relative;
    height: 192px;
    background: #f3f4f6;
    overflow: hidden;
  }
  .p-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
  .p-card:hover .p-thumb img { transform: scale(1.05); }

  .p-thumb-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 55%);
  }
  .p-thumb-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(99,102,241,0.2);
    color: #4338ca;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 100px;
  }
  .p-play-btn {
    position: absolute;
    bottom: 12px;
    right: 12px;
    width: 38px;
    height: 38px;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.2s, transform 0.2s;
  }
  .p-card:hover .p-play-btn { opacity: 1; transform: scale(1); }

  .p-body {
    padding: 20px 22px 22px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .p-course-title {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    line-height: 1.45;
    margin: 0 0 16px;
  }

  /* Progress */
  .p-prog-wrap { margin-bottom: 18px; }
  .p-prog-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 7px;
  }
  .p-prog-lbl {
    font-size: 0.7rem;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .p-prog-pct { font-size: 0.75rem; font-weight: 600; }
  .p-prog-track {
    height: 5px;
    background: #f3f4f6;
    border-radius: 3px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }
  .p-prog-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
  }

  /* CTA buttons */
  .p-cta {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 13px 20px;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: opacity 0.18s, transform 0.15s;
    text-decoration: none;
  }
  .p-cta:hover { opacity: 0.88; transform: translateY(-1px); }
  .p-cta:active { transform: scale(0.98); }
  .p-cta-primary {
    background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
    color: #fff;
    box-shadow: 0 6px 20px -4px rgba(67,56,202,0.28);
  }
  .p-cta-success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #15803d;
  }
  .p-cta-ghost {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    color: #374151;
  }

  /* ── Empty state ── */
  .p-empty {
    text-align: center;
    padding: 80px 40px;
    background: white;
    border: 1.5px dashed #e5e7eb;
    border-radius: 24px;
  }
  .p-empty-icon {
    width: 68px;
    height: 68px;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }
  .p-empty-title {
    font-weight: 500;
    font-size: 1.4rem;
    color: #111827;
    margin: 0 0 10px;
  }
  .p-empty-body {
    color: #6b7280;
    max-width: 360px;
    margin: 0 auto;
    line-height: 1.6;
    font-size: 0.95rem;
  }

  /* ── Error ── */
  .p-err-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f7f7f9;
  }
  .p-err-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 24px;
    padding: 56px 48px;
    max-width: 420px;
    text-align: center;
    box-shadow: 0 8px 40px rgba(0,0,0,0.06);
  }
  .p-err-icon {
    width: 68px;
    height: 68px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
  }

  /* ── Skeleton ── */
  @keyframes p-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .p-skel {
    background: linear-gradient(90deg, #f0f0f4 25%, #e8e8f0 50%, #f0f0f4 75%);
    background-size: 1200px 100%;
    animation: p-shimmer 1.5s infinite linear;
    border-radius: 8px;
  }
  .p-skel-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    overflow: hidden;
  }
`;

// ─── Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="p-skel-card">
            <div className="p-skel" style={{ height: 192 }} />
            <div style={{ padding: '20px 22px 22px' }}>
                <div className="p-skel" style={{ height: 17, borderRadius: 6, marginBottom: 9 }} />
                <div className="p-skel" style={{ height: 13, width: '58%', borderRadius: 6, marginBottom: 24 }} />
                <div className="p-skel" style={{ height: 5, borderRadius: 3, marginBottom: 22 }} />
                <div className="p-skel" style={{ height: 44, borderRadius: 12 }} />
            </div>
        </div>
    );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function CollegePortalPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [portalData, setPortalData] = useState(null);
    const [progressMap, setProgressMap] = useState({});

    useEffect(() => {
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = savedUser.token;

        if (!token) {
            router.push(`/login?redirect=/college/${slug}`);
            return;
        }

        const fetchPortal = async () => {
            try {
                const res = await fetch(`${API_URL}/api/college/${slug}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPortalData(data);

                    fetch(`${API_URL}/api/progress`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                        .then(r => r.ok ? r.json() : [])
                        .then(progressData => {
                            const map = {};
                            (progressData || []).forEach(p => {
                                map[p.course?._id || p.course] = p.progressPercentage;
                            });
                            setProgressMap(map);
                        })
                        .catch(() => { });
                } else {
                    const errData = await res.json();
                    setError(errData.message || 'Access denied');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load college portal');
            } finally {
                setLoading(false);
            }
        };

        fetchPortal();
    }, [slug, router]);

    // ── Loading ──
    if (loading) return (
        <>
            <style>{css}</style>
            <div className="p-root">
                <div className="p-hero">
                    <div className="p-inner">
                        <div className="p-skel" style={{ height: 34, width: 110, borderRadius: 100, marginBottom: 36 }} />
                        <div className="p-skel" style={{ height: 22, width: 160, borderRadius: 100, marginBottom: 18 }} />
                        <div className="p-skel" style={{ height: 48, width: '50%', borderRadius: 8, marginBottom: 10 }} />
                        <div className="p-skel" style={{ height: 14, width: '28%', borderRadius: 6, marginTop: 20 }} />
                        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                            {Array(4).fill(0).map((_, i) => (
                                <div key={i} className="p-skel" style={{ height: 72, width: 128, borderRadius: 14 }} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-section">
                    <div className="p-grid">
                        {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </div>
            </div>
        </>
    );

    // ── Error ──
    if (error) return (
        <>
            <style>{css}</style>
            <div className="p-err-wrap">
                <div className="p-err-card">
                    <div className="p-err-icon">
                        <Shield size={30} color="#ef4444" />
                    </div>
                    <h2 style={{ fontWeight: 400, fontSize: '1.5rem', color: '#111827', marginBottom: 10 }}>
                        Access Restricted
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.65 }}>{error}</p>
                    <Link href="/dashboard">
                        <Button variant="outline" style={{ maxWidth: 220, margin: '0 auto' }}>
                            <ArrowLeft size={14} />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </>
    );

    const totalCourses = portalData?.courses?.length || 0;
    const completedCount = Object.values(progressMap).filter(p => p >= 100).length;
    const inProgressCount = Object.values(progressMap).filter(p => p > 0 && p < 100).length;
    const avgProgress = totalCourses > 0
        ? Math.round(Object.values(progressMap).reduce((a, b) => a + b, 0) / totalCourses)
        : 0;

    return (
        <>
            <style>{css}</style>
            <div className="p-root">

                {/* ── Hero ── */}
                <div className="p-hero">
                    <div className="p-inner">

                        <Link href="/dashboard" className="p-back">
                            <ArrowLeft size={13} />
                            Dashboard
                        </Link>

                        <div className="p-badge">
                            <GraduationCap size={12} />
                            College Portal
                        </div>

                        <h1 className="p-title">
                            Welcome to {portalData?.collegeName}
                        </h1>

                        <div className="p-meta">
                            <span className="p-meta-item">
                                <Star size={13} color="#6366f1" />
                                Institutional Access
                            </span>
                            <span className="p-meta-sep" />
                            <span className="p-meta-item">
                                <Clock size={13} color="#6366f1" />
                                Member since&nbsp;
                                {portalData?.memberSince
                                    ? new Date(portalData.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                    : '—'}
                            </span>
                        </div>

                        <div className="p-stats">
                            {[
                                { num: totalCourses, label: 'Courses Assigned' },
                                { num: completedCount, label: 'Completed' },
                                { num: inProgressCount, label: 'In Progress' },
                                { num: `${avgProgress}%`, label: 'Avg. Progress' },
                            ].map(({ num, label }) => (
                                <div className="p-stat" key={label}>
                                    <div className="p-stat-num">{num}</div>
                                    <div className="p-stat-label">{label}</div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                {/* ── Courses ── */}
                <div className="p-section">
                    <div className="p-section-hd">
                        <div>
                            <div className="p-section-eyebrow">Your Learning Path</div>
                            <h2 className="p-section-title">
                                Assigned Courses
                                <span className="p-section-count">({totalCourses})</span>
                            </h2>
                        </div>
                        <div className="p-section-right">
                            <BookOpen size={13} color="#6366f1" />
                            {completedCount} of {totalCourses} complete
                        </div>
                    </div>

                    {totalCourses > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
                            {portalData.courses.map((course) => (
                                <Link key={course._id} href={`/courses/${course._id}`}>
                                    <div className="modern-card" style={{
                                        padding: '0',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <div style={{
                                            height: '170px',
                                            background: '#f1f5f9',
                                            overflow: 'hidden',
                                            position: 'relative'
                                        }}>
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.3s ease'
                                                }}
                                                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                background: 'linear-gradient(135deg, #4338ca, #6366f1)',
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                College Access
                                            </div>
                                        </div>
                                        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{
                                                fontSize: '1.15rem',
                                                marginBottom: '12px',
                                                color: '#0f172a',
                                                fontWeight: '700'
                                            }}>
                                                {course.title}
                                            </h3>

                                            {/* Progress Bar */}
                                            {(() => {
                                                const prog = progressMap[course._id] || 0;
                                                return (
                                                    <div style={{ marginBottom: '16px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Progress</span>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: prog >= 70 ? '#16a34a' : '#4338ca' }}>{prog}%</span>
                                                        </div>
                                                        <div style={{
                                                            width: '100%',
                                                            height: '6px',
                                                            background: '#e2e8f0',
                                                            borderRadius: '3px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                width: `${prog}%`,
                                                                height: '100%',
                                                                background: prog >= 70 ? 'linear-gradient(90deg, #16a34a, #22c55e)' : 'linear-gradient(90deg, #4338ca, #6366f1)',
                                                                borderRadius: '3px',
                                                                transition: 'width 0.5s ease'
                                                            }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            <div style={{ marginTop: 'auto' }}>
                                                <Button style={{
                                                    width: '100%',
                                                    fontSize: '1.1rem',
                                                    padding: '16px 32px',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 8px 30px -4px rgba(67, 56, 202, 0.35)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    Start Learning
                                                    <ArrowRight size={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-empty">
                            <div className="p-empty-icon">
                                <GraduationCap size={30} color="#4338ca" />
                            </div>
                            <h3 className="p-empty-title">No Courses Yet</h3>
                            <p className="p-empty-body">
                                Your college hasn't assigned any courses to this portal yet.
                                Please contact your institution to get started.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}