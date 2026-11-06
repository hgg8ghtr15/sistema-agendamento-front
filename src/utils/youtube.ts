const YOUTUBE_HOSTS = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
]);
const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function extrairYoutubeVideoId(url?: string | null): string | null {
    if (!url) return null;

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }

    if (!['http:', 'https:'].includes(parsed.protocol) || !YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase())) {
        return null;
    }

    let videoId: string | null = null;
    if (parsed.hostname.toLowerCase() === 'youtu.be') {
        videoId = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v');
    } else {
        const [, kind, pathVideoId] = parsed.pathname.split('/');
        if (['embed', 'shorts', 'live'].includes(kind)) {
            videoId = pathVideoId ?? null;
        }
    }

    return videoId && VIDEO_ID_PATTERN.test(videoId) ? videoId : null;
}

export function obterYoutubeThumbnail(url?: string | null): string | null {
    const videoId = extrairYoutubeVideoId(url);
    return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
}

export function obterYoutubeEmbedUrl(url?: string | null): string | null {
    const videoId = extrairYoutubeVideoId(url);
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
}
