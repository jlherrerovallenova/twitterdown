import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CATEGORY_PRESETS } from '../server/searchEngine';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ success: true, categories: CATEGORY_PRESETS });
}
