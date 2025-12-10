'use client';

export default function Loader({ text = 'Seedite' }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            minHeight: '300px',
            gap: '16px'
        }}>
            <div className="loader-ring">
                <div></div><div></div><div></div><div></div>
            </div>
            <h2 className="animate-pulse" style={{
                color: '#6366f1',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                letterSpacing: '2px'
            }}>
                {text}
            </h2>
            <style jsx>{`
                .loader-ring {
                    display: inline-block;
                    position: relative;
                    width: 80px;
                    height: 80px;
                }
                .loader-ring div {
                    box-sizing: border-box;
                    display: block;
                    position: absolute;
                    width: 64px;
                    height: 64px;
                    margin: 8px;
                    border: 8px solid #6366f1;
                    border-radius: 50%;
                    animation: loader-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
                    border-color: #6366f1 transparent transparent transparent;
                }
                .loader-ring div:nth-child(1) { animation-delay: -0.45s; }
                .loader-ring div:nth-child(2) { animation-delay: -0.3s; }
                .loader-ring div:nth-child(3) { animation-delay: -0.15s; }
                @keyframes loader-ring {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </div>
    );
}
