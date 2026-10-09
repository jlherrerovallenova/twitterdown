import type { VercelRequest, VercelResponse } from '@vercel/node';

const CATEGORY_PRESETS = {
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

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ success: true, categories: CATEGORY_PRESETS });
}
