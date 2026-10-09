import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractVideo } from '../server/extractor';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido. Utiliza POST.' });
    return;
  }

  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'La URL del tweet es obligatoria.' });
      return;
    }

    const data = await extractVideo(url);
    res.status(200).json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado al procesar el tweet.';
    res.status(422).json({ error: message });
  }
}
