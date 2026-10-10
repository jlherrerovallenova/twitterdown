import type { VercelRequest, VercelResponse } from '@vercel/node';

const CATEGORY_PRESETS = {
  trending: {
    label: '🔥 Tendencias +18 en X',
    icon: 'Flame',
    query: 'trending viral nsfw 18 clips x',
    tags: ['#NSFW', '#Viral18', '#TrendingX', '#HotClips', '#TwitterAfterDark'],
    isNsfw: true,
  },
  amateur: {
    label: '📹 Amateur & Casero',
    icon: 'Film',
    query: 'amateur casero homemade real video x',
    tags: ['#Amateur', '#Casero', '#Homemade', '#Real', '#Viral'],
    isNsfw: true,
  },
  onlyfans: {
    label: '💎 OnlyFans & VIPs',
    icon: 'Sparkles',
    query: 'onlyfans leaks vip model clips preview x',
    tags: ['#OnlyFans', '#VIP', '#Models', '#Exclusive', '#Hot'],
    isNsfw: true,
  },
  latina: {
    label: '💃 Latinas & España +18',
    icon: 'Heart',
    query: 'latina espanol casero viral video x',
    tags: ['#Latina', '#Espana18', '#Casero', '#Caliente', '#Hot'],
    isNsfw: true,
  },
  cosplay: {
    label: '🎭 Cosplay & Erotic',
    icon: 'Smile',
    query: 'cosplay erotic anime hot clips x',
    tags: ['#Cosplay18', '#Erotic', '#Anime', '#Fetish', '#Sexy'],
    isNsfw: true,
  },
  pov: {
    label: '👁️ POV & Primer Plano',
    icon: 'Eye',
    query: 'pov perspective hd solo clips x',
    tags: ['#POV', '#Solo', '#HD', '#Exclusive', '#Intense'],
    isNsfw: true,
  },
  hardcore: {
    label: '⚡ Hardcore & Intenso',
    icon: 'Lock',
    query: 'hardcore intense climax viral x',
    tags: ['#Hardcore', '#Climax', '#Intense', '#18Plus', '#UltraHD'],
    isNsfw: true,
  },
  topweekly: {
    label: '⭐ Top Semanal X +18',
    icon: 'Trophy',
    query: 'top weekly best rated adult clips x',
    tags: ['#TopWeekly', '#BestNSFW', '#ViralTweets', '#Popular', '#HD1080p'],
    isNsfw: true,
  },
};

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ success: true, categories: CATEGORY_PRESETS });
}
