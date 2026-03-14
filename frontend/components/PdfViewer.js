'use client';
import { useState, useEffect, useMemo } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

export default function PdfViewer({ url, userDetails }) {
    const [isMobile, setIsMobile] = useState(false);

    // Mobile check
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Security: block keyboard shortcuts for printing/saving
    useEffect(() => {
        const handleKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c', 'a'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        };
        document.addEventListener('keydown', handleKey);

        return () => {
            document.removeEventListener('keydown', handleKey);
        };
    }, []);

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

    // Clean toolbar with no Download, Print, or Open buttons
    const renderToolbar = (Toolbar) => (
        <Toolbar>
            {(slots) => {
                const {
                    CurrentPageInput, GoToNextPage, GoToPreviousPage, NumberOfPages,
                    ShowSearchPopover, Zoom, ZoomIn, ZoomOut, EnterFullScreen
                } = slots;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <ShowSearchPopover />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <GoToPreviousPage />
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                                <CurrentPageInput /> <span style={{ padding: '0 4px' }}>/</span> <NumberOfPages />
                            </div>
                            <GoToNextPage />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <ZoomOut />
                            <Zoom />
                            <ZoomIn />
                            <EnterFullScreen />
                        </div>
                    </div>
                );
            }}
        </Toolbar>
    );

    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        renderToolbar,
        sidebarTabs: (defaultTabs) => [
            defaultTabs[0], // Thumbnails
            defaultTabs[1], // Bookmarks
        ],
    });

    const proxyUrl = url ? `/api/pdf-proxy?url=${encodeURIComponent(url)}` : null;

    if (!proxyUrl) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444', minWidth: '280px' }}>
                No PDF URL provided
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '80vh', // Ensure a concrete height so the PDF virtualization works properly
                minHeight: '500px',
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Watermarks overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, overflow: 'hidden' }}>
                {watermarks.map((w, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        top: w.top,
                        left: w.left,
                        transform: `translate(-50%, -50%) rotate(${w.rotation}deg)`,
                        color: 'rgba(0, 0, 0, 0.15)', // Darker text for visibility on white PDF background
                        fontSize: isMobile ? '13px' : '15px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                    }}>
                        {i % 2 === 0 ? `© ${userDetails?.email || 'User'}` : userDetails?.email}
                    </div>
                ))}
            </div>

            {/* PDF Viewer */}
            <div style={{ position: 'absolute', inset: 0 }}>
                <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                    <Viewer
                        fileUrl={proxyUrl}
                        plugins={[defaultLayoutPluginInstance]}
                        defaultScale={isMobile ? SpecialZoomLevel.PageFit : SpecialZoomLevel.PageFit}
                        theme="dark"
                    />
                </Worker>
            </div>

            {/* CSS overrides for Dark theme */}
            <style jsx global>{`
                /* Dark theme adjustments */
                .rpv-core__viewer {
                    height: 100% !important;
                }
                
                .rpv-default-layout__container {
                    height: 100% !important;
                    border: none !important;
                }

                .rpv-default-layout__body {
                    background: #0f172a !important;
                }

                .rpv-default-layout__toolbar {
                    background: #1e293b !important;
                    border-bottom: 1px solid #334155 !important;
                }

                .rpv-default-layout__sidebar--opened {
                    background: #1e293b !important;
                }
            `}</style>
        </div>
    );
}