'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
    ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight,
    Grid, Moon, Sun, Shield, Lock, Move
} from 'lucide-react';

// Set worker source to CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfViewer = ({ url, userDetails }) => {
    // Core states
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [containerWidth, setContainerWidth] = useState(600);
    const containerRef = useRef(null);
    const pdfContainerRef = useRef(null);
    const pdfContentRef = useRef(null);

    // Dragging states
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);

    // Feature states
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showThumbnails, setShowThumbnails] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [pdfInfo, setPdfInfo] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [enableDrag, setEnableDrag] = useState(true);

    // Check mobile view
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        const resizeHandler = () => checkMobile();
        window.addEventListener('resize', resizeHandler);
        return () => window.removeEventListener('resize', resizeHandler);
    }, []);



    // Document info handler
    function onDocumentLoadSuccess({ numPages, ...info }) {
        setNumPages(numPages);
        setPdfInfo(info);
    }

    // Responsive Width Handler
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                setContainerWidth(Math.min(width, isMobile ? width - 20 : 1200) - 40);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);

        return () => {
            window.removeEventListener('resize', updateWidth);
        };
    }, [isMobile]);

    // FIXED: Fullscreen handler
    const toggleFullscreen = useCallback(() => {
        const element = pdfContainerRef.current;

        if (!element) return;

        if (!isFullscreen) {
            // Enter fullscreen
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            }
            setIsFullscreen(true);
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            setIsFullscreen(false);
        }
    }, [isFullscreen]);

    // Handle fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // SECURITY MEASURES
    useEffect(() => {
        const preventDefault = (e) => e.preventDefault();

        // Disable right-click and text selection
        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('selectstart', preventDefault);

        // Prevent keyboard shortcuts
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c', 'a'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Add CSS to prevent selection
        const style = document.createElement('style');
        style.innerHTML = '* { user-select: none !important; -webkit-user-select: none !important; }';
        document.head.appendChild(style);

        return () => {
            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('selectstart', preventDefault);
            document.removeEventListener('keydown', handleKeyDown);
            document.head.removeChild(style);
        };
    }, []);

    // FIXED: Dragging functionality
    const handleMouseDown = (e) => {
        if (!enableDrag) return;

        setIsDragging(true);
        setStartX(e.pageX);
        setStartY(e.pageY);
        setScrollLeft(containerRef.current.scrollLeft);
        setScrollTop(containerRef.current.scrollTop);

        // Set cursor
        e.currentTarget.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !enableDrag) return;

        e.preventDefault();
        const x = e.pageX;
        const y = e.pageY;
        const walkX = (startX - x) * 2; // Multiply for faster dragging
        const walkY = (startY - y) * 2;

        if (containerRef.current) {
            containerRef.current.scrollLeft = scrollLeft + walkX;
            containerRef.current.scrollTop = scrollTop + walkY;
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (containerRef.current) {
            containerRef.current.style.cursor = 'grab';
        }
    };

    // Zoom presets - FIXED with proper percentages
    const zoomPresets = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

    // Handle zoom changes
    const handleZoomIn = () => {
        setScale(prev => Math.min(5, Math.round((prev + 0.1) * 10) / 10));
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(0.1, Math.round((prev - 0.1) * 10) / 10));
    };

    // Watermark date
    const watermarkDate = new Date().toLocaleDateString();

    // Generate watermark positions for 10 emails
    const watermarkPositions = useMemo(() => {
        const positions = [];
        // Create positions for 10 watermarks
        for (let i = 0; i < 10; i++) {
            positions.push({
                top: `${(i * 10) % 100}%`,
                left: `${(i * 12) % 100}%`,
                rotation: i % 2 === 0 ? -45 : 45,
                fontSize: isMobile ? 14 : 16 + (i % 4),
                opacity: 0.08 + (i % 5) * 0.02,
                emailIndex: i,
                variant: i % 3
            });
        }
        return positions;
    }, [isMobile]);

    // Handle page number input
    const handlePageInput = (e) => {
        const val = parseInt(e.target.value);
        if (val >= 1 && val <= numPages) {
            setPageNumber(val);
        }
    };

    // Toggle drag mode
    const toggleDragMode = () => {
        setEnableDrag(!enableDrag);
        if (containerRef.current) {
            containerRef.current.style.cursor = enableDrag ? 'default' : 'grab';
        }
    };

    return (
        <div
            ref={pdfContainerRef}
            className="pdf-viewer-container"
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                width: '100vw',
                backgroundColor: darkMode ? '#111827' : '#f9fafb',
                overflow: 'hidden',
                position: 'relative',
                userSelect: 'none',
                WebkitUserSelect: 'none'
            }}
        >
            {/* Thumbnails Sidebar */}
            {showThumbnails && (
                <div style={{
                    width: isMobile ? '100%' : '280px',
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    borderRight: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    overflowY: 'auto',
                    padding: isMobile ? '12px' : '16px',
                    zIndex: 40,
                    position: isMobile ? 'fixed' : 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: isMobile ? 0 : 'auto',
                    boxShadow: isMobile ? '0 4px 20px rgba(0,0,0,0.3)' : 'none'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                        color: darkMode ? '#f3f4f6' : '#111827'
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: isMobile ? '14px' : '16px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Grid size={isMobile ? 16 : 18} />
                            Pages ({numPages || 0})
                        </h3>
                        <button
                            onClick={() => setShowThumbnails(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: darkMode ? '#9ca3af' : '#6b7280',
                                cursor: 'pointer',
                                fontSize: isMobile ? '16px' : '14px',
                                padding: isMobile ? '8px' : '4px'
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                        gap: isMobile ? '8px' : '12px'
                    }}>
                        {Array.from(new Array(numPages), (el, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setPageNumber(index + 1);
                                    if (isMobile) setShowThumbnails(false);
                                }}
                                style={{
                                    cursor: 'pointer',
                                    padding: isMobile ? '8px' : '12px',
                                    borderRadius: '8px',
                                    backgroundColor: pageNumber === index + 1
                                        ? darkMode ? '#3b82f6' : '#3b82f6'
                                        : darkMode ? '#374151' : '#f3f4f6',
                                    border: `2px solid ${pageNumber === index + 1
                                        ? '#3b82f6'
                                        : darkMode ? '#4b5563' : '#d1d5db'}`,
                                    position: 'relative',
                                    textAlign: 'left',
                                    color: pageNumber === index + 1 ? 'white' : 'inherit'
                                }}
                            >
                                <div style={{
                                    backgroundColor: darkMode ? '#4b5563' : '#e5e7eb',
                                    borderRadius: '6px',
                                    padding: isMobile ? '12px 4px' : '20px 8px',
                                    textAlign: 'center',
                                    marginBottom: isMobile ? '4px' : '8px',
                                    minHeight: isMobile ? '60px' : '80px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{
                                        fontSize: isMobile ? '10px' : '12px',
                                        color: darkMode ? '#d1d5db' : '#4b5563'
                                    }}>
                                        Page {index + 1}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                marginLeft: showThumbnails && !isMobile ? '280px' : '0',
                transition: 'margin-left 0.3s ease'
            }}>
                {/* Toolbar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '8px 12px' : '12px 20px',
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    color: darkMode ? '#f3f4f6' : '#111827',
                    zIndex: 50,
                    flexWrap: 'wrap',
                    gap: isMobile ? '8px' : '12px'
                }}>
                    {/* Left Controls */}
                    <div style={{
                        display: 'flex',
                        gap: isMobile ? '8px' : '12px',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => setShowThumbnails(!showThumbnails)}
                            style={{
                                padding: isMobile ? '6px 12px' : '8px 16px',
                                borderRadius: '6px',
                                background: darkMode ? '#374151' : '#f3f4f6',
                                color: darkMode ? '#f3f4f6' : '#111827',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: isMobile ? '12px' : '14px',
                                fontWeight: '500'
                            }}
                        >
                            <Grid size={isMobile ? 16 : 18} />
                            {isMobile ? (showThumbnails ? '✕' : '📄') : (showThumbnails ? 'Hide Pages' : 'Show Pages')}
                        </button>

                        {/* Drag Mode Toggle */}
                        <button
                            onClick={toggleDragMode}
                            style={{
                                padding: isMobile ? '6px 12px' : '8px 16px',
                                borderRadius: '6px',
                                background: enableDrag ? '#3b82f6' : (darkMode ? '#374151' : '#f3f4f6'),
                                color: enableDrag ? 'white' : (darkMode ? '#f3f4f6' : '#111827'),
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: isMobile ? '12px' : '14px',
                                fontWeight: '500'
                            }}
                        >
                            <Move size={isMobile ? 14 : 16} />
                            {isMobile ? 'Drag' : enableDrag ? 'Dragging ON' : 'Dragging OFF'}
                        </button>
                    </div>

                    {/* Center Controls - Navigation */}
                    <div style={{
                        display: 'flex',
                        gap: isMobile ? '6px' : '12px',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
                            <button
                                disabled={pageNumber <= 1}
                                onClick={() => setPageNumber(prev => prev - 1)}
                                style={{
                                    padding: isMobile ? '6px 8px' : '8px 12px',
                                    borderRadius: '6px',
                                    background: darkMode ? '#374151' : '#f3f4f6',
                                    color: darkMode ? '#f3f4f6' : '#111827',
                                    border: 'none',
                                    opacity: pageNumber <= 1 ? 0.5 : 1,
                                    cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <ChevronLeft size={isMobile ? 16 : 18} />
                            </button>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: isMobile ? '4px' : '8px',
                                minWidth: isMobile ? '100px' : '140px',
                                justifyContent: 'center'
                            }}>
                                <input
                                    type="number"
                                    min="1"
                                    max={numPages}
                                    value={pageNumber}
                                    onChange={handlePageInput}
                                    style={{
                                        width: isMobile ? '40px' : '60px',
                                        padding: isMobile ? '6px' : '8px',
                                        borderRadius: '6px',
                                        background: darkMode ? '#374151' : '#f3f4f6',
                                        color: darkMode ? '#f3f4f6' : '#111827',
                                        border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
                                        textAlign: 'center',
                                        fontSize: isMobile ? '12px' : '14px'
                                    }}
                                />
                                <span style={{
                                    fontSize: isMobile ? '12px' : '14px',
                                    color: darkMode ? '#d1d5db' : '#6b7280'
                                }}>
                                    / {numPages || '--'}
                                </span>
                            </div>

                            <button
                                disabled={pageNumber >= numPages}
                                onClick={() => setPageNumber(prev => prev + 1)}
                                style={{
                                    padding: isMobile ? '6px 8px' : '8px 12px',
                                    borderRadius: '6px',
                                    background: darkMode ? '#374151' : '#f3f4f6',
                                    color: darkMode ? '#f3f4f6' : '#111827',
                                    border: 'none',
                                    opacity: pageNumber >= numPages ? 0.5 : 1,
                                    cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <ChevronRight size={isMobile ? 16 : 18} />
                            </button>
                        </div>
                    </div>

                    {/* Right Controls */}
                    <div style={{
                        display: 'flex',
                        gap: isMobile ? '4px' : '8px',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {/* Zoom Controls - FIXED with proper percentage display */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            background: darkMode ? '#374151' : '#f3f4f6',
                            borderRadius: '6px',
                            padding: '2px'
                        }}>
                            <button
                                onClick={handleZoomOut}
                                style={{
                                    padding: isMobile ? '4px 6px' : '6px 8px',
                                    background: 'transparent',
                                    color: darkMode ? '#f3f4f6' : '#111827',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '4px'
                                }}
                                title="Zoom Out"
                            >
                                <ZoomOut size={isMobile ? 14 : 18} />
                            </button>

                            {/* FIXED: Display current zoom percentage */}
                            <div style={{
                                padding: isMobile ? '4px 8px' : '6px 12px',
                                borderRadius: '4px',
                                background: darkMode ? '#1f2937' : '#ffffff',
                                color: darkMode ? '#f3f4f6' : '#111827',
                                fontSize: isMobile ? '12px' : '14px',
                                minWidth: isMobile ? '70px' : '90px',
                                textAlign: 'center',
                                fontWeight: '600'
                            }}>
                                {Math.round(scale * 100)}%
                            </div>

                            <button
                                onClick={handleZoomIn}
                                style={{
                                    padding: isMobile ? '4px 6px' : '6px 8px',
                                    background: 'transparent',
                                    color: darkMode ? '#f3f4f6' : '#111827',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '4px'
                                }}
                                title="Zoom In"
                            >
                                <ZoomIn size={isMobile ? 14 : 18} />
                            </button>

                            {/* Zoom Presets Dropdown - FIXED */}
                            <select
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                style={{
                                    padding: isMobile ? '4px 6px' : '6px 12px',
                                    borderRadius: '4px',
                                    background: darkMode ? '#1f2937' : '#ffffff',
                                    color: darkMode ? '#f3f4f6' : '#111827',
                                    border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
                                    fontSize: isMobile ? '12px' : '14px',
                                    minWidth: isMobile ? '60px' : '80px',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    marginLeft: '4px'
                                }}
                            >
                                {zoomPresets.map((preset) => (
                                    <option key={preset} value={preset}>
                                        {Math.round(preset * 100)}%
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => setRotation((r) => (r + 90) % 360)}
                            style={{
                                padding: isMobile ? '6px 8px' : '8px 12px',
                                borderRadius: '6px',
                                background: darkMode ? '#374151' : '#f3f4f6',
                                color: darkMode ? '#f3f4f6' : '#111827',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: isMobile ? '12px' : '14px'
                            }}
                            title="Rotate"
                        >
                            <RotateCw size={isMobile ? 14 : 18} />
                        </button>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            style={{
                                padding: isMobile ? '6px 8px' : '8px 12px',
                                borderRadius: '6px',
                                background: darkMode ? '#374151' : '#f3f4f6',
                                color: darkMode ? '#f3f4f6' : '#111827',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: isMobile ? '12px' : '14px'
                            }}
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {darkMode ? <Sun size={isMobile ? 14 : 18} /> : <Moon size={isMobile ? 14 : 18} />}
                        </button>

                        <button
                            onClick={toggleFullscreen}
                            style={{
                                padding: isMobile ? '6px 8px' : '8px 12px',
                                borderRadius: '6px',
                                background: isFullscreen ? '#3b82f6' : (darkMode ? '#374151' : '#f3f4f6'),
                                color: isFullscreen ? 'white' : (darkMode ? '#f3f4f6' : '#111827'),
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: isMobile ? '12px' : '14px'
                            }}
                            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                        >
                            {isFullscreen ? (
                                <span style={{ fontSize: isMobile ? '14px' : '16px' }}>⎋</span>
                            ) : (
                                <span style={{ fontSize: isMobile ? '14px' : '16px' }}>⛶</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Viewer Area - FIXED with proper dragging */}
                <div
                    ref={containerRef}
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: isMobile ? '10px' : '20px',
                        position: 'relative',
                        backgroundColor: darkMode ? '#111827' : '#f9fafb',
                        WebkitOverflowScrolling: 'touch',
                        cursor: enableDrag ? 'grab' : 'default'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={(e) => {
                        if (!enableDrag) return;
                        const touch = e.touches[0];
                        setIsDragging(true);
                        setStartX(touch.pageX);
                        setStartY(touch.pageY);
                        setScrollLeft(containerRef.current.scrollLeft);
                        setScrollTop(containerRef.current.scrollTop);
                    }}
                    onTouchMove={(e) => {
                        if (!isDragging || !enableDrag) return;
                        e.preventDefault();
                        const touch = e.touches[0];
                        const x = touch.pageX;
                        const y = touch.pageY;
                        const walkX = (startX - x) * 2;
                        const walkY = (startY - y) * 2;

                        if (containerRef.current) {
                            containerRef.current.scrollLeft = scrollLeft + walkX;
                            containerRef.current.scrollTop = scrollTop + walkY;
                        }
                    }}
                    onTouchEnd={handleMouseUp}
                >
                    {/* PDF Container with 10 Email Copyright Watermarks */}
                    <div
                        ref={pdfContentRef}
                        style={{
                            position: 'relative',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            backgroundColor: 'white',
                            maxWidth: '100%',
                            userSelect: 'none'
                        }}
                    >
                        {/* Enhanced Watermark Container with 10 emails */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            pointerEvents: 'none',
                            zIndex: 10,
                            overflow: 'hidden',
                            userSelect: 'none'
                        }}>
                            {/* 10 Email Watermarks in Grid Pattern */}
                            {watermarkPositions.map((pos, index) => (
                                <div
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        top: pos.top,
                                        left: pos.left,
                                        transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
                                        color: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                                        fontSize: `${pos.fontSize}px`,
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        textAlign: 'center',
                                        pointerEvents: 'none',
                                        opacity: pos.opacity,
                                        fontFamily: 'Arial, sans-serif',
                                        letterSpacing: '0.5px',
                                        zIndex: 1,
                                        textShadow: darkMode
                                            ? '1px 1px 2px rgba(0,0,0,0.3)'
                                            : '1px 1px 2px rgba(255,255,255,0.5)',
                                    }}
                                >
                                    {pos.variant === 0 && `© ${userDetails?.email}`}
                                    {pos.variant === 1 && `${userDetails?.email} • ${watermarkDate}`}
                                </div>
                            ))}

                            {/* Dense Background Watermarks */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: `repeating-linear-gradient(
                                    45deg,
                                    transparent,
                                    transparent 100px,
                                    rgba(0,0,0,0.02) 100px,
                                    rgba(0,0,0,0.02) 200px
                                )`,
                                pointerEvents: 'none',
                                opacity: 0.3
                            }} />

                            {/* Large Center Watermark */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                fontSize: isMobile ? '36px' : '48px',
                                fontWeight: '900',
                                textAlign: 'center',
                                pointerEvents: 'none',
                                fontFamily: 'Arial, sans-serif',
                                textTransform: 'uppercase',
                                letterSpacing: '4px',
                                lineHeight: 1.2,
                                maxWidth: '80%',
                                wordBreak: 'break-word'
                            }}>
                                COPYRIGHT PROTECTED
                            </div>
                        </div>

                        {/* PDF Document */}
                        <Document
                            file={url ? `/api/pdf-proxy?url=${encodeURIComponent(url)}` : null}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                                <div style={{
                                    padding: isMobile ? '40px' : '60px',
                                    color: darkMode ? '#e5e7eb' : '#4b5563',
                                    textAlign: 'center',
                                    fontSize: isMobile ? '14px' : '16px',
                                    minWidth: isMobile ? '200px' : '400px',
                                    minHeight: isMobile ? '300px' : '600px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{
                                        width: isMobile ? '40px' : '60px',
                                        height: isMobile ? '40px' : '60px',
                                        border: `4px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                                        borderTopColor: '#3b82f6',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        marginBottom: isMobile ? '16px' : '20px'
                                    }} />
                                    <div style={{ marginBottom: isMobile ? '8px' : '10px', fontWeight: '600' }}>
                                        Loading Secure Document...
                                    </div>
                                </div>
                            }
                            error={
                                <div style={{
                                    padding: isMobile ? '40px' : '60px',
                                    color: '#ef4444',
                                    textAlign: 'center',
                                    fontSize: isMobile ? '14px' : '16px',
                                    minWidth: isMobile ? '200px' : '400px',
                                    minHeight: isMobile ? '300px' : '600px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: isMobile ? '16px' : '20px' }}>⚠️</div>
                                    <div style={{ fontWeight: '600', marginBottom: isMobile ? '8px' : '10px' }}>
                                        Error Loading PDF
                                    </div>
                                </div>
                            }
                        >
                            <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                width={containerWidth}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                rotate={rotation}
                                className={darkMode ? 'pdf-dark-theme' : 'pdf-light-theme'}
                                style={{
                                    backgroundColor: 'white',
                                    userSelect: 'none'
                                }}
                            />
                        </Document>
                    </div>
                </div>

                {/* Status Bar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '8px 12px' : '10px 20px',
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    borderTop: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    color: darkMode ? '#d1d5db' : '#6b7280',
                    fontSize: isMobile ? '11px' : '13px',
                    flexWrap: 'wrap',
                    gap: isMobile ? '6px' : '10px'
                }}>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '8px' : '16px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: '600' }}>Zoom:</span>
                            <span>{Math.round(scale * 100)}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: '600' }}>Rot:</span>
                            <span>{rotation}°</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: '600' }}>Drag:</span>
                            <span>{enableDrag ? 'ON' : 'OFF'}</span>
                        </div>
                        <div style={{
                            padding: '2px 8px',
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: isMobile ? '9px' : '11px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                        }}>
                            <Shield size={isMobile ? 10 : 12} />
                            {isMobile ? 'SECURE' : 'PROTECTED'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Fullscreen Exit Button */}
            {isFullscreen && isMobile && (
                <button
                    onClick={toggleFullscreen}
                    style={{
                        position: 'fixed',
                        top: '50px',
                        right: '2px',
                        zIndex: 10001,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px'
                    }}
                >
                    ✕ Exit
                </button>
            )}

            {/* Global Styles */}
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .pdf-dark-theme .react-pdf__Page__textContent {
                    filter: invert(1) hue-rotate(180deg);
                }

                .pdf-dark-theme .react-pdf__Page__annotations {
                    filter: invert(1) hue-rotate(180deg);
                }

                /* Improve scrolling */
                .pdf-viewer-container {
                    -webkit-overflow-scrolling: touch;
                }

                /* Mobile optimizations */
                @media (max-width: 768px) {
                    /* Prevent iOS zoom on input focus */
                    input[type="number"] {
                        font-size: 16px !important;
                    }
                }

                /* Fullscreen styles */
                :fullscreen .pdf-viewer-container {
                    width: 100vw !important;
                    height: 100vh !important;
                    background-color: ${darkMode ? '#111827' : '#f9fafb'} !important;
                }

                :-webkit-full-screen .pdf-viewer-container {
                    width: 100vw !important;
                    height: 100vh !important;
                    background-color: ${darkMode ? '#111827' : '#f9fafb'} !important;
                }

                /* Better cursor for dragging */
                .pdf-viewer-container [style*="cursor: grab"]:active {
                    cursor: grabbing !important;
                }
            `}</style>
        </div>
    );
};

export default PdfViewer;