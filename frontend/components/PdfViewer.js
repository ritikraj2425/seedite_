'use client';
import { useState, useEffect } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

export default function PdfViewer({ url, userDetails }) {
    const [isMobile, setIsMobile] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Mobile check
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Fullscreen detection — re-render viewer when entering/exiting fullscreen 
    // so the PDF virtualizer recalculates its container dimensions
    useEffect(() => {
        const handler = () => {
            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
            setIsFullscreen(isFull);
        };
        document.addEventListener('fullscreenchange', handler);
        document.addEventListener('webkitfullscreenchange', handler);
        return () => {
            document.removeEventListener('fullscreenchange', handler);
            document.removeEventListener('webkitfullscreenchange', handler);
        };
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
                height: isFullscreen ? '100vh' : '80vh',
                minHeight: isFullscreen ? '100vh' : '500px',
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* PDF Viewer */}
            <div style={{ position: 'absolute', inset: 0 }}>
                <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                    <Viewer
                        fileUrl={proxyUrl}
                        plugins={[defaultLayoutPluginInstance]}
                        defaultScale={isMobile ? SpecialZoomLevel.PageWidth : SpecialZoomLevel.PageFit}
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

                /* Fix fullscreen rendering */
                :fullscreen .rpv-core__viewer,
                :-webkit-full-screen .rpv-core__viewer {
                    height: 100vh !important;
                }
                :fullscreen .rpv-default-layout__container,
                :-webkit-full-screen .rpv-default-layout__container {
                    height: 100vh !important;
                }
            `}</style>
        </div>
    );
}