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
  platform: 'youtube' | 'twitter' | 'tiktok' | 'reddit' | 'other';
  views?: number;
  viewsFormatted?: string;
  uploadedAt?: string;
  url: string;
  tags: string[];
}

export interface SearchOptions {
  query: string;
  platform?: string;
  duration?: 'all' | 'short' | 'medium' | 'long';
  sortBy?: 'relevance' | 'views' | 'date' | 'duration_asc' | 'duration_desc';
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

  // Common keywords to auto-tag if matched
  const keywordMap: Record<string, string> = {
    python: '#Python',
    javascript: '#JavaScript',
    react: '#React',
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
    podcast: '#Podcast',
  };

  const lower = fullText.toLowerCase();
  for (const [key, tag] of Object.entries(keywordMap)) {
    if (lower.includes(key)) {
      set.add(tag);
    }
  }

  return Array.from(set).slice(0, 6);
}

// Curated Category Presets & Samples for immediate discovery
export const CATEGORY_PRESETS: Record<string, { label: string; icon: string; query: string; tags: string[] }> = {
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
};

// Auto-suggestions dictionary and helper
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
  'rutinas de ejercicio en casa',
  'documental universo astronomia',
  'podcast clips espanol',
];

export function getSearchSuggestions(query: string): string[] {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return POPULAR_SUGGESTIONS.slice(0, 8);
  }

  const matches = POPULAR_SUGGESTIONS.filter((s) => s.toLowerCase().includes(clean));
  if (matches.length < 5) {
    matches.push(
      `${clean} tutorial`,
      `${clean} highlights`,
      `${clean} clips virales`,
      `${clean} review espanol`
    );
  }
  return Array.from(new Set(matches)).slice(0, 8);
}

// Perform fast multi-platform video search using yt-dlp flat-playlist and public resolvers
export async function searchVideos(options: SearchOptions): Promise<SearchResultItem[]> {
  const cleanQuery = options.query.trim();
  if (!cleanQuery) return [];

  const limit = Math.min(options.limit || 20, 40);
  const cacheKey = `${cleanQuery.toLowerCase()}_${options.platform || 'all'}_${options.duration || 'all'}_${options.sortBy || 'relevance'}_${limit}`;

  // Check cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.results;
  }

  return new Promise((resolve) => {
    // Construct search term based on query and platform
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
      resolve(getFallbackResults(cleanQuery));
    }, 12000);

    child.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0 && !stdout.trim()) {
        console.warn(`[SearchEngine] yt-dlp exited with code ${code}: ${stderr.slice(0, 100)}`);
        const fallback = getFallbackResults(cleanQuery);
        resolve(fallback);
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

            // Determine thumbnail
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
              uploaderAvatar: raw.channel_url ? undefined : undefined,
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

        // Cache results
        searchCache.set(cacheKey, {
          timestamp: Date.now(),
          results,
        });

        resolve(results.length > 0 ? results : getFallbackResults(cleanQuery));
      } catch (err) {
        console.error('[SearchEngine] Parse error:', err);
        resolve(getFallbackResults(cleanQuery));
      }
    });

    child.on('error', () => {
      clearTimeout(timeout);
      resolve(getFallbackResults(cleanQuery));
    });
  });
}

// Fallback curated sample results in case yt-dlp encounters network restrictions
function getFallbackResults(query: string): SearchResultItem[] {
  const q = query.toLowerCase();
  const samples: SearchResultItem[] = [
    {
      id: 'sample-ai-1',
      title: 'El Futuro de la Inteligencia Artificial: Novedades y Modelos 2026',
      description: 'Análisis exhaustivo de los últimos avances en IA, razonamiento lógico y aplicaciones.',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      duration: 540,
      durationFormatted: '09:00',
      uploader: 'Tech Future Labs',
      platform: 'youtube',
      views: 850400,
      viewsFormatted: '850K',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      tags: ['#AI', '#Tech', '#Futuro', '#Innovacion'],
    },
    {
      id: 'sample-python-2',
      title: 'Python y Machine Learning Completo en Español',
      description: 'Aprende programación moderna, librerías esenciales y proyectos prácticos paso a paso.',
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      duration: 1240,
      durationFormatted: '20:40',
      uploader: 'Code Masters Pro',
      platform: 'youtube',
      views: 1240000,
      viewsFormatted: '1.2M',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      tags: ['#Python', '#Programacion', '#Tutorial', '#Code'],
    },
    {
      id: 'sample-gaming-3',
      title: 'Top 10 Jugadas Épicas y Momentos Gaming del Año',
      description: 'Las mejores partidas, clutchs imposibles y momentos divertidos recopilados en HD.',
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      duration: 480,
      durationFormatted: '08:00',
      uploader: 'Pixel Gaming Hub',
      platform: 'youtube',
      views: 3100000,
      viewsFormatted: '3.1M',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      tags: ['#Gaming', '#Highlights', '#Clips', '#eSports'],
    },
    {
      id: 'sample-music-4',
      title: 'Chill Lofi Beats & Synthwave para Concentrarse y Estudiar',
      description: 'Sesión continua de música lofi relajante de alta fidelidad con visuales ambientales.',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      duration: 3600,
      durationFormatted: '1:00:00',
      uploader: 'Synthwave Sessions',
      platform: 'youtube',
      views: 5400000,
      viewsFormatted: '5.4M',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      tags: ['#Music', '#Lofi', '#Relax', '#Chill'],
    },
  ];

  return samples.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q)) ||
      s.uploader.toLowerCase().includes(q) ||
      q.length <= 3
  );
}
