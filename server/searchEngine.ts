import { spawn } from 'node:child_process';

export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: number; // in seconds
  durationFormatted: string;
  uploader: string;
  uploaderAvatar?: string;
  platform: 'youtube' | 'twitter' | 'tiktok' | 'reddit' | 'nsfw' | 'other';
  views?: number;
  viewsFormatted?: string;
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
  limit?: number;
}

// In-memory cache for ultra-fast response
interface CacheEntry {
  timestamp: number;
  results: SearchResultItem[];
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

// Helper to format views number nicely
export function formatViews(views?: number): string {
  if (views === undefined || views === null || isNaN(views)) return '';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1).replace('.0', '')}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1).replace('.0', '')}K`;
  return views.toString();
}

// List of common NSFW keywords for auto-routing
const NSFW_KEYWORDS = [
  'porn', 'porno', 'nsfw', 'xxx', 'hentai', 'sex', 'erotic', 'erotica',
  'milf', 'amateur', 'babe', 'lesbian', 'boobs', 'tits', 'fetish',
  'jav', 'blowjob', 'creampie', 'teen', 'anal', 'masturbation', 'nude',
  'naked', 'onlyfans', 'webcam', 'erotico', 'tetas', 'culos', 'chicas',
  'desnuda', 'desnudas', 'sexo', 'adulto', 'adult', '+18', '18+'
];

export function isNsfwQuery(query: string): boolean {
  const lower = query.toLowerCase();
  const words = lower.split(/[\s,+#_-]+/);
  return words.some((w) => NSFW_KEYWORDS.includes(w)) || NSFW_KEYWORDS.some((kw) => lower.includes(kw));
}

// Extract tags from title and description
function extractTags(title: string, description?: string, explicitTags?: string[]): string[] {
  const set = new Set<string>();

  if (Array.isArray(explicitTags)) {
    for (const t of explicitTags) {
      if (t && typeof t === 'string' && t.length > 1 && t.length < 25) {
        set.add(t.startsWith('#') ? t : `#${t}`);
      }
    }
  }

  // Extract hashtags from text
  const fullText = `${title} ${description || ''}`;
  const hashtagMatches = fullText.match(/#[a-zA-Z0-9_\u00C0-\u017F]+/g);
  if (hashtagMatches) {
    for (const tag of hashtagMatches) {
      if (tag.length > 2 && tag.length < 25) {
        set.add(tag);
      }
    }
  }

  return Array.from(set).slice(0, 6);
}

// Curated Category Presets
export const CATEGORY_PRESETS: Record<string, { label: string; icon: string; query: string; tags: string[]; isNsfw?: boolean }> = {
  trending: {
    label: 'Tendencias & Viral',
    icon: 'Flame',
    query: 'trending viral videos 2026',
    tags: ['#Viral', '#Trending', '#Top', '#Clips', '#Popular'],
  },
  ai: {
    label: 'Inteligencia Artificial',
    icon: 'Bot',
    query: 'inteligencia artificial novedades AI deepseek chatgpt',
    tags: ['#AI', '#InteligenciaArtificial', '#Tech', '#DeepSeek', '#OpenAI'],
  },
  gaming: {
    label: 'Gaming & Streams',
    icon: 'Gamepad2',
    query: 'gaming highlights gameplay 2026 español',
    tags: ['#Gaming', '#Gameplay', '#Twitch', '#Highlights', '#eSports'],
  },
  music: {
    label: 'Música & Videoclips',
    icon: 'Music',
    query: 'musica official video clip top hits',
    tags: ['#Music', '#Videoclip', '#Hits', '#Pop', '#Urban'],
  },
  sports: {
    label: 'Deportes & Fútbol',
    icon: 'Trophy',
    query: 'mejores jugadas futbol goles highlights',
    tags: ['#Futbol', '#Sports', '#Goles', '#Highlights', '#Champions'],
  },
  cinema: {
    label: 'Cine & Trailers',
    icon: 'Film',
    query: 'official trailer peliculas estrenos español',
    tags: ['#Cine', '#Trailer', '#Peliculas', '#Series', '#Estrenos'],
  },
  tech: {
    label: 'Programación & Tech',
    icon: 'Code2',
    query: 'programacion desarrollo software tutorial tech',
    tags: ['#Programacion', '#Tech', '#Tutorial', '#Python', '#React'],
  },
  memes: {
    label: 'Memes & Humor',
    icon: 'Smile',
    query: 'memes videos graciosos humor shorts tiktok',
    tags: ['#Memes', '#Humor', '#Risas', '#Funny', '#TikTok'],
  },
  nsfw: {
    label: '🔞 Adultos & +18',
    icon: 'Lock',
    query: 'top amateur viral',
    tags: ['#NSFW', '#Adult', '#18Plus', '#Amateur', '#Trending'],
    isNsfw: true,
  },
};

// Auto-suggestions dictionary
const POPULAR_SUGGESTIONS = [
  'tutorial python desde cero',
  'mejores jugadas de futbol',
  'inteligencia artificial deepseek',
  'goles de messi y ronaldo',
  'musica electronica relajante',
  'trailers estrenos de cine 2026',
  'highlights gaming valheim gta',
  'videos graciosos de risa memes',
  'curso react y typescript',
  'recetas de cocina faciles',
  'noticias tecnologia novedades',
  'podcast clips espanol',
];

export function getSearchSuggestions(query: string, isNsfw = false): string[] {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return isNsfw
      ? ['amateur homemade', 'top weekly trending', 'latina viral', 'cosplay hd', 'webcam clips']
      : POPULAR_SUGGESTIONS.slice(0, 8);
  }

  const matches = POPULAR_SUGGESTIONS.filter((s) => s.toLowerCase().includes(clean));
  if (matches.length < 5) {
    matches.push(
      `${clean} tutorial`,
      `${clean} highlights`,
      `${clean} clips virales`,
      `${clean} HD`
    );
  }
  return Array.from(new Set(matches)).slice(0, 8);
}

// Search NSFW adult videos using public high-speed API
async function searchNsfwVideos(options: SearchOptions): Promise<SearchResultItem[]> {
  const cleanQuery = options.query.replace(/#/g, '').trim() || 'trending';
  const limit = Math.min(options.limit || 24, 40);

  let order = 'top-weekly';
  if (options.sortBy === 'views') order = 'most-popular';
  if (options.sortBy === 'date') order = 'latest';

  try {
    const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(cleanQuery)}&per_page=${limit}&thumbsize=big&order=${order}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json() as {
      videos?: Array<{
        id: string;
        title: string;
        url: string;
        embed?: string;
        length_sec: number;
        length_min: string;
        default_thumb?: { src: string };
        views: number;
        keywords?: string;
        added?: string;
      }>;
    };

    if (!Array.isArray(data.videos) || data.videos.length === 0) {
      return [];
    }

    const items: SearchResultItem[] = [];

    for (const v of data.videos) {
      const durationSec = v.length_sec || 0;

      // Filter duration if requested
      if (options.duration === 'short' && durationSec > 180) continue;
      if (options.duration === 'medium' && (durationSec <= 180 || durationSec > 900)) continue;
      if (options.duration === 'long' && durationSec <= 900) continue;

      const rawKeywords = v.keywords ? v.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [];
      const tags = rawKeywords.slice(0, 5).map((k) => (k.startsWith('#') ? k : `#${k.replace(/\s+/g, '')}`));

      items.push({
        id: `ep-${v.id}`,
        title: v.title || 'Video +18 HD',
        thumbnail: v.default_thumb?.src || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
        duration: durationSec,
        durationFormatted: formatDuration(durationSec),
        uploader: 'Canal +18 HD',
        platform: 'nsfw',
        views: v.views,
        viewsFormatted: formatViews(v.views),
        uploadedAt: v.added,
        url: v.url,
        embedUrl: v.embed || `https://www.eporner.com/embed/${v.id}/`,
        tags: tags.length > 0 ? tags : ['#NSFW', '#Adult', '#HD'],
        isNsfw: true,
      });
    }

    // Sort by duration if requested
    if (options.sortBy === 'duration_asc') {
      items.sort((a, b) => a.duration - b.duration);
    } else if (options.sortBy === 'duration_desc') {
      items.sort((a, b) => b.duration - a.duration);
    }

    return items;
  } catch (err) {
    console.error('[SearchEngine] NSFW Search API error:', err);
    return [];
  }
}

// Perform fast multi-platform video search
export async function searchVideos(options: SearchOptions): Promise<SearchResultItem[]> {
  const cleanQuery = options.query.trim();
  if (!cleanQuery) return [];

  const isNsfw = options.nsfw === true || options.platform === 'nsfw' || isNsfwQuery(cleanQuery);
  const limit = Math.min(options.limit || 24, 40);
  const cacheKey = `${cleanQuery.toLowerCase()}_${options.platform || 'all'}_${options.duration || 'all'}_${options.sortBy || 'relevance'}_${isNsfw ? 'nsfw' : 'safe'}_${limit}`;

  // Check cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.results;
  }

  // If NSFW search is triggered, query adult video engine
  if (isNsfw) {
    const nsfwResults = await searchNsfwVideos(options);
    if (nsfwResults.length > 0) {
      searchCache.set(cacheKey, { timestamp: Date.now(), results: nsfwResults });
      return nsfwResults;
    }
  }

  return new Promise((resolve) => {
    let searchQuery = cleanQuery;
    if (cleanQuery.startsWith('#')) {
      searchQuery = cleanQuery.replace('#', '') + ' hashtag';
    }

    const ytSearchQuery = `ytsearch${limit}:${searchQuery}`;

    const args = [
      '-m',
      'yt_dlp',
      '--dump-json',
      '--flat-playlist',
      '--no-warnings',
      '--no-check-certificates',
      '--default-search',
      'ytsearch',
      ytSearchQuery,
    ];

    const child = spawn('python', args);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    const timeout = setTimeout(() => {
      child.kill();
      resolve([]);
    }, 12000);

    child.on('close', async (code) => {
      clearTimeout(timeout);

      if (code !== 0 && !stdout.trim()) {
        console.warn(`[SearchEngine] yt-dlp exited with code ${code}: ${stderr.slice(0, 100)}`);
        // If standard search returned empty and query might have been restricted, try NSFW engine
        const fallbackNsfw = await searchNsfwVideos(options);
        resolve(fallbackNsfw);
        return;
      }

      try {
        const rawLines = stdout.trim().split('\n').filter((l) => l.trim().length > 0);
        const results: SearchResultItem[] = [];

        for (const line of rawLines) {
          try {
            const raw = JSON.parse(line);
            if (!raw || !raw.id) continue;

            const durationSec = Math.round(raw.duration || 0);

            // Filter duration if requested
            if (options.duration === 'short' && durationSec > 120) continue;
            if (options.duration === 'medium' && (durationSec <= 120 || durationSec > 600)) continue;
            if (options.duration === 'long' && durationSec <= 600) continue;

            let thumb = raw.thumbnail;
            if (!thumb && Array.isArray(raw.thumbnails) && raw.thumbnails.length > 0) {
              thumb = raw.thumbnails[raw.thumbnails.length - 1].url;
            }
            if (!thumb) {
              thumb = `https://i.ytimg.com/vi/${raw.id}/hqdefault.jpg`;
            }

            const videoUrl = raw.url && raw.url.startsWith('http')
              ? raw.url
              : `https://www.youtube.com/watch?v=${raw.id}`;

            const tags = extractTags(raw.title || '', raw.description, raw.tags);

            results.push({
              id: raw.id,
              title: raw.title || 'Video sin título',
              description: raw.description ? raw.description.slice(0, 180) : undefined,
              thumbnail: thumb,
              duration: durationSec,
              durationFormatted: formatDuration(durationSec),
              uploader: raw.uploader || raw.channel || 'Creador de contenido',
              platform: 'youtube',
              views: raw.view_count,
              viewsFormatted: formatViews(raw.view_count),
              uploadedAt: raw.upload_date,
              url: videoUrl,
              tags: tags.length > 0 ? tags : [`#${searchQuery.split(' ')[0]}`],
            });
          } catch {
            // Ignore single malformed line
          }
        }

        // Apply sorting
        if (options.sortBy === 'views') {
          results.sort((a, b) => (b.views || 0) - (a.views || 0));
        } else if (options.sortBy === 'duration_asc') {
          results.sort((a, b) => a.duration - b.duration);
        } else if (options.sortBy === 'duration_desc') {
          results.sort((a, b) => b.duration - a.duration);
        }

        if (results.length > 0) {
          searchCache.set(cacheKey, { timestamp: Date.now(), results });
          resolve(results);
        } else {
          // If 0 results on YouTube, check NSFW engine
          const fallbackNsfw = await searchNsfwVideos(options);
          resolve(fallbackNsfw);
        }
      } catch (err) {
        console.error('[SearchEngine] Parse error:', err);
        const fallbackNsfw = await searchNsfwVideos(options);
        resolve(fallbackNsfw);
      }
    });

    child.on('error', async () => {
      clearTimeout(timeout);
      const fallbackNsfw = await searchNsfwVideos(options);
      resolve(fallbackNsfw);
    });
  });
}
