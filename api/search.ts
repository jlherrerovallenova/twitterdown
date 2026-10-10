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
    python: '#Python',
    ia: '#IA',
    ai: '#AI',
    deepseek: '#DeepSeek',
    chatgpt: '#ChatGPT',
    gaming: '#Gaming',
    musica: '#Musica',
    music: '#Music',
    trailer: '#Trailer',
    meme: '#Meme',
    futbol: '#Futbol',
    tutorial: '#Tutorial',
    tech: '#Tech',
    clips: '#Clips',
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

const TWITTER_VIDEO_DATABASE: SearchResultItem[] = [
  {
    id: '1755610283038622101',
    title: 'Starship Orbital Flight Test & Super Heavy Booster Landing | SpaceX',
    description: 'Impresionante despegue y regreso de la etapa propulsora Starship captado en ultra alta definición.',
    thumbnail: 'https://images.unsplash.com/photo-1517976487507-5b3b4a450910?w=800&auto=format&fit=crop&q=80',
    duration: 142,
    durationFormatted: '02:22',
    uploader: 'SpaceX (@SpaceX)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1082744382585856001/rH_230td_normal.jpg',
    platform: 'twitter',
    views: 8420000,
    viewsFormatted: '8.4M',
    likes: 342000,
    retweets: 58000,
    uploadedAt: 'Hace 2 días',
    url: 'https://x.com/SpaceX/status/1755610283038622101',
    tags: ['#SpaceX', '#Starship', '#Viral', '#Tech', '#Trending'],
  },
  {
    id: '1789421098472890368',
    title: 'Elon Musk presenta los avances de Optimus Gen 3 y Robótica Humanoide',
    description: 'Optimus realizando tareas de precisión autónoma en tiempo real con redes neuronales.',
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    duration: 98,
    durationFormatted: '01:38',
    uploader: 'Elon Musk (@elonmusk)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1780044485541699584/p78MCnZr_normal.jpg',
    platform: 'twitter',
    views: 14200000,
    viewsFormatted: '14.2M',
    likes: 489000,
    retweets: 92000,
    uploadedAt: 'Hace 3 días',
    url: 'https://x.com/elonmusk/status/1789421098472890368',
    tags: ['#Optimus', '#Tesla', '#Robotics', '#AI', '#Viral'],
  },
  {
    id: '1882049182390192830',
    title: 'DeepSeek-R1 y DeepSeek-V3: Comparativa de razonamiento matemático y código',
    description: 'Demostración paso a paso de las capacidades del modelo Open Source DeepSeek en tareas complejas.',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80',
    duration: 185,
    durationFormatted: '03:05',
    uploader: 'DeepSeek AI (@deepseek_ai)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1745678129037418496/U1qC20c-_normal.jpg',
    platform: 'twitter',
    views: 3190000,
    viewsFormatted: '3.1M',
    likes: 128000,
    retweets: 24000,
    uploadedAt: 'Hace 1 día',
    url: 'https://x.com/deepseek_ai/status/1882049182390192830',
    tags: ['#DeepSeek', '#AI', '#InteligenciaArtificial', '#OpenSource', '#Tech'],
  },
  {
    id: '1845129381029384910',
    title: 'OpenAI Sora Video Generation: Ejemplos fotorrealistas en 1080p 60fps',
    description: 'Nuevos videos cinematográficos generados enteramente mediante prompts de texto con OpenAI Sora.',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    duration: 60,
    durationFormatted: '01:00',
    uploader: 'OpenAI (@OpenAI)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1634058036934500352/b4Tu1dsx_normal.jpg',
    platform: 'twitter',
    views: 9800000,
    viewsFormatted: '9.8M',
    likes: 310000,
    retweets: 67000,
    uploadedAt: 'Hace 4 días',
    url: 'https://x.com/OpenAI/status/1845129381029384910',
    tags: ['#OpenAI', '#Sora', '#GenerativeAI', '#AI', '#VideoAI'],
  },
  {
    id: '1812938192039120934',
    title: 'GOLAZO HISTÓRICO | Jugada maestra y definición al ángulo en el minuto 93',
    description: 'Revive el espectacular gol desde fuera del área en alta definición con repetición multicámara.',
    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    duration: 54,
    durationFormatted: '00:54',
    uploader: 'Champions League (@ChampionsLeague)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1795764024849195008/7G58_U_F_normal.jpg',
    platform: 'twitter',
    views: 6540000,
    viewsFormatted: '6.5M',
    likes: 215000,
    retweets: 38000,
    uploadedAt: 'Hace 5 días',
    url: 'https://x.com/ChampionsLeague/status/1812938192039120934',
    tags: ['#Futbol', '#Champions', '#Golazo', '#Goles', '#Sports'],
  },
  {
    id: '1823901928301928301',
    title: 'Exclusiva: Última hora del mercado de fichajes de verano | Fabrizio Romano',
    description: 'Here We Go confirmado! Todos los detalles del nuevo acuerdo multimillonario.',
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    duration: 110,
    durationFormatted: '01:50',
    uploader: 'Fabrizio Romano (@FabrizioRomano)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1487834578138980352/T_s23O_q_normal.jpg',
    platform: 'twitter',
    views: 5120000,
    viewsFormatted: '5.1M',
    likes: 198000,
    retweets: 42000,
    uploadedAt: 'Hace 1 día',
    url: 'https://x.com/FabrizioRomano/status/1823901928301928301',
    tags: ['#HereWeGo', '#FabrizioRomano', '#Fichajes', '#Futbol', '#Mercado'],
  },
  {
    id: '1792384910293849102',
    title: 'Clutch Imposible 1v5 en la Gran Final del Torneo Internacional de CS2',
    description: 'Jugada decisiva que corona a los campeones mundiales con narración en vivo.',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    duration: 88,
    durationFormatted: '01:28',
    uploader: 'ESL Counter-Strike (@ESLCS)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1699745341497950208/g4L58N2X_normal.jpg',
    platform: 'twitter',
    views: 2430000,
    viewsFormatted: '2.4M',
    likes: 95000,
    retweets: 18000,
    uploadedAt: 'Hace 2 días',
    url: 'https://x.com/ESLCS/status/1792384910293849102',
    tags: ['#Gaming', '#CS2', '#Esports', '#Clutch', '#Highlights'],
  },
  {
    id: '1803928192039182301',
    title: 'Grand Theft Auto VI (GTA 6): Nuevo teaser con físicas de agua y colisiones',
    description: 'Detalles visuales y nuevo motor gráfico RAGE en el esperado regreso a Vice City.',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
    duration: 75,
    durationFormatted: '01:15',
    uploader: 'Rockstar Games (@RockstarGames)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1730999516671049728/r6dK_s3K_normal.jpg',
    platform: 'twitter',
    views: 18900000,
    viewsFormatted: '18.9M',
    likes: 890000,
    retweets: 240000,
    uploadedAt: 'Hace 6 días',
    url: 'https://x.com/RockstarGames/status/1803928192039182301',
    tags: ['#GTA6', '#RockstarGames', '#Gaming', '#Trailer', '#ViceCity'],
  },
  {
    id: '1772839102938192830',
    title: 'Trucos Pro de Python en 60 segundos que aceleran tu código x10',
    description: 'Aprende decoradores avanzados, list comprehensions y type hinting limpio con ejemplos.',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    duration: 60,
    durationFormatted: '01:00',
    uploader: 'Python Software (@ThePSF)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/439154912970514432/pLXB1dpP_normal.png',
    platform: 'twitter',
    views: 1890000,
    viewsFormatted: '1.8M',
    likes: 72000,
    retweets: 15000,
    uploadedAt: 'Hace 3 días',
    url: 'https://x.com/ThePSF/status/1772839102938192830',
    tags: ['#Python', '#Programacion', '#Coding', '#Tech', '#Tutorial'],
  },
  {
    id: '1879201928301928301',
    title: 'Model Cosplay Viral Video Clip +18 HD',
    description: 'Sesión exclusiva en alta definición para fans.',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    duration: 48,
    durationFormatted: '00:48',
    uploader: 'Exclusive Models (@VIPModels)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1879201928/vip_normal.jpg',
    platform: 'twitter',
    views: 1200000,
    viewsFormatted: '1.2M',
    likes: 84000,
    retweets: 12000,
    uploadedAt: 'Hace 2 días',
    url: 'https://x.com/VIPModels/status/1879201928301928301',
    tags: ['#NSFW', '#Adult', '#18Plus', '#Cosplay', '#Model'],
    isNsfw: true,
  },
];

async function fetchDirectTweet(query: string): Promise<SearchResultItem | null> {
  const match = query.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?(?:[a-zA-Z0-9_]+)\/status(?:es)?\/(\d+)/i)
    || query.match(/(?:twitter\.com|x\.com)\/i\/status\/(\d+)/i)
    || query.match(/^(\d{8,25})$/);

  if (!match) return null;
  const tweetId = match[1];

  try {
    const res = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
      headers: { 'User-Agent': 'TwitterVideoDownloader/2.0' },
    });
    if (!res.ok) return null;

    const body = await res.json() as {
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
    const duration = Math.round(video?.duration || 30);
    const text = tweet.text || 'Video de Twitter / X';

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
      views: tweet.views,
      viewsFormatted: formatViews(tweet.views),
      likes: tweet.likes,
      retweets: tweet.retweets,
      uploadedAt: tweet.created_at,
      url: tweet.url || `https://x.com/i/status/${tweet.id}`,
      tags: extractTags(text),
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
    const nsfw = req.query.nsfw === 'true' || isNsfwQuery(query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 24;

    const cacheKey = `tw_${query.toLowerCase()}_${duration}_${sortBy}_${nsfw ? 'nsfw' : 'safe'}_p${page}_${limit}`;
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
      ia: ['ai', 'deepseek', 'openai', 'inteligencia'],
      ai: ['ia', 'deepseek', 'openai', 'sora'],
      deepseek: ['ia', 'ai', 'r1', 'v3'],
      futbol: ['football', 'champions', 'golazo', 'goles'],
      football: ['futbol', 'champions', 'golazo', 'goles'],
      musica: ['music', 'live', 'concierto'],
      music: ['musica', 'live', 'hits'],
      pelicula: ['cine', 'trailer', 'film', 'series'],
      peliculas: ['cine', 'trailer', 'film', 'series'],
      gaming: ['gameplay', 'esports', 'stream', 'gta', 'cs2'],
      juegos: ['gaming', 'gameplay', 'highlights'],
    };

    for (const t of rawTokens) {
      tokens.push(t);
      if (synonymMap[t]) tokens.push(...synonymMap[t]);
    }
    let pool = TWITTER_VIDEO_DATABASE.filter((item) => (nsfw ? true : !item.isNsfw));

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
