import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'node:fs';
import { processVideoTrim } from '../server/trimmer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const videoUrl = req.query.url as string;
    const start = parseFloat(req.query.start as string) || 0;
    const end = parseFloat(req.query.end as string) || 0;
    const format = (req.query.format === 'gif' ? 'gif' : 'mp4') as 'mp4' | 'gif';
    const requestedName = (req.query.filename as string) || `twitter_clip.${format}`;

    if (!videoUrl || end <= start) {
      res.status(400).send('Parámetros de recorte inválidos.');
      return;
    }

    const safeFilename = requestedName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

    const result = await processVideoTrim({
      videoUrl,
      start,
      end,
      format,
      outputFilename: safeFilename,
    });

    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', result.contentType);

    const data = fs.readFileSync(result.filePath);
    result.cleanup();
    res.status(200).send(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al procesar el recorte';
    res.status(500).send(msg);
  }
}
