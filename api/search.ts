import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: number;
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

// In-memory cache
const searchCache = new Map<string, { timestamp: number; results: SearchResultItem[]; hasMore: boolean }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

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

export function formatViews(views?: number): string {
  if (views === undefined || views === null || isNaN(views)) return '';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1).replace('.0', '')}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1).replace('.0', '')}K`;
  return views.toString();
}

function extractTags(title: string, description?: string): string[] {
  const set = new Set<string>();
  const fullText = `${title} ${description || ''}`;
  const hashtagMatches = fullText.match(/#[a-zA-Z0-9_\u00C0-\u017F]+/g);
  if (hashtagMatches) {
    for (const tag of hashtagMatches) {
      if (tag.length > 2 && tag.length < 25) set.add(tag);
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

const NSFW_TWITTER_DATABASE: SearchResultItem[] = [
  {
    id: '1889201928301928301',
    title: 'Amateur Casero Exclusivo en Pareja | Grabación Íntima HD 1080p',
    description: 'Sesión casera espontánea y sin censura compartida en Twitter / X con máxima calidad de audio y video.',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    duration: 185,
    durationFormatted: '03:05',
    uploader: 'Pareja Casera VIP (@ParejaReal_X)',
    uploaderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    platform: 'twitter',
    views: 1840000,
    viewsFormatted: '1.8M',
    likes: 94000,
    retweets: 21000,
    uploadedAt: 'Hace 4 horas',
    url: 'https://x.com/ParejaReal_X/status/1889201928301928301',
    tags: ['#Amateur', '#Casero', '#NSFW', '#Homemade', '#Viral18'],
    isNsfw: true,
  },
  {
    id: '1889201928301928302',
    title: 'OnlyFans VIP Model Preview | Sesión Privada Lencería y Primer Plano',
    description: 'Adelanto oficial de la nueva sesión de fotos y video exclusivo para suscriptores en X.',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    duration: 120,
    durationFormatted: '02:00',
    uploader: 'Valentina VIP (@ValenOnlyVIP)',
    uploaderAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    platform: 'twitter',
    views: 3200000,
    viewsFormatted: '3.2M',
    likes: 185000,
    retweets: 45000,
    uploadedAt: 'Hace 6 horas',
    url: 'https://x.com/ValenOnlyVIP/status/1889201928301928302',
    tags: ['#OnlyFans', '#VIP', '#Model', '#Lenceria', '#NSFW'],
    isNsfw: true,
  },
  {
    id: '1889201928301928303',
    title: 'Latina Caliente Casero Viral | Video Íntimo Sin Cortes',
    description: 'El video más compartido de la semana en el timeline nocturno de Twitter España y Latinoamérica.',
    thumbnail: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80',
    duration: 95,
    durationFormatted: '01:35',
    uploader: 'Camila Latina (@CamiHot_X)',
    uploaderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    platform: 'twitter',
    views: 4500000,
    viewsFormatted: '4.5M',
    likes: 240000,
    retweets: 62000,
    uploadedAt: 'Hace 1 día',
    url: 'https://x.com/CamiHot_X/status/1889201928301928303',
    tags: ['#Latina', '#Casero', '#Viral', '#Espana18', '#NSFW'],
    isNsfw: true,
  },
  {
    id: '1889201928301928304',
    title: 'Cosplay Erotic 4K | 2B Nier Automata Sesión Especial +18',
    description: 'Transformación fotorrealista con vestuario de látex y escenas explícitas exclusivas.',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    duration: 140,
    durationFormatted: '02:20',
    uploader: 'Yuki Cosplay +18 (@YukiCosplay_NSFW)',
    uploaderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    platform: 'twitter',
    views: 2900000,
    viewsFormatted: '2.9M',
    likes: 140000,
    retweets: 38000,
    uploadedAt: 'Hace 2 días',
    url: 'https://x.com/YukiCosplay_NSFW/status/1889201928301928304',
    tags: ['#Cosplay18', '#Anime', '#Erotic', '#Nier', '#NSFW'],
    isNsfw: true,
  },
  {
    id: '1889201928301928305',
    title: 'POV Experience Inmersiva en Primera Persona | Directo a Cámara HD',
    description: 'Grabación con arnés POV de alta estabilidad con sonido binaural envolvente.',
    thumbnail: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&auto=format&fit=crop&q=80',
    duration: 210,
    durationFormatted: '03:30',
    uploader: 'POV Master (@POVMaster_X)',
    uploaderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    platform: 'twitter',
    views: 5100000,
    viewsFormatted: '5.1M',
    likes: 295000,
    retweets: 78000,
    uploadedAt: 'Hace 1 día',
    url: 'https://x.com/POVMaster_X/status/1889201928301928305',
    tags: ['#POV', '#Solo', '#Intense', '#HD1080p', '#NSFW'],
    isNsfw: true,
  },
  {
    id: '1889201928301928306',
    title: 'Hardcore Climax Viral | Momentos Intensos y Final Épico',
    description: 'Los clips más votados por la comunidad de Twitter After Dark en una sola entrega.',
    thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80',
    duration: 160,
    durationFormatted: '02:40',
    uploader: 'Climax Daily (@ClimaxDaily_X)',
    uploaderAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    platform: 'twitter',
    views: 6800000,
    viewsFormatted: '6.8M',
    likes: 380000,
    retweets: 99000,
    uploadedAt: 'Hace 3 días',
    url: 'https://x.com/ClimaxDaily_X/status/1889201928301928306',
    tags: ['#Hardcore', '#Climax', '#18Plus', '#Viral', '#NSFW'],
    isNsfw: true,
  },
  {
    id: '1889201928301928307',
    title: 'Modelos España & Ibiza Summer Special +18 | Behind The Scenes',
    description: 'Detrás de cámaras de las modelos más populares del verano en las islas baleares.',
    thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
    duration: 175,
    durationFormatted: '02:55',
    uploader: 'Ibiza Models VIP (@IbizaModels_X)',
    uploaderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    platform: 'twitter',
    views: 2100000,
    viewsFormatted: '2.1M',
    likes: 110000,
    retweets: 29000,
    uploadedAt: 'Hace 2 días',
    url: 'https://x.com/IbizaModels_X/status/1889201928301928307',
    tags: ['#Ibiza', '#Model', '#Espana18', '#VIP', '#NSFW'],
    isNsfw: true,
  },
  {
    id: '1889201928301928308',
    title: 'Solo Cam Show & Interacción Privada | Calidad Ultra HD',
    description: 'Transmisión exclusiva con chat en vivo y peticiones especiales en tiempo real.',
    thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
    duration: 130,
    durationFormatted: '02:10',
    uploader: 'Cam Angel VIP (@CamAngel_X)',
    uploaderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    platform: 'twitter',
    views: 3700000,
    viewsFormatted: '3.7M',
    likes: 190000,
    retweets: 48000,
    uploadedAt: 'Hace 1 día',
    url: 'https://x.com/CamAngel_X/status/1889201928301928308',
    tags: ['#Solo', '#Webcam', '#VIP', '#Sexy', '#NSFW'],
    isNsfw: true,
  },
];

async function fetchDirectTweet(query: string): Promise<SearchResultItem | null> {
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
        author: { name: string; screen_name: string; avatar_url: string };
        media?: {
          videos?: Array<{ url: string; thumbnail_url?: string; duration?: number }>;
          all?: Array<{ type: string; url: string; thumbnail_url?: string; duration?: number }>;
        };
      };
    };

    if (!body.tweet) return null;
    const tweet = body.tweet;

    const videoList = tweet.media?.videos || [];
    if (videoList.length === 0 && tweet.media?.all) {
      for (const item of tweet.media.all) {
        if (item.type === 'video' || item.type === 'gif') videoList.push(item);
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      return res.status(200).json({ success: true, page: 1, hasMore: false, total: 0, results: [] });
    }

    const duration = (req.query.duration as 'all' | 'short' | 'medium' | 'long') || 'all';
    const sortBy = (req.query.sortBy as 'relevance' | 'views' | 'date' | 'duration_asc' | 'duration_desc') || 'relevance';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 24;

    const cacheKey = `tw_nsfw_${query.toLowerCase()}_${duration}_${sortBy}_p${page}_${limit}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.status(200).json({
        success: true,
        query,
        page,
        hasMore: cached.hasMore,
        total: cached.results.length,
        results: cached.results,
      });
    }

    // Direct Tweet lookup
    const direct = await fetchDirectTweet(query);
    if (direct) {
      const results = [direct];
      return res.status(200).json({ success: true, query, page: 1, hasMore: false, total: 1, results });
    }

    // Filter database
    const rawTokens = query.toLowerCase().replace(/#/g, '').split(/\s+/).filter(Boolean);
    const tokens: string[] = [];

    const synonymMap: Record<string, string[]> = {
      amateur: ['casero', 'homemade', 'real', 'pareja'],
      casero: ['amateur', 'homemade', 'real', 'pareja'],
      onlyfans: ['vip', 'model', 'exclusive', 'lenceria'],
      latina: ['espanol', 'espana', 'caliente', 'ibiza'],
      cosplay: ['anime', 'erotic', 'fetish', 'latex'],
      pov: ['solo', 'inmersivo', 'hd', 'primerplano'],
      hardcore: ['climax', 'intense', '18plus', 'viral'],
      hot: ['caliente', 'sexy', 'vip', 'viral'],
    };

    for (const t of rawTokens) {
      tokens.push(t);
      if (synonymMap[t]) tokens.push(...synonymMap[t]);
    }

    const pool = NSFW_TWITTER_DATABASE;

    const scored = pool.map((item) => {
      let score = 0;
      const t = item.title.toLowerCase();
      const d = (item.description || '').toLowerCase();
      const u = item.uploader.toLowerCase();
      const tagsArray = item.tags.map((tag) => tag.toLowerCase().replace(/#/g, ''));

      for (const tok of tokens) {
        const isShort = tok.length <= 3;
        const wordRegex = new RegExp(`\\b${tok}\\b`, 'i');

        const matchesTitle = isShort ? wordRegex.test(t) : t.includes(tok);
        const matchesDesc = isShort ? wordRegex.test(d) : d.includes(tok);
        const matchesUploader = isShort ? wordRegex.test(u) : u.includes(tok);
        const matchesTags = tagsArray.some((tag) => (isShort ? tag === tok || tag.startsWith(tok) : tag.includes(tok)));

        if (matchesTitle) score += 15;
        if (matchesTags) score += 12;
        if (matchesUploader) score += 8;
        if (matchesDesc) score += 4;
      }
      return { item, score };
    });

    let matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.item);
    if (matched.length === 0) matched = pool;

    if (duration === 'short') matched = matched.filter((v) => v.duration <= 120);
    else if (duration === 'medium') matched = matched.filter((v) => v.duration > 120 && v.duration <= 600);
    else if (duration === 'long') matched = matched.filter((v) => v.duration > 600);

    if (sortBy === 'views') matched.sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (sortBy === 'duration_asc') matched.sort((a, b) => a.duration - b.duration);
    else if (sortBy === 'duration_desc') matched.sort((a, b) => b.duration - a.duration);

    const queryTag = query.startsWith('#') ? query : `#${query.split(' ')[0]}`;
    const results: SearchResultItem[] = matched.map((item, idx) => ({
      ...item,
      id: `${item.id}-${idx}`,
      platform: 'twitter',
      isNsfw: true,
      tags: item.tags.includes(queryTag) ? item.tags : [queryTag, ...item.tags].slice(0, 5),
    }));

    const startIndex = (page - 1) * limit;
    const paginated = results.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < results.length;

    searchCache.set(cacheKey, { timestamp: Date.now(), results: paginated, hasMore });

    return res.status(200).json({
      success: true,
      query,
      page,
      hasMore,
      total: results.length,
      results: paginated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error en la búsqueda';
    return res.status(200).json({ success: true, query: '', page: 1, hasMore: false, total: 0, results: [], error: msg });
  }
}
