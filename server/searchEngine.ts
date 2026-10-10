export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: number; // in seconds
  durationFormatted: string;
  uploader: string;
  uploaderAvatar?: string;
  platform: 'twitter' | 'youtube' | 'tiktok' | 'reddit' | 'nsfw' | 'other';
  views?: number;
  viewsFormatted?: string;
  likes?: number;
  retweets?: number;
  uploadedAt?: string;
  url: string;
  embedUrl?: string;
  tags: string[];
  isNsfw?: boolean;
}

export interface SearchOptions {
  query: string;
  platform?: string;
  duration?: 'all' | 'short' | 'medium' | 'long';
  sortBy?: 'relevance' | 'views' | 'date' | 'duration_asc' | 'duration_desc';
  nsfw?: boolean;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  results: SearchResultItem[];
  page: number;
  hasMore: boolean;
  total: number;
}

// In-memory cache for ultra-fast response
interface CacheEntry {
  timestamp: number;
  results: SearchResultItem[];
  hasMore: boolean;
  total: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Helper to format duration in MM:SS or HH:MM:SS
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function parseDurationSec(durationStr?: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

// Helper to format views number nicely
export function formatViews(views?: number): string {
  if (views === undefined || views === null || isNaN(views)) return '';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1).replace('.0', '')}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1).replace('.0', '')}K`;
  return views.toString();
}

export function isNsfwQuery(_query: string): boolean {
  return true;
}

// Extract tags from title and description
export function extractTags(title: string, description?: string, explicitTags?: string[]): string[] {
  const set = new Set<string>();

  if (Array.isArray(explicitTags)) {
    for (const t of explicitTags) {
      if (t && typeof t === 'string' && t.length > 1 && t.length < 25) {
        set.add(t.startsWith('#') ? t : `#${t}`);
      }
    }
  }

  const fullText = `${title} ${description || ''}`;
  const hashtagMatches = fullText.match(/#[a-zA-Z0-9_\u00C0-\u017F]+/g);
  if (hashtagMatches) {
    for (const tag of hashtagMatches) {
      if (tag.length > 2 && tag.length < 25) {
        set.add(tag);
      }
    }
  }

  const keywordMap: Record<string, string> = {
    onlyfans: '#OnlyFans',
    amateur: '#Amateur',
    latina: '#Latina',
    cosplay: '#Cosplay18',
    pov: '#POV',
    casero: '#Casero',
    erotic: '#Erotic',
    erotica: '#Erotica',
    model: '#Model',
    viral: '#Viral18',
    nsfw: '#NSFW',
    climax: '#Climax',
    hardcore: '#Hardcore',
    fetish: '#Fetish',
  };

  const lower = fullText.toLowerCase();
  for (const [key, tag] of Object.entries(keywordMap)) {
    if (lower.includes(key)) {
      set.add(tag);
    }
  }

  return Array.from(set).slice(0, 6);
}

// Curated Category Presets - 100% NSFW Twitter / X Focused
export const CATEGORY_PRESETS: Record<string, { label: string; icon: string; query: string; tags: string[]; isNsfw?: boolean }> = {
  trending: {
    label: '🔥 Tendencias +18 en X',
    icon: 'Flame',
    query: 'viral',
    tags: ['#NSFW', '#Viral18', '#TrendingX', '#HotClips', '#TwitterAfterDark'],
    isNsfw: true,
  },
  amateur: {
    label: '📹 Amateur & Casero',
    icon: 'Film',
    query: 'amateur casero',
    tags: ['#Amateur', '#Casero', '#Homemade', '#Real', '#Viral'],
    isNsfw: true,
  },
  onlyfans: {
    label: '💎 OnlyFans & VIPs',
    icon: 'Sparkles',
    query: 'onlyfans',
    tags: ['#OnlyFans', '#VIP', '#Models', '#Exclusive', '#Hot'],
    isNsfw: true,
  },
  latina: {
    label: '💃 Latinas & España +18',
    icon: 'Heart',
    query: 'latina espanol',
    tags: ['#Latina', '#Espana18', '#Casero', '#Caliente', '#Hot'],
    isNsfw: true,
  },
  cosplay: {
    label: '🎭 Cosplay & Erotic',
    icon: 'Smile',
    query: 'cosplay',
    tags: ['#Cosplay18', '#Erotic', '#Anime', '#Fetish', '#Sexy'],
    isNsfw: true,
  },
  pov: {
    label: '👁️ POV & Primer Plano',
    icon: 'Eye',
    query: 'pov',
    tags: ['#POV', '#Solo', '#HD', '#Exclusive', '#Intense'],
    isNsfw: true,
  },
  hardcore: {
    label: '⚡ Hardcore & Intenso',
    icon: 'Lock',
    query: 'hardcore',
    tags: ['#Hardcore', '#Climax', '#Intense', '#18Plus', '#UltraHD'],
    isNsfw: true,
  },
  topweekly: {
    label: '⭐ Top Semanal X +18',
    icon: 'Trophy',
    query: 'popular',
    tags: ['#TopWeekly', '#BestNSFW', '#ViralTweets', '#Popular', '#HD1080p'],
    isNsfw: true,
  },
};

// Auto-suggestions dictionary for NSFW Twitter / X
const NSFW_SUGGESTIONS = [
  'amateur casero espanol',
  'onlyfans viral clips hd',
  'latina caliente casero x',
  'cosplay erotic hd clips',
  'pov solo clips twitter',
  'trending nsfw clips 2026',
  'modelos vip x twitter',
  'top semanal +18 viral',
  'homemade real video x',
  'hardcore climax clips 1080p',
];

export function getSearchSuggestions(query: string, _isNsfw = true): string[] {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return NSFW_SUGGESTIONS.slice(0, 8);
  }

  const matches = NSFW_SUGGESTIONS.filter((s) => s.toLowerCase().includes(clean));
  if (matches.length < 5) {
    matches.push(
      `${clean} +18 en X`,
      `${clean} casero clips`,
      `${clean} video HD 1080p`,
      `${clean} onlyfans`,
      `#${clean.replace(/\s+/g, '')}`
    );
  }
  return Array.from(new Set(matches)).slice(0, 8);
}

// Realistic adult Twitter creators for realistic Twitter presentation
const CREATORS = [
  { name: 'Modelos VIP España', handle: '@EspanaVIP_X', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Amateur Casero Real', handle: '@CaseroReal_X', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { name: 'OnlyFans Leaks Club', handle: '@OnlyLeaks_X', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80' },
  { name: 'Latina Hot Oficial', handle: '@LatinaHot_X', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Cosplay Erotic HD', handle: '@CosplayNSFW_X', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'POV Master Clips', handle: '@POVMaster_X', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Climax & Hardcore', handle: '@ClimaxDaily_X', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
  { name: 'After Dark Twitter', handle: '@AfterDark_X', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80' },
  { name: 'Caseros Iberia +18', handle: '@CaserosIberia_X', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { name: 'X Confesiones Nocturnas', handle: '@Nocturnas_X', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
];

export function optimizeAdultQuery(rawQuery: string): string[] {
  const noise = new Set([
    'twitter', 'x', 'xcom', 'video', 'videos', 'clip', 'clips', 
    'de', 'en', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'con', 'por', 'para', 
    'hd', '1080p', '4k', 'nsfw', '18', '+18', 'best', 'rated', 'leaks', 'preview'
  ]);
  
  const words = rawQuery
    .toLowerCase()
    .replace(/[#@_]/g, ' ')
    .replace(/[^a-zA-Z0-9\u00C0-\u017F\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1);

  const meaningful = words.filter(w => !noise.has(w));
  const candidates: string[] = [];
  
  if (meaningful.length > 0) {
    if (meaningful.length >= 2) {
      candidates.push(meaningful.slice(0, 2).join(' '));
    }
    for (const w of meaningful) {
      if (!candidates.includes(w)) candidates.push(w);
    }
    if (meaningful.length > 2) {
      candidates.push(meaningful.join(' '));
    }
  } else if (words.length > 0) {
    candidates.push(words[0]);
  }
  
  if (!candidates.includes('viral')) candidates.push('viral');
  if (!candidates.includes('popular')) candidates.push('popular');
  return candidates;
}

// Query live adult video search API
async function searchLiveAdultVideos(options: SearchOptions): Promise<{ results: SearchResultItem[]; hasMore: boolean; total: number }> {
  const page = options.page || 1;
  const targetLimit = Math.min(options.limit || 24, 40);

  let order = 'top-weekly';
  if (options.sortBy === 'views') order = 'most-popular';
  if (options.sortBy === 'date') order = 'latest';

  const candidates = optimizeAdultQuery(options.query);
  const items: SearchResultItem[] = [];
  const seenIds = new Set<string>();
  let totalCount = 0;

  for (const q of candidates) {
    if (items.length >= targetLimit) break;

    try {
      const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(q)}&per_page=${targetLimit}&page=${page}&thumbsize=big&order=${order}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) continue;

      const data = (await res.json()) as {
        total_count?: number;
        total_pages?: number;
        videos?: Array<{
          id: string;
          title: string;
          url: string;
          embed?: string;
          length_sec: number;
          default_thumb?: { src: string };
          views: number;
          keywords?: string;
          added?: string;
        }>;
      };

      if (!Array.isArray(data.videos) || data.videos.length === 0) {
        continue;
      }

      if (data.total_count && data.total_count > totalCount) {
        totalCount = data.total_count;
      }

      for (let i = 0; i < data.videos.length; i++) {
        if (items.length >= targetLimit) break;

        const v = data.videos[i];
        if (seenIds.has(v.id)) continue;
        seenIds.add(v.id);

        const durationSec = v.length_sec || 60;

        // Filter duration if requested
        if (options.duration === 'short' && durationSec > 180) continue;
        if (options.duration === 'medium' && (durationSec <= 180 || durationSec > 900)) continue;
        if (options.duration === 'long' && durationSec <= 900) continue;

        const creator = CREATORS[(items.length + i) % CREATORS.length];
        const rawKeywords = v.keywords ? v.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [];
        const tags = rawKeywords.slice(0, 5).map((k) => (k.startsWith('#') ? k : `#${k.replace(/\s+/g, '')}`));

        items.push({
          id: `tw-${v.id}`,
          title: v.title || 'Video +18 HD Twitter / X',
          description: `Video exclusivo compartido en Twitter / X por ${creator.handle}. Calidad 1080p Full HD sin censura.`,
          thumbnail: v.default_thumb?.src || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
          duration: durationSec,
          durationFormatted: formatDuration(durationSec),
          uploader: `${creator.name} (${creator.handle})`,
          uploaderAvatar: creator.avatar,
          platform: 'twitter',
          views: v.views || 450000,
          viewsFormatted: formatViews(v.views || 450000),
          likes: Math.round((v.views || 450000) * 0.06),
          retweets: Math.round((v.views || 450000) * 0.015),
          uploadedAt: v.added || 'Reciente',
          url: v.url || `https://x.com/${creator.handle.replace('@', '')}/status/${v.id}`,
          embedUrl: v.embed || `https://www.eporner.com/embed/${v.id}/`,
          tags: tags.length > 0 ? tags : ['#NSFW', '#OnlyFans', '#Amateur', '#Hot'],
          isNsfw: true,
        });
      }
    } catch {
      // Continue to next candidate query
    }
  }

  if (options.sortBy === 'duration_asc') {
    items.sort((a, b) => a.duration - b.duration);
  } else if (options.sortBy === 'duration_desc') {
    items.sort((a, b) => b.duration - a.duration);
  }

  return {
    results: items,
    hasMore: items.length >= targetLimit,
    total: totalCount || items.length,
  };
}

// Query directly for a Tweet URL or ID
async function fetchDirectTweetResult(query: string): Promise<SearchResultItem | null> {
  const match =
    query.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?(?:[a-zA-Z0-9_]+)\/status(?:es)?\/(\d+)/i) ||
    query.match(/(?:twitter\.com|x\.com)\/i\/status\/(\d+)/i) ||
    query.match(/^(\d{8,25})$/);

  if (!match) return null;
  const tweetId = match[1];

  try {
    const res = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
      headers: { 'User-Agent': 'TwitterVideoDownloader/2.0' },
    });
    if (!res.ok) return null;

    const body = (await res.json()) as {
      tweet?: {
        id: string;
        url: string;
        text: string;
        created_at: string;
        likes?: number;
        retweets?: number;
        views?: number;
        author: {
          name: string;
          screen_name: string;
          avatar_url: string;
        };
        media?: {
          videos?: Array<{
            url: string;
            thumbnail_url?: string;
            duration?: number;
          }>;
          all?: Array<{
            type: string;
            url: string;
            thumbnail_url?: string;
            duration?: number;
          }>;
        };
      };
    };

    if (!body.tweet) return null;
    const tweet = body.tweet;

    const videoList = tweet.media?.videos || [];
    if (videoList.length === 0 && tweet.media?.all) {
      for (const item of tweet.media.all) {
        if (item.type === 'video' || item.type === 'gif') {
          videoList.push(item);
        }
      }
    }

    const video = videoList[0];
    const duration = Math.round(video?.duration || 35);
    const text = tweet.text || 'Video +18 de Twitter / X';

    return {
      id: tweet.id,
      title: text.length > 100 ? `${text.slice(0, 97)}...` : text,
      description: text,
      thumbnail: video?.thumbnail_url || `https://pbs.twimg.com/media/${tweet.id}.jpg`,
      duration,
      durationFormatted: formatDuration(duration),
      uploader: `${tweet.author.name} (@${tweet.author.screen_name})`,
      uploaderAvatar: tweet.author.avatar_url,
      platform: 'twitter',
      views: tweet.views || 350000,
      viewsFormatted: formatViews(tweet.views || 350000),
      likes: tweet.likes || 18000,
      retweets: tweet.retweets || 4200,
      uploadedAt: tweet.created_at || 'Reciente',
      url: tweet.url || `https://x.com/i/status/${tweet.id}`,
      tags: extractTags(text),
      isNsfw: true,
    };
  } catch {
    return null;
  }
}

// Perform fast live NSFW Twitter-exclusive video search with pagination
export async function searchVideos(options: SearchOptions): Promise<SearchResponse> {
  const cleanQuery = options.query.trim();
  const page = options.page || 1;
  const limit = Math.min(options.limit || 24, 40);

  if (!cleanQuery) {
    return { results: [], page, hasMore: false, total: 0 };
  }

  const cacheKey = `tw_nsfw_${cleanQuery.toLowerCase()}_${options.duration || 'all'}_${options.sortBy || 'relevance'}_p${page}_${limit}`;

  // Check cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      results: cached.results,
      page,
      hasMore: cached.hasMore,
      total: cached.total,
    };
  }

  // 1. Direct tweet link or ID
  const directTweet = await fetchDirectTweetResult(cleanQuery);
  if (directTweet) {
    const singleResult = [directTweet];
    searchCache.set(cacheKey, { timestamp: Date.now(), results: singleResult, hasMore: false, total: 1 });
    return { results: singleResult, page: 1, hasMore: false, total: 1 };
  }

  // 2. Query live adult high-speed video engine
  const liveResult = await searchLiveAdultVideos(options);
  if (liveResult.results.length > 0) {
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      results: liveResult.results,
      hasMore: liveResult.hasMore,
      total: liveResult.total,
    });
    return {
      results: liveResult.results,
      page,
      hasMore: liveResult.hasMore,
      total: liveResult.total,
    };
  }

  return {
    results: [],
    page,
    hasMore: false,
    total: 0,
  };
}
