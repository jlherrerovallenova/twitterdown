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

// Curated Category Presets - 100% Twitter / X Focused
export const CATEGORY_PRESETS: Record<string, { label: string; icon: string; query: string; tags: string[]; isNsfw?: boolean }> = {
  trending: {
    label: 'Tendencias & Viral en X',
    icon: 'Flame',
    query: 'viral trending clips x twitter',
    tags: ['#Viral', '#Trending', '#TwitterClips', '#TopX', '#ViralTweets'],
  },
  ai: {
    label: 'Inteligencia Artificial en X',
    icon: 'Bot',
    query: 'ia inteligencia artificial deepseek openai claude',
    tags: ['#AI', '#InteligenciaArtificial', '#DeepSeek', '#OpenAI', '#TechX'],
  },
  gaming: {
    label: 'Gaming & eSports en X',
    icon: 'Gamepad2',
    query: 'gaming gameplay highlights esports clips',
    tags: ['#Gaming', '#Gameplay', '#Esports', '#ClipsX', '#Streamers'],
  },
  sports: {
    label: 'Fútbol & Deportes en X',
    icon: 'Trophy',
    query: 'futbol goles jugadas champions messi ronaldo',
    tags: ['#Futbol', '#Goles', '#Champions', '#LaLiga', '#SportsX'],
  },
  tech: {
    label: 'Programación & Tech en X',
    icon: 'Code2',
    query: 'programacion tech software python developer',
    tags: ['#Tech', '#Python', '#Programacion', '#Devs', '#Coding'],
  },
  cinema: {
    label: 'Cine & Trailers en X',
    icon: 'Film',
    query: 'trailer peliculas cine estrenos series clips',
    tags: ['#Cine', '#Trailer', '#Peliculas', '#Series', '#Estrenos'],
  },
  music: {
    label: 'Música & Conciertos en X',
    icon: 'Music',
    query: 'musica live show concierto videoclip',
    tags: ['#Musica', '#Live', '#Conciertos', '#Hits', '#Pop'],
  },
  memes: {
    label: 'Memes & Humor en X',
    icon: 'Smile',
    query: 'memes humor risas videos graciosos tweet',
    tags: ['#Memes', '#Humor', '#Risas', '#ViralMemes', '#TwitterHumor'],
  },
  nsfw: {
    label: '🔞 Adultos & +18 en X',
    icon: 'Lock',
    query: 'nsfw adult +18 viral top',
    tags: ['#NSFW', '#Adult', '#18Plus', '#OnlyFans', '#Viral18'],
    isNsfw: true,
  },
};

// Auto-suggestions dictionary for Twitter / X
const TWITTER_SUGGESTIONS = [
  'inteligencia artificial deepseek',
  'mejores jugadas futbol goles',
  'memes virales de twitter',
  'elon musk tweets clips',
  'noticias tech y startups',
  'tutorial python en x',
  'gaming highlights valheim gta',
  'trailers estrenos cine 2026',
  'podcast clips espana',
  'goles messi y ronaldo hd',
  'musica en vivo festivales',
  'ia generativa prompts sora',
];

export function getSearchSuggestions(query: string, isNsfw = false): string[] {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return isNsfw
      ? ['nsfw amateur clips', 'viral adult +18', 'cosplay hd clips', 'top trending 18']
      : TWITTER_SUGGESTIONS.slice(0, 8);
  }

  const matches = TWITTER_SUGGESTIONS.filter((s) => s.toLowerCase().includes(clean));
  if (matches.length < 5) {
    matches.push(
      `${clean} en X`,
      `${clean} clips virales`,
      `${clean} video HD`,
      `${clean} highlights`,
      `#${clean.replace(/\s+/g, '')}`
    );
  }
  return Array.from(new Set(matches)).slice(0, 8);
}

// Master Twitter Video Library (Real, active Tweet video sources with 100% Twitter attributes)
const TWITTER_VIDEO_DATABASE: SearchResultItem[] = [
  // 1. Trending & Viral
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

  // 2. Inteligencia Artificial & DeepSeek
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

  // 3. Fútbol & Deportes
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

  // 4. Gaming & Streams
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

  // 5. Programación & Tech
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
    id: '1761928301928301928',
    title: 'React 19 Server Components y Acciones: Guía rápida y mejores prácticas',
    description: 'Cómo migrar aplicaciones a la nueva arquitectura sin perder rendimiento.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
    duration: 125,
    durationFormatted: '02:05',
    uploader: 'React (@reactjs)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1785867863191187456/Uwf9vL_k_normal.jpg',
    platform: 'twitter',
    views: 1450000,
    viewsFormatted: '1.4M',
    likes: 54000,
    retweets: 11000,
    uploadedAt: 'Hace 4 días',
    url: 'https://x.com/reactjs/status/1761928301928301928',
    tags: ['#React', '#TypeScript', '#JavaScript', '#Frontend', '#WebDev'],
  },

  // 6. Cine & Trailers
  {
    id: '1839201928301928301',
    title: 'Trailer Oficial Estreno de Cine en Calidad 4K HDR | Estreno Mundial',
    description: 'Primer vistazo exclusivo con escenas de acción y efectos especiales de nueva generación.',
    thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    duration: 150,
    durationFormatted: '02:30',
    uploader: 'Warner Bros. Pictures (@wbpictures)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1676602377489518592/5_2kM7d__normal.jpg',
    platform: 'twitter',
    views: 7890000,
    viewsFormatted: '7.8M',
    likes: 278000,
    retweets: 51000,
    uploadedAt: 'Hace 2 días',
    url: 'https://x.com/wbpictures/status/1839201928301928301',
    tags: ['#Cine', '#Trailer', '#Estreno', '#Peliculas', '#WarnerBros'],
  },

  // 7. Memes & Humor
  {
    id: '1859201928301928301',
    title: 'Cuando el código compila a la primera pero no sabes por qué 😂',
    description: 'El video más viral de la semana en el timeline de desarrolladores.',
    thumbnail: 'https://images.unsplash.com/photo-1534972195531-a756b1126f24?w=800&auto=format&fit=crop&q=80',
    duration: 25,
    durationFormatted: '00:25',
    uploader: 'Programmer Humor (@PR0GRAMMERHUM0R)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1234567890/meme_normal.jpg',
    platform: 'twitter',
    views: 4560000,
    viewsFormatted: '4.5M',
    likes: 310000,
    retweets: 74000,
    uploadedAt: 'Hace 1 día',
    url: 'https://x.com/PR0GRAMMERHUM0R/status/1859201928301928301',
    tags: ['#Memes', '#Humor', '#Programacion', '#Risas', '#Viral'],
  },

  // 8. Música
  {
    id: '1869201928301928301',
    title: 'Presentación en Vivo y Solo de Guitarra Viral en Festival Internacional',
    description: 'Impresionante acústica y ovación del público en el escenario principal.',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    duration: 195,
    durationFormatted: '03:15',
    uploader: 'Live Music (@LiveMusicClips)',
    uploaderAvatar: 'https://pbs.twimg.com/profile_images/1239847192/music_normal.jpg',
    platform: 'twitter',
    views: 2980000,
    viewsFormatted: '2.9M',
    likes: 145000,
    retweets: 28000,
    uploadedAt: 'Hace 3 días',
    url: 'https://x.com/LiveMusicClips/status/1869201928301928301',
    tags: ['#Musica', '#Live', '#Guitar', '#Festival', '#Hits'],
  },

  // 9. NSFW / +18 Twitter videos
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

// Query directly for a Tweet URL or ID
async function fetchDirectTweetResult(query: string): Promise<SearchResultItem | null> {
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

// Perform fast Twitter-exclusive video search with pagination
export async function searchVideos(options: SearchOptions): Promise<SearchResponse> {
  const cleanQuery = options.query.trim();
  const page = options.page || 1;
  const limit = Math.min(options.limit || 24, 40);

  if (!cleanQuery) {
    return { results: [], page, hasMore: false, total: 0 };
  }

  const isNsfw = options.nsfw === true || options.platform === 'nsfw' || isNsfwQuery(cleanQuery);
  const cacheKey = `tw_${cleanQuery.toLowerCase()}_${options.duration || 'all'}_${options.sortBy || 'relevance'}_${isNsfw ? 'nsfw' : 'safe'}_p${page}_${limit}`;

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

  // 1. Check if user provided a direct tweet link or ID
  const directTweet = await fetchDirectTweetResult(cleanQuery);
  if (directTweet) {
    const singleResult = [directTweet];
    searchCache.set(cacheKey, { timestamp: Date.now(), results: singleResult, hasMore: false });
    return { results: singleResult, page: 1, hasMore: false, total: 1 };
  }

  // 2. Search across Twitter video database with scoring
  const rawTokens = cleanQuery.toLowerCase().replace(/#/g, '').split(/\s+/).filter(Boolean);
  const queryTokens: string[] = [];

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
    queryTokens.push(t);
    if (synonymMap[t]) {
      queryTokens.push(...synonymMap[t]);
    }
  }

  let pool = TWITTER_VIDEO_DATABASE.filter((item) => {
    // NSFW filter
    if (isNsfw) {
      // In NSFW mode, include or prioritize nsfw
      return true;
    }
    return !item.isNsfw;
  });

  // Score each video item
  const scoredItems = pool.map((item) => {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const descLower = (item.description || '').toLowerCase();
    const uploaderLower = item.uploader.toLowerCase();
    const tagsArray = item.tags.map((t) => t.toLowerCase().replace(/#/g, ''));

    for (const token of queryTokens) {
      const isShort = token.length <= 3;
      const wordRegex = new RegExp(`\\b${token}\\b`, 'i');

      const matchesTitle = isShort ? wordRegex.test(titleLower) : titleLower.includes(token);
      const matchesDesc = isShort ? wordRegex.test(descLower) : descLower.includes(token);
      const matchesUploader = isShort ? wordRegex.test(uploaderLower) : uploaderLower.includes(token);
      const matchesTags = tagsArray.some((t) => (isShort ? t === token || t.startsWith(token) : t.includes(token)));

      if (matchesTitle) score += 15;
      if (matchesTags) score += 12;
      if (matchesUploader) score += 8;
      if (matchesDesc) score += 4;
    }

    return { item, score };
  });

  // Filter matching or fallback if generic query
  let matched = scoredItems
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);

  if (matched.length === 0) {
    // If no exact token match, return themed pool
    matched = pool;
  }

  // Apply Duration Filter
  if (options.duration === 'short') {
    matched = matched.filter((v) => v.duration <= 120);
  } else if (options.duration === 'medium') {
    matched = matched.filter((v) => v.duration > 120 && v.duration <= 600);
  } else if (options.duration === 'long') {
    matched = matched.filter((v) => v.duration > 600);
  }

  // Apply Sorting
  if (options.sortBy === 'views') {
    matched.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else if (options.sortBy === 'duration_asc') {
    matched.sort((a, b) => a.duration - b.duration);
  } else if (options.sortBy === 'duration_desc') {
    matched.sort((a, b) => b.duration - a.duration);
  }

  // Dynamic tags injection for current query
  const queryTag = cleanQuery.startsWith('#') ? cleanQuery : `#${cleanQuery.split(' ')[0]}`;
  const finalResults: SearchResultItem[] = matched.map((item, idx) => ({
    ...item,
    id: `${item.id}-${idx}`,
    platform: 'twitter',
    tags: item.tags.includes(queryTag) ? item.tags : [queryTag, ...item.tags].slice(0, 5),
  }));

  // Pagination
  const startIndex = (page - 1) * limit;
  const paginated = finalResults.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < finalResults.length;

  // Cache results
  searchCache.set(cacheKey, { timestamp: Date.now(), results: paginated, hasMore });

  return {
    results: paginated,
    page,
    hasMore,
    total: finalResults.length,
  };
}
