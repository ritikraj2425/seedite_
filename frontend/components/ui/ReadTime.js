'use client';

import { Clock } from 'lucide-react';

export default function ReadTime({ content }) {
    const calculateReadTime = (text) => {
        const wordsPerMinute = 200;
        const wordCount = text.split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return minutes;
    };

    const minutes = calculateReadTime(content || '');

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={16} />
            <span>{minutes} min read</span>
        </div>
    );
}