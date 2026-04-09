
import { API_URL } from '@/lib/api';

export const uploadFile = async (file: File, type: 'image' | 'video' | 'pdf' = 'image'): Promise<{ url: string; key: string; videoId?: string }> => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const token = adminUser.token;

    if (!token) {
        throw new Error('Not authenticated');
    }

    // For videos, use direct-to-Bunny upload to bypass server body size limits
    if (type === 'video') {
        return uploadVideoDirectToBunny(file, token);
    }

    const formData = new FormData();
    formData.append('file', file);

    const apiUrl = API_URL;

    // Choose endpoint based on type (images & PDFs go through the server)
    const endpoint = '/api/upload/s3';

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

/**
 * Direct-to-Bunny video upload.
 * 1. Calls the backend to create a Bunny video placeholder (small JSON request).
 * 2. Uploads the video file directly from the browser to Bunny's CDN.
 * This bypasses any server/nginx body size limits.
 */
async function uploadVideoDirectToBunny(
    file: File,
    token: string
): Promise<{ url: string; key: string; videoId: string }> {
    // Step 1: Create video placeholder via our backend (small JSON, no file)
    const createRes = await fetch(`${API_URL}/api/upload/bunny/create-upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, '') // filename without extension
        })
    });

    if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.message || 'Failed to create video placeholder');
    }

    const { videoId, uploadUrl, embedUrl, apiKey } = await createRes.json();

    // Step 2: Upload video directly to Bunny CDN from the browser
    const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'AccessKey': apiKey,
            'Content-Type': 'application/octet-stream'
        },
        body: file
    });

    if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(`Bunny upload failed: ${uploadRes.status} - ${text}`);
    }

    return {
        videoId,
        url: embedUrl,
        key: videoId // For backward compatibility with admin panel
    };
}
