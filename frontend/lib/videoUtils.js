// Helper function to convert video URLs to embed format
export const convertToYouTubeEmbed = (url) => {
    if (!url) return url;

    // Already an embed URL (YouTube, Vimeo, or Bunny.net)
    if (url.includes('youtube.com/embed/') ||
        url.includes('vimeo.com/video/') ||
        url.includes('iframe.mediadelivery.net/embed/')) {
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

/**
 * Check if a video URL should be displayed in an iframe
 * (YouTube, Vimeo, or Bunny.net Stream)
 */
export const isIframeVideo = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') ||
        url.includes('youtu.be') ||
        url.includes('vimeo.com') ||
        url.includes('iframe.mediadelivery.net') ||
        url.includes('mediadelivery.net');
};

/**
 * Check if URL is a Bunny.net Stream video
 */
export const isBunnyVideo = (url) => {
    if (!url) return false;
    return url.includes('iframe.mediadelivery.net') ||
        url.includes('mediadelivery.net');
};
