import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const query = ((req.query.q as string) || '').trim().toLowerCase();
  const isNsfw = req.query.nsfw === 'true';

  if (!query) {
    const suggestions = isNsfw
      ? ['amateur homemade', 'top weekly trending', 'latina viral', 'cosplay hd', 'webcam clips']
      : POPULAR_SUGGESTIONS.slice(0, 8);
    res.status(200).json({ success: true, suggestions });
    return;
  }

  const matches = POPULAR_SUGGESTIONS.filter((s) => s.toLowerCase().includes(query));
  if (matches.length < 5) {
    matches.push(
      `${query} tutorial`,
      `${query} highlights`,
      `${query} clips virales`,
      `${query} HD`
    );
  }

  const suggestions = Array.from(new Set(matches)).slice(0, 8);
  res.status(200).json({ success: true, suggestions });
}
