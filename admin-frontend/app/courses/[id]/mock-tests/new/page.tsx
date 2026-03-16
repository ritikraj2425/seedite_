'use client';

import { useParams } from 'next/navigation';
import MockTestBuilder from '@/components/MockTestBuilder';

export default function CreateMockTestPage() {
    const params = useParams();
    const courseId = params.id as string;

    return <MockTestBuilder mode="create" testType="course" courseId={courseId} />;
}
