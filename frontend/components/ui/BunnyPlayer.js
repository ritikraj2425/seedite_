'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * BunnyPlayer — a lightweight wrapper for the Bunny.net iframe embed.
 * Relies completely on Bunny's native player (so thumbnails and controls work normally)
 * while adding our custom logic for:
 * - Resuming from `localStorage`
 * - Saving progress via postMessage
 * - Mobile landscape orientation lock on fullscreen
 */

function parseBunnyEmbedUrl(url) {
    if (!url) return null;
    const match = url.match(/mediadelivery\.net\/embed\/(\d+)\/([a-f0-9-]+)/i);
    if (match) return { libraryId: match[1], videoId: match[2] };
    return null;
}

function buildEmbedUrl(src, resumeTime) {
    let urlStr = src;
    if (urlStr.startsWith('//')) urlStr = 'https:' + urlStr;
    else if (!urlStr.startsWith('http')) urlStr = 'https://' + urlStr;

    try {
        const urlObj = new URL(urlStr);
        urlObj.searchParams.set('responsive', 'true');
        urlObj.searchParams.set('preload', 'true');
        
        if (resumeTime > 5) {
            urlObj.searchParams.set('t', Math.floor(resumeTime).toString());
        }
        return urlObj.toString();
    } catch (e) {
        return src;
    }
}

function getResumeKey(lectureId) {
    return `seedite_resume_${lectureId}`;
}

export default function BunnyPlayer({ src, poster, lectureId }) {
    const containerRef = useRef(null);
    const [mounted, setMounted] = useState(false);
    const [resumeTime, setResumeTime] = useState(0);

    const parsed = parseBunnyEmbedUrl(src);
    const resumeKey = lectureId ? getResumeKey(lectureId) : (parsed ? getResumeKey(parsed.videoId) : null);

    // Initial load block & fetch stored time
    useEffect(() => {
        if (resumeKey) {
            const saved = parseFloat(localStorage.getItem(resumeKey) || '0');
            if (saved > 5 && !isNaN(saved)) {
                setResumeTime(saved);
            }
        }
        setMounted(true);
    }, [resumeKey]);

    // Listen for progress to save
    useEffect(() => {
        if (!resumeKey || !mounted) return;

        const handleMessage = (event) => {
            if (!event.data || typeof event.data !== 'string') return;
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'videoProgress' && data.data) {
                    const currentTime = data.data.currentTime;
                    if (currentTime > 0) {
                        localStorage.setItem(resumeKey, currentTime.toString());
                    }
                }
            } catch (e) {
                // Ignore parsing errors for other messages
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [resumeKey, mounted]);

    // Lock orientation to landscape when entering fullscreen
    useEffect(() => {
        const handleFSChange = () => {
            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);

            if (isFull) {
                if (screen.orientation && screen.orientation.lock) {
                    try { 
                        const lockPromise = screen.orientation.lock('landscape');
                        if (lockPromise) {
                            lockPromise.catch(e => {
                                // Ignore error on desktop where lock is not available
                            });
                        }
                    } catch (e) { }
                }
            } else {
                if (screen.orientation && screen.orientation.unlock) {
                    try { screen.orientation.unlock(); } catch (e) { }
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFSChange);
        document.addEventListener('webkitfullscreenchange', handleFSChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFSChange);
            document.removeEventListener('webkitfullscreenchange', handleFSChange);
        };
    }, []);

    // Wait until we fetch resume time before rendering iframe to ensure '?t=X' is present
    if (!mounted) return null;

    const embedUrl = buildEmbedUrl(src, resumeTime);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
                overflow: 'hidden',
            }}
        >
            <iframe
                src={embedUrl}
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    border: 'none',
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
                allowFullScreen
                loading="eager"
                referrerPolicy="no-referrer"
                playsInline
                title="Video Player"
            />
        </div>
    );
}
