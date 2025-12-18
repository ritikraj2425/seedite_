'use client';

export default function Skeleton({ width, height, borderRadius = '4px', style = {} }) {
    return (
        <div
            className="skeleton"
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius: borderRadius,
                backgroundColor: '#1e293b',
                ...style
            }}
        >
            <style jsx>{`
                .skeleton {
                    position: relative;
                    overflow: hidden;
                }
                .skeleton::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    transform: translateX(-100%);
                    background-image: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0,
                        rgba(255, 255, 255, 0.05) 20%,
                        rgba(255, 255, 255, 0.1) 60%,
                        rgba(255, 255, 255, 0)
                    );
                    animation: shimmer 1.5s infinite;
                }
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
}
