'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, RotateCcw, RotateCw, ChevronUp } from 'lucide-react';

export default function VideoPlayer({ src, poster }) {
    const videoRef = useRef(null);
    const progressRef = useRef(null);
    const containerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const controlsTimeoutRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            const current = video.currentTime;
            const dur = video.duration;
            setCurrentTime(current);
            if (dur > 0) {
                setProgress((current / dur) * 100);
            }
        };

        const onLoadedMetadata = () => {
            setDuration(video.duration);
        };

        const onEnded = () => {
            setIsPlaying(false);
        };

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('ended', onEnded);

        return () => {
            video.removeEventListener('timeupdate', updateProgress);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('ended', onEnded);
        };
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
            setShowSettings(false);
        }
    };

    const handleProgressChange = (e) => {
        const newProgress = parseFloat(e.target.value);
        const newTime = (newProgress / 100) * duration;
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
            setProgress(newProgress);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            const newMuted = !isMuted;
            videoRef.current.muted = newMuted;
            setIsMuted(newMuted);
            if (newMuted) {
                setVolume(0);
            } else {
                setVolume(1);
                videoRef.current.volume = 1;
            }
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        }
    };

    const toggleFullscreen = async () => {
        const video = videoRef.current;
        const container = containerRef.current;

        if (!video || !container) return;

        try {
            // Standard Fullscreen (Desktop / Android)
            if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
                if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                    // Enter Fullscreen
                    if (container.requestFullscreen) {
                        await container.requestFullscreen();
                    } else if (container.webkitRequestFullscreen) {
                        await container.webkitRequestFullscreen();
                    }

                    setIsFullscreen(true);

                    // Attempt Landscape Lock (Android)
                    if (screen.orientation && screen.orientation.lock) {
                        try {
                            await screen.orientation.lock('landscape');
                        } catch (err) {
                            // Orientation lock might fail on some devices/browsers, safe to ignore
                            console.log('Orientation lock not supported or blocked');
                        }
                    }
                } else {
                    // Exit Fullscreen
                    if (document.exitFullscreen) {
                        await document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        await document.webkitExitFullscreen();
                    }
                    setIsFullscreen(false);

                    // Unlock Orientation
                    if (screen.orientation && screen.orientation.unlock) {
                        screen.orientation.unlock();
                    }
                }
            }
            // iOS Fallback (Use Native Player)
            else if (video.webkitEnterFullscreen) {
                video.webkitEnterFullscreen();
                // iOS native player handles controls and orientation automatically
            }
        } catch (err) {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        }
        setShowSettings(false);
    };

    const skipTime = (seconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    const changePlaybackRate = (rate) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
            setShowSettings(false);
        }
    };

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                setShowSettings(false);
            }, 3000);
        }
    };

    return (
        <div
            ref={containerRef}
            className="video-container group"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
                overflow: 'hidden',
                borderRadius: isFullscreen ? '0' : '8px',
                userSelect: 'none'
            }}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                onClick={togglePlay}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onContextMenu={(e) => e.preventDefault()}
                playsInline
                onWaiting={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    pointerEvents: 'none'
                }}>
                    <div className="video-loader"></div>
                    <style jsx>{`
                        .video-loader {
                            width: 48px;
                            height: 48px;
                            border: 5px solid rgba(255, 255, 255, 0.3);
                            border-radius: 50%;
                            border-top-color: #6366f1;
                            animation: spin 1s ease-in-out infinite;
                        }
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}

            {/* Controls Overlay */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
                padding: '20px',
                opacity: showControls ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: showControls ? 'auto' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}>
                {/* Progress Bar */}
                <div style={{ position: 'relative', width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', cursor: 'pointer' }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: `${progress}%`,
                        background: '#6366f1',
                        borderRadius: '2px'
                    }}></div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={progress}
                        onChange={handleProgressChange}
                        style={{
                            position: 'absolute',
                            top: '-6px',
                            left: 0,
                            width: '100%',
                            height: '16px',
                            opacity: 0,
                            cursor: 'pointer'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>

                    {/* Left Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <button onClick={togglePlay} className="hover-scale" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button onClick={() => skipTime(-10)} title="-10s" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <RotateCcw size={18} />
                            </button>
                            <button onClick={() => skipTime(10)} title="+10s" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <RotateCw size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontFamily: 'monospace', color: '#e2e8f0' }}>
                            <span>{formatTime(currentTime)}</span>
                            <span style={{ opacity: 0.5 }}>/</span>
                            <span>{formatTime(duration)}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }} className="volume-control mobile-hide">
                            <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={handleVolumeChange}
                                style={{ width: '60px', accentColor: 'white', height: '4px', cursor: 'pointer' }}
                            />
                        </div>
                    </div>

                    {/* Right Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

                        {/* Settings / Speed */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{playbackRate}x</span>
                                <Settings size={20} />
                            </button>

                            {showSettings && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '40px',
                                    right: '-10px',
                                    background: 'rgba(15, 23, 42, 0.95)',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    minWidth: '120px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                                }}>
                                    {/* Playback Speed */}
                                    <div style={{ marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', padding: '4px 8px', display: 'block' }}>Speed</span>
                                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                            <button
                                                key={rate}
                                                onClick={() => changePlaybackRate(rate)}
                                                style={{
                                                    background: playbackRate === rate ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                                    color: playbackRate === rate ? '#818cf8' : 'white',
                                                    border: 'none',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    fontSize: '13px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    width: '100%'
                                                }}
                                            >
                                                {rate}x
                                                {playbackRate === rate && <span>✓</span>}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Quality Placeholder (Requires Transcoding) */}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', padding: '4px 8px', display: 'block' }}>Quality</span>
                                        <button
                                            style={{
                                                background: 'rgba(99, 102, 241, 0.2)',
                                                color: '#818cf8',
                                                border: 'none',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '13px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                width: '100%'
                                            }}
                                        >
                                            Auto (1080p) <span>✓</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Play Button Overlay (when paused) */}
            {!isPlaying && (
                <div
                    onClick={togglePlay}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '72px',
                        height: '72px',
                        background: 'rgba(99, 102, 241, 0.9)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
                    }}
                >
                    <Play size={36} fill="white" color="white" style={{ marginLeft: '4px' }} />
                </div>
            )}
        </div>
    );
}
