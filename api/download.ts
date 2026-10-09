import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const fileUrl = req.query.url as string;
    const requestedName = (req.query.filename as string) || 'twitter_video.mp4';

    if (!fileUrl) {
      res.status(400).send('Falta el parámetro url');
      return;
    }

    const safeFilename = requestedName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

    const upstreamRes = await fetch(fileUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      res.status(502).send('No se pudo descargar el archivo de origen');
      return;
    }

    const contentType =
      upstreamRes.headers.get('content-type') ||
      (safeFilename.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4');
    const contentLength = upstreamRes.headers.get('content-length');

    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch {
    res.status(500).send('Error interno en la descarga');
  }
}
