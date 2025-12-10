// Helper function to convert video URLs to embed format
export const convertToYouTubeEmbed = (url) => {
    if (!url) return url;

    // Already an embed URL
    if (url.includes('youtube.com/embed/') || url.includes('vimeo.com/video/')) {
        return url;
    }

    // Vimeo URL - supports both vimeo.com/VIDEO_ID and vimeo.com/video/VIDEO_ID
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Standard YouTube watch URL
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (watchMatch && watchMatch[1]) {
        return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    // Return original if not a recognized video URL
    return url;
};
