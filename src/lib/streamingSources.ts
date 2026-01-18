// Alternative free streaming sources for in-app playback
// These are embed sources that can be used when JustWatch doesn't find streams

export interface StreamingSource {
  name: string;
  getEmbedUrl: (tmdbId: string, type: 'movie' | 'tv', season?: number, episode?: number) => string;
  priority: number;
}

// Extract TMDB ID from content metadata or title
// This is a helper to work with content that might have TMDB metadata stored
export const extractTmdbInfo = (content: {
  title: string;
  content_type: string;
  description?: string | null;
  tags?: string[] | null;
  external_watch_links?: Record<string, string> | null;
}): { tmdbId: string | null; type: 'movie' | 'tv' } => {
  // Check if TMDB ID is stored in tags (format: "tmdb:12345")
  const tmdbTag = content.tags?.find(tag => tag.startsWith('tmdb:'));
  if (tmdbTag) {
    return {
      tmdbId: tmdbTag.replace('tmdb:', ''),
      type: content.content_type === 'tv' ? 'tv' : 'movie'
    };
  }

  // Check external_watch_links for TMDB URL
  if (content.external_watch_links) {
    const links = content.external_watch_links;
    for (const [key, url] of Object.entries(links)) {
      if (typeof url === 'string' && url.includes('themoviedb.org')) {
        const match = url.match(/\/(movie|tv)\/(\d+)/);
        if (match) {
          return {
            tmdbId: match[2],
            type: match[1] as 'movie' | 'tv'
          };
        }
      }
    }
  }

  return { tmdbId: null, type: content.content_type === 'tv' ? 'tv' : 'movie' };
};

// Available streaming sources - ordered by reliability and quality
export const streamingSources: StreamingSource[] = [
  {
    name: 'VidSrc',
    priority: 1,
    getEmbedUrl: (tmdbId, type, season, episode) => {
      if (type === 'tv' && season && episode) {
        return `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
      }
      return `https://vidsrc.xyz/embed/${type}?tmdb=${tmdbId}`;
    }
  },
  {
    name: 'VidSrc.to',
    priority: 2,
    getEmbedUrl: (tmdbId, type, season, episode) => {
      if (type === 'tv' && season && episode) {
        return `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.to/embed/${type}/${tmdbId}`;
    }
  },
  {
    name: '2Embed',
    priority: 3,
    getEmbedUrl: (tmdbId, type, season, episode) => {
      if (type === 'tv' && season && episode) {
        return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`;
      }
      return `https://www.2embed.cc/embed/${tmdbId}`;
    }
  },
  {
    name: 'VidSrc.pro',
    priority: 4,
    getEmbedUrl: (tmdbId, type, season, episode) => {
      if (type === 'tv' && season && episode) {
        return `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.pro/embed/${type}/${tmdbId}`;
    }
  },
  {
    name: 'SuperEmbed',
    priority: 5,
    getEmbedUrl: (tmdbId, type, season, episode) => {
      if (type === 'tv' && season && episode) {
        return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
      }
      return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
    }
  }
];

// Get the primary streaming embed URL for content
export const getPrimaryStreamUrl = (
  tmdbId: string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): string => {
  const source = streamingSources[0]; // Use highest priority source
  return source.getEmbedUrl(tmdbId, type, season, episode);
};

// Get all available streaming URLs for content (for fallback)
export const getAllStreamUrls = (
  tmdbId: string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): { name: string; url: string }[] => {
  return streamingSources
    .sort((a, b) => a.priority - b.priority)
    .map(source => ({
      name: source.name,
      url: source.getEmbedUrl(tmdbId, type, season, episode)
    }));
};

// Check if content has an embeddable stream available
export const hasEmbeddableStream = (content: {
  video_embed_url?: string | null;
  external_watch_links?: Record<string, string> | null;
  tags?: string[] | null;
}): boolean => {
  // Has direct video URL
  if (content.video_embed_url) return true;
  
  // Has TMDB ID for fallback sources
  const tmdbTag = content.tags?.find(tag => tag.startsWith('tmdb:'));
  if (tmdbTag) return true;
  
  return false;
};
