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
    python: '#Python',
    ia: '#IA',
    ai: '#AI',
    gaming: '#Gaming',
    musica: '#Musica',
    music: '#Music',
    trailer: '#Trailer',
    meme: '#Meme',
    futbol: '#Futbol',
    tutorial: '#Tutorial',
    tech: '#Tech',
    clips: '#Clips',
    shorts: '#Shorts',
    viral: '#Viral',
  };

  const lower = fullText.toLowerCase();
  for (const [key, tag] of Object.entries(keywordMap)) {
    if (lower.includes(key)) {
      set.add(tag);
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
    query: 'top amateur viral trending',
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

// 1. Pure TypeScript / Node.js YouTube Search with Pagination
async function searchPureYouTube(options: SearchOptions): Promise<{ results: SearchResultItem[]; hasMore: boolean }> {
  const cleanQuery = options.query.replace(/#/g, '').trim();
  const page = options.page || 1;
  const limit = Math.min(options.limit || 24, 35);

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    });

    if (!res.ok) return { results: [], hasMore: false };

    const html = await res.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/) || html.match(/ytInitialData\s*=\s*({.+?});/);
    if (!match) return { results: [], hasMore: false };

    const data = JSON.parse(match[1]);
    const sectionList = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

    let rawVideoItems: any[] = [];
    let continuationToken = '';

    for (const s of sectionList) {
      if (s.itemSectionRenderer?.contents) {
        rawVideoItems.push(...s.itemSectionRenderer.contents);
      }
      if (s.continuationItemRenderer) {
        continuationToken = s.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token || '';
      }
    }

    // If page > 1 and we have a continuation token, fetch next batch
    if (page > 1 && continuationToken) {
      let currentPage = 1;
      let currentToken = continuationToken;

      while (currentPage < page && currentToken) {
        try {
          const contRes = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            },
            body: JSON.stringify({
              context: {
                client: {
                  clientName: 'WEB',
                  clientVersion: '2.20240301.00.00',
                  hl: 'es',
                  gl: 'ES',
                },
              },
              continuation: currentToken,
            }),
          });

          if (!contRes.ok) break;

          const contJson = await contRes.json();
          const contItems = contJson.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems || [];

          rawVideoItems = [];
          currentToken = '';

          for (const item of contItems) {
            if (item.itemSectionRenderer?.contents) {
              rawVideoItems.push(...item.itemSectionRenderer.contents);
            }
            if (item.continuationItemRenderer) {
              currentToken = item.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token || '';
            }
          }

          currentPage++;
          continuationToken = currentToken;
        } catch {
          break;
        }
      }
    }

    const results: SearchResultItem[] = [];

    for (const item of rawVideoItems) {
      if (!item.videoRenderer) continue;
      const v = item.videoRenderer;
      if (!v.videoId) continue;

      const durationText = v.lengthText?.simpleText || '00:00';
      const durationSec = parseDurationSec(durationText);

      // Duration filter
      if (options.duration === 'short' && durationSec > 120) continue;
      if (options.duration === 'medium' && (durationSec <= 120 || durationSec > 600)) continue;
      if (options.duration === 'long' && durationSec <= 600) continue;

      const title = v.title?.runs?.[0]?.text || 'Video de YouTube';
      const uploader = v.ownerText?.runs?.[0]?.text || 'Creador de YouTube';
      const viewsText = v.viewCountText?.simpleText || '';
      const viewsMatch = viewsText.match(/[\d\.]+/);
      const views = viewsMatch ? parseInt(viewsMatch[0].replace(/\./g, '')) : undefined;

      let thumb = `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
      if (v.thumbnail?.thumbnails && Array.isArray(v.thumbnail.thumbnails) && v.thumbnail.thumbnails.length > 0) {
        thumb = v.thumbnail.thumbnails[v.thumbnail.thumbnails.length - 1].url;
      }

      const tags = extractTags(title, v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.[0]?.text);

      results.push({
        id: v.videoId,
        title,
        description: v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.[0]?.text,
        thumbnail: thumb,
        duration: durationSec,
        durationFormatted: durationText,
        uploader,
        platform: 'youtube',
        views,
        viewsFormatted: viewsText ? viewsText.split(' ')[0] : undefined,
        uploadedAt: v.publishedTimeText?.simpleText,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        tags: tags.length > 0 ? tags : [`#${cleanQuery.split(' ')[0]}`],
      });

      if (results.length >= limit) break;
    }

    // Sort
    if (options.sortBy === 'duration_asc') {
      results.sort((a, b) => a.duration - b.duration);
    } else if (options.sortBy === 'duration_desc') {
      results.sort((a, b) => b.duration - a.duration);
    }

    return {
      results,
      hasMore: results.length >= 8 || !!continuationToken,
    };
  } catch (err) {
    console.error('[SearchEngine] Pure YouTube Search error:', err);
    return { results: [], hasMore: false };
  }
}

// 2. Search NSFW adult videos using public high-speed API with Pagination
async function searchNsfwVideos(options: SearchOptions): Promise<{ results: SearchResultItem[]; hasMore: boolean }> {
  const cleanQuery = options.query.replace(/#/g, '').trim() || 'trending';
  const page = options.page || 1;
  const limit = Math.min(options.limit || 24, 40);

  let order = 'top-weekly';
  if (options.sortBy === 'views') order = 'most-popular';
  if (options.sortBy === 'date') order = 'latest';

  try {
    const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(cleanQuery)}&per_page=${limit}&page=${page}&thumbsize=big&order=${order}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });

    if (!res.ok) {
      return { results: [], hasMore: false };
    }

    const data = await res.json() as {
      total_count?: number;
      total_pages?: number;
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
      return { results: [], hasMore: false };
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

    if (options.sortBy === 'duration_asc') {
      items.sort((a, b) => a.duration - b.duration);
    } else if (options.sortBy === 'duration_desc') {
      items.sort((a, b) => b.duration - a.duration);
    }

    const totalPages = data.total_pages || 10;
    return {
      results: items,
      hasMore: page < totalPages && items.length > 0,
    };
  } catch (err) {
    console.error('[SearchEngine] NSFW Search API error:', err);
    return { results: [], hasMore: false };
  }
}

// Curated Starter Fallback for initial load resilience
function getCuratedStarterResults(page = 1): SearchResultItem[] {
  const starters: SearchResultItem[] = [
    {
      id: 'nKPbfIU442g',
      title: 'Curso de PYTHON desde CERO (Completo)',
      description: 'Aprende programación moderna desde fundamentos hasta proyectos avanzados con buenas prácticas.',
      thumbnail: 'https://i.ytimg.com/vi/nKPbfIU442g/hq720.jpg',
      duration: 29190,
      durationFormatted: '8:06:30',
      uploader: 'Soy Dalto',
      platform: 'youtube',
      views: 6115000,
      viewsFormatted: '6.1M',
      url: 'https://www.youtube.com/watch?v=nKPbfIU442g',
      tags: ['#Python', '#Programacion', '#Tutorial', '#Code'],
    },
    {
      id: '-idMBeCCCzs',
      title: 'Curso de Inteligencia Artificial para principiantes en 10 minutos',
      description: 'Guía rápida y visual sobre cómo funciona la IA generativa, prompts y modelos de lenguaje.',
      thumbnail: 'https://i.ytimg.com/vi/-idMBeCCCzs/hq720.jpg',
      duration: 694,
      durationFormatted: '11:34',
      uploader: 'DonebyLaura',
      platform: 'youtube',
      views: 890000,
      viewsFormatted: '890K',
      url: 'https://www.youtube.com/watch?v=-idMBeCCCzs',
      tags: ['#AI', '#Tech', '#DeepSeek', '#OpenAI'],
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'Top Hits & Música Viral en Tendencia 2026',
      description: 'Los temas más escuchados, videoclips oficiales y ritmos urbanos del momento.',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      duration: 213,
      durationFormatted: '03:33',
      uploader: 'Music Global Hits',
      platform: 'youtube',
      views: 15400000,
      viewsFormatted: '15.4M',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      tags: ['#Music', '#Hits', '#Viral', '#Top'],
    },
    {
      id: 'kXYiU_JCYtU',
      title: 'Mejores Momentos y Goles Épicos de la Champions',
      description: 'Recopilación con las jugadas maestras, regates imposibles y mejores goles en alta definición.',
      thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
      duration: 720,
      durationFormatted: '12:00',
      uploader: 'Sports Ultra HD',
      platform: 'youtube',
      views: 4200000,
      viewsFormatted: '4.2M',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      tags: ['#Futbol', '#Sports', '#Goles', '#Champions'],
    },
    {
      id: 'sample-game-5',
      title: 'Gaming Gameplay & Highlights Épicos 2026',
      description: 'Las mejores partidas competitivas, jugadas de clutch y momentos divertidos en streaming.',
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      duration: 540,
      durationFormatted: '09:00',
      uploader: 'Pixel Gaming Hub',
      platform: 'youtube',
      views: 3100000,
      viewsFormatted: '3.1M',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      tags: ['#Gaming', '#Highlights', '#Twitch', '#eSports'],
    },
    {
      id: 'sample-cine-6',
      title: 'Trailer Oficial Estrenos de Cine y Series',
      description: 'Adelantos exclusivos de las producciones más esperadas en calidad 4K HDR.',
      thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
      duration: 180,
      durationFormatted: '03:00',
      uploader: 'Cinema Trailers Pro',
      platform: 'youtube',
      views: 8200000,
      viewsFormatted: '8.2M',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      tags: ['#Cine', '#Trailer', '#Estrenos', '#Series'],
    },
  ];

  if (page > 1) {
    return starters.slice(2, 6);
  }
  return starters;
}

// Perform fast multi-platform video search with pagination (Serverless & Express native)
export async function searchVideos(options: SearchOptions): Promise<SearchResponse> {
  const cleanQuery = options.query.trim();
  const page = options.page || 1;
  if (!cleanQuery) return { results: [], page, hasMore: false, total: 0 };

  const isNsfw = options.nsfw === true || options.platform === 'nsfw' || isNsfwQuery(cleanQuery);
  const limit = Math.min(options.limit || 24, 40);
  const cacheKey = `${cleanQuery.toLowerCase()}_${options.platform || 'all'}_${options.duration || 'all'}_${options.sortBy || 'relevance'}_${isNsfw ? 'nsfw' : 'safe'}_p${page}_${limit}`;

  // Check cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      results: cached.results,
      page,
      hasMore: cached.hasMore,
      total: cached.results.length,
    };
  }

  // 1. If NSFW search is triggered, query adult video engine
  if (isNsfw) {
    const nsfwData = await searchNsfwVideos(options);
    if (nsfwData.results.length > 0) {
      searchCache.set(cacheKey, { timestamp: Date.now(), results: nsfwData.results, hasMore: nsfwData.hasMore });
      return {
        results: nsfwData.results,
        page,
        hasMore: nsfwData.hasMore,
        total: nsfwData.results.length,
      };
    }
  }

  // 2. Perform zero-dependency Pure YouTube search
  const ytData = await searchPureYouTube(options);
  if (ytData.results.length > 0) {
    searchCache.set(cacheKey, { timestamp: Date.now(), results: ytData.results, hasMore: ytData.hasMore });
    return {
      results: ytData.results,
      page,
      hasMore: ytData.hasMore,
      total: ytData.results.length,
    };
  }

  // 3. Fallback to adult engine if 0 results
  const fallbackNsfw = await searchNsfwVideos(options);
  if (fallbackNsfw.results.length > 0) {
    searchCache.set(cacheKey, { timestamp: Date.now(), results: fallbackNsfw.results, hasMore: fallbackNsfw.hasMore });
    return {
      results: fallbackNsfw.results,
      page,
      hasMore: fallbackNsfw.hasMore,
      total: fallbackNsfw.results.length,
    };
  }

  // 4. Curated starter fallback for initial load resilience
  const starters = getCuratedStarterResults(page);
  return { results: starters, page, hasMore: page < 3, total: starters.length };
}
