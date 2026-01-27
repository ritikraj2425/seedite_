
import { API_URL } from '@/lib/api';

export const uploadFile = async (file: File, type: 'image' | 'video' | 'pdf' = 'image'): Promise<{ url: string; key: string; videoId?: string }> => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const token = adminUser.token;

    if (!token) {
        throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);

    const apiUrl = API_URL;

    // Choose endpoint based on type
    const endpoint = type === 'video' ? '/api/upload/bunny' : '/api/upload/s3';

    try {
        const response = await fetch(`${apiUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
};
