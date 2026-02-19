'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Grid, Moon, Sun, Maximize, Minimize, X } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ url, userDetails }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showThumbnails, setShowThumbnails] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [pageWidth, setPageWidth] = useState(500);

    const containerRef = useRef(null);
    const viewerRef = useRef(null);

    // Drag-to-pan state
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

    // Mobile check
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Calculate page width based on viewer size
    useEffect(() => {
        const updatePageWidth = () => {
            if (viewerRef.current) {
                const width = viewerRef.current.clientWidth;
                setPageWidth(Math.max(280, width - (isMobile ? 24 : 48)));
            }
        };

        updatePageWidth();
        window.addEventListener('resize', updatePageWidth);

        // Update after state changes that affect layout
        const timer = setTimeout(updatePageWidth, 100);

        return () => {
            window.removeEventListener('resize', updatePageWidth);
            clearTimeout(timer);
        };
    }, [isMobile, showThumbnails, isFullscreen]);

    // Fullscreen toggle - uses CSS fullscreen mode
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Security
    useEffect(() => {
        const prevent = (e) => e.preventDefault();
        document.addEventListener('contextmenu', prevent);
        document.addEventListener('selectstart', prevent);

        const handleKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c', 'a'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        };
        document.addEventListener('keydown', handleKey);

        return () => {
            document.removeEventListener('contextmenu', prevent);
            document.removeEventListener('selectstart', prevent);
            document.removeEventListener('keydown', handleKey);
        };
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e) => {
            if (e.target.tagName === 'INPUT') return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    if (pageNumber > 1) { e.preventDefault(); setPageNumber(p => p - 1); }
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                case ' ':
                    if (pageNumber < numPages) { e.preventDefault(); setPageNumber(p => p + 1); }
                    break;
                case 'Home':
                    e.preventDefault(); setPageNumber(1);
                    break;
                case 'End':
                    e.preventDefault(); setPageNumber(numPages || 1);
                    break;
                case 'Escape':
                    if (isFullscreen) { e.preventDefault(); setIsFullscreen(false); }
                    break;
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [pageNumber, numPages, isFullscreen]);

    // Watermarks
    const watermarks = useMemo(() => {
        const arr = [];
        for (let i = 0; i < 6; i++) {
            arr.push({
                top: `${15 + (i * 15) % 70}%`,
                left: `${10 + (i * 18) % 80}%`,
                rotation: i % 2 === 0 ? -25 : 25,
            });
        }
        return arr;
    }, []);

    // Drag-to-pan handlers
    // Drag-to-pan handlers
    const handleDragMove = (e) => {
        if (!isDragging.current) return;
        const viewer = viewerRef.current;
        if (!viewer) return;

        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        const dx = clientX - dragStart.current.x;
        const dy = clientY - dragStart.current.y;

        viewer.scrollLeft = dragStart.current.scrollLeft - dx;
        viewer.scrollTop = dragStart.current.scrollTop - dy;
    };

    const handleDragEnd = () => {
        isDragging.current = false;
        const viewer = viewerRef.current;
        if (viewer) {
            viewer.style.cursor = 'grab';
        }

        // Remove window listeners
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
    };

    const handleDragStart = (e) => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        // Force enable drag - browser handles scroll clamping
        isDragging.current = true;
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        dragStart.current = {
            x: clientX,
            y: clientY,
            scrollLeft: viewer.scrollLeft,
            scrollTop: viewer.scrollTop,
        };

        viewer.style.cursor = 'grabbing';

        // Attach window listeners to catch events outside element
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchmove', handleDragMove, { passive: false });
        window.addEventListener('touchend', handleDragEnd);

        // Prevent text selection
        e.preventDefault();
    };

    const zoomPresets = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const bg = darkMode ? '#0f172a' : '#f1f5f9';
    const toolbar = darkMode ? '#1e293b' : '#fff';
    const text = darkMode ? '#f1f5f9' : '#0f172a';
    const btn = darkMode ? '#334155' : '#e2e8f0';

    const ToolButton = ({ onClick, active, disabled, children, title }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{
                padding: '6px',
                borderRadius: '6px',
                background: active ? '#3b82f6' : btn,
                color: active ? '#fff' : text,
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {children}
        </button>
    );

    return (
        <div
            ref={containerRef}
            style={{
                // Use fixed positioning when fullscreen, relative otherwise
                position: isFullscreen ? 'fixed' : 'relative',
                top: isFullscreen ? 0 : 'auto',
                left: isFullscreen ? 0 : 'auto',
                right: isFullscreen ? 0 : 'auto',
                bottom: isFullscreen ? 0 : 'auto',
                zIndex: isFullscreen ? 9999 : 1,
                width: isFullscreen ? '100vw' : '100%',
                height: isFullscreen ? '100vh' : '100%',
                minHeight: isFullscreen ? 'auto' : '500px',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: bg,
                overflow: 'hidden',
                userSelect: 'none',
            }}
        >
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isMobile ? '8px 10px' : '10px 16px',
                backgroundColor: toolbar,
                borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                gap: '8px',
                flexWrap: 'wrap',
                flexShrink: 0,
            }}>
                {/* Left */}
                <ToolButton onClick={() => setShowThumbnails(!showThumbnails)} active={showThumbnails} title="Pages">
                    <Grid size={14} />
                </ToolButton>

                {/* Center - Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ToolButton onClick={() => setPageNumber(p => p - 1)} disabled={pageNumber <= 1} title="Previous">
                        <ChevronLeft size={16} />
                    </ToolButton>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: text }}>
                        <input
                            type="number"
                            value={pageNumber}
                            min={1}
                            max={numPages || 1}
                            onChange={(e) => {
                                const v = parseInt(e.target.value);
                                if (v >= 1 && v <= numPages) setPageNumber(v);
                            }}
                            style={{
                                width: '40px',
                                padding: '4px',
                                borderRadius: '4px',
                                background: btn,
                                color: text,
                                border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                                textAlign: 'center',
                                fontSize: '12px',
                            }}
                        />
                        <span style={{ opacity: 0.7 }}>/ {numPages || '-'}</span>
                    </div>
                    <ToolButton onClick={() => setPageNumber(p => p + 1)} disabled={pageNumber >= numPages} title="Next">
                        <ChevronRight size={16} />
                    </ToolButton>
                </div>

                {/* Right - Zoom & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: btn, borderRadius: '6px', padding: '2px' }}>
                        <ToolButton onClick={() => setScale(s => Math.max(0.5, s - 0.25))} title="Zoom Out">
                            <ZoomOut size={14} />
                        </ToolButton>
                        <select
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            style={{
                                padding: '4px',
                                background: 'transparent',
                                color: text,
                                border: 'none',
                                fontSize: '11px',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            {zoomPresets.map(z => <option key={z} value={z}>{Math.round(z * 100)}%</option>)}
                        </select>
                        <ToolButton onClick={() => setScale(s => Math.min(3, s + 0.25))} title="Zoom In">
                            <ZoomIn size={14} />
                        </ToolButton>
                    </div>
                    <ToolButton onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate">
                        <RotateCw size={14} />
                    </ToolButton>
                    <ToolButton onClick={() => setDarkMode(!darkMode)} title="Theme">
                        {darkMode ? <Sun size={14} /> : <Moon size={14} />}
                    </ToolButton>
                    <ToolButton onClick={toggleFullscreen} active={isFullscreen} title="Fullscreen">
                        {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                    </ToolButton>
                </div>
            </div>

            {/* Main Area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                {/* Thumbnails */}
                {showThumbnails && (
                    <div style={{
                        width: isMobile ? '100%' : '180px',
                        backgroundColor: toolbar,
                        borderRight: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                        overflowY: 'auto',
                        padding: '12px',
                        position: isMobile ? 'absolute' : 'relative',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        zIndex: 50,
                        boxShadow: isMobile ? '4px 0 20px rgba(0,0,0,0.3)' : 'none',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', color: text }}>
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>Pages</span>
                            <button onClick={() => setShowThumbnails(false)} style={{ background: btn, border: 'none', color: text, padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(5, 1fr)' : 'repeat(2, 1fr)', gap: '6px' }}>
                            {Array.from({ length: numPages || 0 }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setPageNumber(i + 1); if (isMobile) setShowThumbnails(false); }}
                                    style={{
                                        padding: '8px 4px',
                                        borderRadius: '4px',
                                        backgroundColor: pageNumber === i + 1 ? '#3b82f6' : btn,
                                        border: 'none',
                                        color: pageNumber === i + 1 ? '#fff' : text,
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div
                    ref={viewerRef}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    // MouseMove/Up are now on window
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        position: 'relative',
                        backgroundColor: bg,
                        cursor: 'grab',
                        userSelect: 'none', // Force no selection
                        touchAction: 'none', // Prevent browser touch actions like scrolling
                    }}
                >
                    <div style={{
                        minWidth: '100%',
                        minHeight: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: isMobile ? '12px' : '20px',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{
                            position: 'relative',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            backgroundColor: '#fff',
                            flexShrink: 0,
                            maxWidth: 'none'
                        }}>
                            {/* Watermarks */}
                            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
                                {watermarks.map((w, i) => (
                                    <div key={i} style={{
                                        position: 'absolute',
                                        top: w.top,
                                        left: w.left,
                                        transform: `translate(-50%, -50%) rotate(${w.rotation}deg)`,
                                        color: 'rgba(0,0,0,0.06)',
                                        fontSize: isMobile ? '10px' : '11px',
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {i % 2 === 0 ? `© ${userDetails?.email || 'User'}` : userDetails?.email}
                                    </div>
                                ))}

                            </div>

                            {/* PDF Document */}
                            <Document
                                file={url ? `/api/pdf-proxy?url=${encodeURIComponent(url)}` : null}
                                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                loading={<div style={{ padding: '40px', textAlign: 'center', color: '#64748b', minWidth: '300px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
                                error={<div style={{ padding: '40px', textAlign: 'center', color: '#ef4444', minWidth: '280px' }}>Failed to load PDF</div>}
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    scale={scale}
                                    rotate={rotation}
                                    width={pageWidth}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    loading={<div style={{ width: pageWidth, minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>Loading page...</div>}
                                />
                            </Document>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile page indicator */}
            {isMobile && !isFullscreen && (
                <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    zIndex: 30,
                }}>
                    {pageNumber} / {numPages}
                </div>
            )}

            {/* Exit fullscreen button (visible in fullscreen) */}


            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}