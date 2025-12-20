
import { API_URL } from '@/lib/api';

export const uploadFile = async (file: File): Promise<{ url: string; key: string }> => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const token = adminUser.token;

    if (!token) {
        throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);

    const apiUrl = API_URL;

    try {
        const response = await fetch(`${apiUrl}/api/upload/s3`, {
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
