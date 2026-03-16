'use client';

import { useParams } from 'next/navigation';
import MockTestAnalytics from '@/components/MockTestAnalytics';

export default function IQTestAnalyticsPage() {
    const params = useParams();
    
    return (
        <>
            <MockTestAnalytics testId={params.id} isIQTest={true} />
        </>
    );
}
