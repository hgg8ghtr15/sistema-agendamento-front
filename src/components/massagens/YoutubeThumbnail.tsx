import { Icon } from '@mdi/react';
import { mdiPlay } from '@mdi/js';
import { obterYoutubeThumbnail } from '../../utils/youtube';

interface YoutubeThumbnailProps {
    url: string;
    alt: string;
}

export function YoutubeThumbnail({ url, alt }: YoutubeThumbnailProps) {
    const thumbnailUrl = obterYoutubeThumbnail(url);
    if (!thumbnailUrl) return null;

    return (
        <div className="youtube-thumbnail">
            <img src={thumbnailUrl} alt={alt} loading="lazy" />
            <span className="youtube-thumbnail-play" aria-hidden="true">
                <Icon path={mdiPlay} size="1.5rem" />
            </span>
        </div>
    );
}
