import type { VercelRequest, VercelResponse } from '@vercel/node';

const CATEGORY_PRESETS = {
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

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ success: true, categories: CATEGORY_PRESETS });
}
