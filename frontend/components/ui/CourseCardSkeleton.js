'use client';

import Skeleton from './Skeleton';

export default function CourseCardSkeleton() {
    return (
        <div style={{ padding: '20px', border: '1px solid #1e293b', borderRadius: '12px', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
            <Skeleton width="100%" height="160px" borderRadius="8px" style={{ marginBottom: '16px' }} />
            <Skeleton width="70%" height="24px" style={{ marginBottom: '12px' }} />
            <Skeleton width="40%" height="20px" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                <Skeleton width="60px" height="24px" />
                <Skeleton width="100px" height="36px" borderRadius="8px" />
            </div>
        </div>
    );
}
