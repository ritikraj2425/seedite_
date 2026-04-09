'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getCurrentUserId, apiFetch } from '@/lib/api';

/**
 * BunnyPlayer — Production-grade Bunny.net iframe embed with progress tracking.
 *
 * CRITICAL FIX: All localStorage keys are scoped to the current userId
 * to prevent cross-user data leakage (User A's completion showing for User B).
 *
 * Tracking strategy (dual-mode):
 *   MODE A — Automatic (player.js postMessage protocol)
 *   MODE B — Manual fallback ("Mark as Watched" button)
 *
 * PRODUCTION: To enable Mode A, whitelist your domain in Bunny Dashboard →
 *   Stream → Library → Security → Allowed Referrers, then change
 *   referrerPolicy from "no-referrer" to "origin".
 */

const PLAYERJS_CONTEXT = 'player.js';
const PLAYERJS_VERSION = '0.0.11';
const FALLBACK_DELAY_MS = 8000;

// ---- User-scoped localStorage keys ----
function userKey(prefix, lectureId) {
    const uid = getCurrentUserId();
    return uid ? `seedite_${prefix}_${uid}_${lectureId}` : `seedite_${prefix}_anon_${lectureId}`;
}

function safeGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch { }
}

function buildEmbedUrl(src, resumeTime) {
    let urlStr = src;
    if (urlStr.startsWith('//')) urlStr = 'https:' + urlStr;
    else if (!urlStr.startsWith('http')) urlStr = 'https://' + urlStr;
    try {
        const urlObj = new URL(urlStr);
        urlObj.searchParams.set('responsive', 'true');
        urlObj.searchParams.set('preload', 'true');
        urlObj.searchParams.set('autoplay', 'false');
        if (resumeTime > 5) urlObj.searchParams.set('t', Math.floor(resumeTime).toString());
        return urlObj.toString();
    } catch { return src; }
}

function getIframeOrigin(src) {
    try {
        let u = src;
        if (u.startsWith('//')) u = 'https:' + u;
        else if (!u.startsWith('http')) u = 'https://' + u;
        return new URL(u).origin;
    } catch { return '*'; }
}

export default function BunnyPlayer({ src, poster, lectureId }) {
    const iframeRef = useRef(null);
    const [mounted, setMounted] = useState(false);
    const [resumeTime, setResumeTime] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [showManualBtn, setShowManualBtn] = useState(false);

    // Tracking refs
    const watchedSecondsRef = useRef(new Set());
    const completionFiredRef = useRef(false);
    const lastTimeRef = useRef(null);
    const iframeOrigin = useRef(getIframeOrigin(src));
    const gotTimeupdateRef = useRef(false);
    const currentUserIdRef = useRef('');

    // ---- Phase 1: Restore state (user-scoped) ----
    useEffect(() => {
        if (!lectureId) { setMounted(true); return; }

        const uid = getCurrentUserId();
        currentUserIdRef.current = uid;

        // Restore resume time (user-scoped)
        const resumeKey = userKey('resume', lectureId);
        const savedResume = parseFloat(safeGet(resumeKey) || '0');
        if (savedResume > 5 && !isNaN(savedResume)) setResumeTime(savedResume);

        // Restore completion status (user-scoped)
        const completedKey = userKey('completed', lectureId);
        if (safeGet(completedKey) === 'true') {
            setCompleted(true);
            completionFiredRef.current = true;
        } else {
            setCompleted(false);
            completionFiredRef.current = false;
        }

        // Restore watched seconds (user-scoped)
        const watchedKey = userKey('watched', lectureId);
        const watchedJson = safeGet(watchedKey);
        if (watchedJson) {
            try {
                const arr = JSON.parse(watchedJson);
                if (Array.isArray(arr)) watchedSecondsRef.current = new Set(arr);
            } catch { watchedSecondsRef.current = new Set(); }
        } else {
            watchedSecondsRef.current = new Set();
        }

        // Reset event detection
        gotTimeupdateRef.current = false;
        lastTimeRef.current = null;

        setMounted(true);
    }, [lectureId]);

    // ---- Completion API with retry ----
    const fireCompletion = useCallback(() => {
        if (completionFiredRef.current) return;
        completionFiredRef.current = true;
        setCompleted(true);
        setShowManualBtn(false);

        // Save locally (user-scoped)
        safeSet(userKey('completed', lectureId), 'true');

        const pathParts = window.location.pathname.split('/');
        const courseIdx = pathParts.indexOf('courses');
        const courseId = courseIdx !== -1 ? pathParts[courseIdx + 1] : null;

        if (!courseId || !lectureId) {
            window.postMessage({ type: 'lectureCompleted', lectureId }, '*');
            return;
        }

        const attempt = (n) => {
            apiFetch('/api/progress/complete-lecture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, lectureId })
            })
                .then(async (res) => {
                    if (!res.ok && n < 3) {
                        setTimeout(() => attempt(n + 1), 1000 * Math.pow(2, n));
                        return;
                    }
                    const data = await res.json().catch(() => ({}));
                    window.postMessage({ type: 'lectureCompleted', lectureId }, '*');
                })
                .catch((err) => {
                    // apiFetch throws on 401 → auto-logout handles it
                    if (err.message.includes('Session expired')) return;
                    if (n < 3) {
                        setTimeout(() => attempt(n + 1), 1000 * Math.pow(2, n));
                    } else {
                        completionFiredRef.current = false;
                    }
                });
        };

        attempt(0);
    }, [lectureId]);

    // ---- Phase 2: player.js protocol + fallback ----
    useEffect(() => {
        if (!mounted || !lectureId || completionFiredRef.current) return;

        const listenerId = 'seedite-' + Math.random().toString(36).substr(2, 9);

        const persistWatched = () => {
            if (watchedSecondsRef.current.size > 0) {
                safeSet(userKey('watched', lectureId), JSON.stringify(Array.from(watchedSecondsRef.current)));
            }
        };

        const subscribeToPlayer = () => {
            const iframe = iframeRef.current;
            if (!iframe?.contentWindow) return;
            const origin = iframeOrigin.current || '*';

            ['timeupdate', 'ended', 'play'].forEach((evt, i) => {
                iframe.contentWindow.postMessage(JSON.stringify({
                    context: PLAYERJS_CONTEXT,
                    version: PLAYERJS_VERSION,
                    method: 'addEventListener',
                    value: evt,
                    listener: listenerId + (i > 0 ? `-${evt}` : '')
                }), origin);
            });
        };

        const handleMessage = (event) => {
            if (!event.data) return;

            let data;
            if (typeof event.data === 'string') {
                try { data = JSON.parse(event.data); } catch { return; }
            } else if (typeof event.data === 'object') {
                data = event.data;
            } else { return; }

            if (data.context !== PLAYERJS_CONTEXT) return;

            if (data.event === 'ready') {
                subscribeToPlayer();
                return;
            }

            if (data.event === 'timeupdate' && data.value) {
                const currentTime = data.value.seconds;
                const duration = data.value.duration;
                if (typeof currentTime !== 'number' || typeof duration !== 'number' || duration <= 0) return;

                if (!gotTimeupdateRef.current) {
                    gotTimeupdateRef.current = true;
                    setShowManualBtn(false);
                }

                if (currentTime > 0) safeSet(userKey('resume', lectureId), currentTime.toString());

                if (currentTime > 0) {
                    const last = lastTimeRef.current;
                    if (last !== null && currentTime > last && (currentTime - last) <= 5) {
                        for (let t = Math.floor(last); t <= Math.floor(currentTime); t++) {
                            watchedSecondsRef.current.add(t);
                        }
                    } else {
                        watchedSecondsRef.current.add(Math.floor(currentTime));
                    }
                    lastTimeRef.current = currentTime;
                }

                if (Math.floor(currentTime) % 5 === 0) persistWatched();

                if (!completionFiredRef.current) {
                    const threshold = Math.floor(duration * 0.7);
                    if (watchedSecondsRef.current.size >= threshold) {
                        persistWatched();
                        fireCompletion();
                    }
                }
            }

            if (data.event === 'ended') {
                persistWatched();
                if (!completionFiredRef.current) fireCompletion();
            }
        };

        window.addEventListener('message', handleMessage);

        // Fallback: show manual button if no timeupdate events arrive
        const fallbackTimer = setTimeout(() => {
            if (!gotTimeupdateRef.current && !completionFiredRef.current) {
                setShowManualBtn(true);
            }
        }, FALLBACK_DELAY_MS);

        const handleUnload = () => persistWatched();
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('beforeunload', handleUnload);
            clearTimeout(fallbackTimer);
            persistWatched();
        };
    }, [mounted, lectureId, src, fireCompletion]);

    // Fullscreen orientation lock (mobile)
    useEffect(() => {
        const handler = () => {
            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
            if (isFull && screen.orientation?.lock) {
                try { screen.orientation.lock('landscape').catch(() => { }); } catch { }
            } else if (!isFull && screen.orientation?.unlock) {
                try { screen.orientation.unlock(); } catch { }
            }
        };
        document.addEventListener('fullscreenchange', handler);
        document.addEventListener('webkitfullscreenchange', handler);
        return () => {
            document.removeEventListener('fullscreenchange', handler);
            document.removeEventListener('webkitfullscreenchange', handler);
        };
    }, []);

    if (!mounted) return null;
    const embedUrl = buildEmbedUrl(src, resumeTime);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000', overflow: 'hidden' }}>
            <iframe
                ref={iframeRef}
                src={embedUrl}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
                allowFullScreen
                loading="eager"
                referrerPolicy="no-referrer"
                playsInline
                title="Video Player"
            />

            {completed && (
                <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'rgba(34, 197, 94, 0.9)', color: 'white',
                    padding: '6px 14px', borderRadius: '20px',
                    fontSize: '0.8rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '6px',
                    zIndex: 10, pointerEvents: 'none', backdropFilter: 'blur(4px)',
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Completed
                </div>
            )}

            {showManualBtn && !completed && (
                <button
                    onClick={(e) => { e.stopPropagation(); fireCompletion(); }}
                    style={{
                        position: 'absolute', bottom: '16px', right: '16px',
                        background: 'rgba(37, 99, 235, 0.95)', color: 'white',
                        padding: '10px 20px', borderRadius: '24px',
                        fontSize: '0.85rem', fontWeight: 600,
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        zIndex: 10, backdropFilter: 'blur(4px)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                        transition: 'transform 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(29, 78, 216, 0.95)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(37, 99, 235, 0.95)'; }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Mark as Watched
                </button>
            )}
        </div>
    );
}
