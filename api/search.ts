import type { VercelRequest, VercelResponse } from '@vercel/node';
import { searchVideos } from '../server/searchEngine';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      res.status(400).json({ success: false, error: 'Se requiere un término de búsqueda o etiqueta.' });
      return;
    }

    const platform = (req.query.platform as string) || 'all';
    const duration = (req.query.duration as 'all' | 'short' | 'medium' | 'long') || 'all';
    const sortBy = (req.query.sortBy as 'relevance' | 'views' | 'date' | 'duration_asc' | 'duration_desc') || 'relevance';
    const nsfw = req.query.nsfw === 'true' || platform === 'nsfw';
    const limit = parseInt(req.query.limit as string) || 24;

    const results = await searchVideos({
      query,
      platform,
      duration,
      sortBy,
      nsfw,
      limit,
    });

    res.status(200).json({
      success: true,
      query,
      total: results.length,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al realizar la búsqueda de videos.';
    res.status(500).json({ success: false, error: message });
  }
}
