'use client';

import { useParams } from 'next/navigation';
import MockTestBuilder from '@/components/MockTestBuilder';

export default function EditIQTestPage() {
    const params = useParams();
    const testId = params.testId as string;

    return <MockTestBuilder mode="edit" testType="iq" testId={testId} />;
}
