'use client';
import Skeleton from './Skeleton';

export default function Loader() {
    return (
        <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
            {/* Navbar Skeleton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <Skeleton width="150px" height="40px" />
                <div style={{ display: 'flex', gap: '20px' }}>
                    <Skeleton width="80px" height="36px" />
                    <Skeleton width="80px" height="36px" />
                </div>
            </div>

            {/* Hero / Content Skeleton */}
            <div style={{ display: 'grid', gap: '32px' }}>
                <Skeleton width="100%" height="200px" borderRadius="12px" />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    <div style={{ padding: '20px', border: '1px solid #1e293b', borderRadius: '12px', background: '#0f172a' }}>
                        <Skeleton width="100%" height="160px" borderRadius="8px" style={{ marginBottom: '16px' }} />
                        <Skeleton width="70%" height="24px" style={{ marginBottom: '12px' }} />
                        <Skeleton width="40%" height="20px" />
                    </div>
                    <div style={{ padding: '20px', border: '1px solid #1e293b', borderRadius: '12px', background: '#0f172a' }}>
                        <Skeleton width="100%" height="160px" borderRadius="8px" style={{ marginBottom: '16px' }} />
                        <Skeleton width="70%" height="24px" style={{ marginBottom: '12px' }} />
                        <Skeleton width="40%" height="20px" />
                    </div>
                    <div style={{ padding: '20px', border: '1px solid #1e293b', borderRadius: '12px', background: '#0f172a' }}>
                        <Skeleton width="100%" height="160px" borderRadius="8px" style={{ marginBottom: '16px' }} />
                        <Skeleton width="70%" height="24px" style={{ marginBottom: '12px' }} />
                        <Skeleton width="40%" height="20px" />
                    </div>
                </div>
            </div>
        </div>
    );
}
