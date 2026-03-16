'use client';

import { useParams } from 'next/navigation';
import MockTestAnalytics from '@/components/MockTestAnalytics';

export default function MockTestCourseAnalyticsPage() {
    const params = useParams();
    
    return (
        <>
            <MockTestAnalytics testId={params.testId} courseId={params.id} />
        </>
    );
}
