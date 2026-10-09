import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSearchSuggestions } from '../server/searchEngine';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const query = (req.query.q as string) || '';
  const isNsfw = req.query.nsfw === 'true';
  const suggestions = getSearchSuggestions(query, isNsfw);
  res.status(200).json({ success: true, suggestions });
}
