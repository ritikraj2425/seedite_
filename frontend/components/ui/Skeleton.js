'use client';
import React from 'react';

// Base Skeleton with light theme shimmer
const Skeleton = ({
    width = '100%',
    height = '20px',
    borderRadius = '8px',
    style = {},
    variant = 'default' // 'default', 'text', 'circle', 'card', 'image'
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'circle':
                return { borderRadius: '50%' };
            case 'text':
                return { borderRadius: '4px', height: height || '14px' };
            case 'image':
                return { borderRadius: '12px', minHeight: '120px' };
            case 'card':
                return { borderRadius: '16px', minHeight: '200px' };
            default:
                return {};
        }
    };

    return (
        <div
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: '#f1f5f9',
                backgroundImage: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 40%, #f1f5f9 80%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
                ...getVariantStyles(),
                ...style
            }}
        />
    );
};

// Full Course Card Skeleton - for course listing pages
export const CourseCardSkeleton = () => (
    <div style={{
        padding: '0',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
    }}>
        <Skeleton variant="image" height="180px" borderRadius="0" style={{ borderRadius: 0 }} />
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton height="22px" width="85%" />
            <Skeleton height="14px" width="100%" />
            <Skeleton height="14px" width="70%" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <Skeleton height="24px" width="60px" />
                <Skeleton height="36px" width="100px" borderRadius="8px" />
            </div>
        </div>
    </div>
);

// Compact Course Card Skeleton - for featured sections
export const CompactCourseCardSkeleton = () => (
    <div style={{
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        background: '#ffffff',
        padding: '16px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center'
    }}>
        <Skeleton width="80px" height="60px" borderRadius="8px" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton height="18px" width="80%" />
            <Skeleton height="32px" width="120px" borderRadius="6px" />
        </div>
    </div>
);

// Profile Stats Skeleton
export const ProfileStatsSkeleton = () => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
    }}>
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Skeleton height="28px" width="50px" style={{ marginBottom: '8px' }} />
            <Skeleton height="12px" width="70px" />
        </div>
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Skeleton height="28px" width="50px" style={{ marginBottom: '8px' }} />
            <Skeleton height="12px" width="70px" />
        </div>
    </div>
);

// Stats Bar Skeleton - for homepage stats
export const StatsBarSkeleton = () => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '24px',
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0'
    }}>
        {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ textAlign: 'center' }}>
                <Skeleton height="36px" width="80px" style={{ margin: '0 auto 8px' }} />
                <Skeleton height="14px" width="100px" style={{ margin: '0 auto' }} />
            </div>
        ))}
    </div>
);

// Profile Card Skeleton
export const ProfileCardSkeleton = () => (
    <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '32px',
        textAlign: 'center'
    }}>
        <Skeleton variant="circle" width="100px" height="100px" style={{ margin: '0 auto 20px' }} />
        <Skeleton height="24px" width="150px" style={{ margin: '0 auto 8px' }} />
        <Skeleton height="16px" width="200px" style={{ margin: '0 auto 16px' }} />
        <Skeleton height="28px" width="80px" borderRadius="100px" style={{ margin: '0 auto' }} />
    </div>
);

// Mock Test Result Skeleton
export const MockTestResultSkeleton = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
    }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton height="18px" width="180px" />
            <Skeleton height="14px" width="140px" />
        </div>
        <Skeleton height="48px" width="100px" borderRadius="12px" />
    </div>
);

// List Item Skeleton
export const ListItemSkeleton = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
    }}>
        <Skeleton width="48px" height="48px" borderRadius="8px" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton height="16px" width="70%" />
            <Skeleton height="14px" width="50%" />
        </div>
    </div>
);

// Page Header Skeleton
export const PageHeaderSkeleton = () => (
    <div style={{ marginBottom: '32px' }}>
        <Skeleton height="12px" width="80px" borderRadius="100px" style={{ marginBottom: '12px' }} />
        <Skeleton height="36px" width="280px" style={{ marginBottom: '8px' }} />
        <Skeleton height="18px" width="400px" />
    </div>
);

// Feature Card Skeleton
export const FeatureCardSkeleton = () => (
    <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px'
    }}>
        <Skeleton width="48px" height="48px" borderRadius="12px" style={{ marginBottom: '16px' }} />
        <Skeleton height="20px" width="150px" style={{ marginBottom: '12px' }} />
        <Skeleton height="14px" width="100%" style={{ marginBottom: '8px' }} />
        <Skeleton height="14px" width="80%" />
    </div>
);

// Video Page Skeleton
export const VideoSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#e2e8f0', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 40%, transparent 80%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite'
            }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '64px', height: '64px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '0', height: '0', borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '15px solid rgba(255,255,255,1)', marginLeft: '5px' }} />
            </div>
        </div>
        <div>
            <Skeleton height="32px" width="60%" style={{ marginBottom: '12px' }} />
            <Skeleton height="16px" width="40%" />
        </div>
    </div>
);

export default Skeleton;
