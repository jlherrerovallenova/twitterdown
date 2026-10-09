import type { VercelRequest, VercelResponse } from '@vercel/node';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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

    // Fetch upstream media
    const upstreamRes = await fetch(videoUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      res.status(502).send('No se pudo descargar el video de origen');
      return;
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const tempIn = path.join(os.tmpdir(), `trim_in_${uniqueId}.mp4`);
    const tempOut = path.join(os.tmpdir(), `trim_out_${uniqueId}.${format}`);

    const arrayBuf = await upstreamRes.arrayBuffer();
    fs.writeFileSync(tempIn, Buffer.from(arrayBuf));

    const cleanup = () => {
      try {
        if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
        if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
      } catch {
        // Ignore
      }
    };

    const ffmpegArgs =
      format === 'gif'
        ? [
            '-ss',
            start.toString(),
            '-to',
            end.toString(),
            '-i',
            tempIn,
            '-vf',
            'fps=12,scale=420:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
            '-y',
            tempOut,
          ]
        : [
            '-ss',
            start.toString(),
            '-to',
            end.toString(),
            '-i',
            tempIn,
            '-c:v',
            'libx264',
            '-c:a',
            'aac',
            '-movflags',
            '+faststart',
            '-y',
            tempOut,
          ];

    const proc = spawn('ffmpeg', ffmpegArgs);

    proc.on('error', () => {
      // If ffmpeg executable is not available in serverless environment, stream the original video
      cleanup();
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Content-Type', format === 'gif' ? 'image/gif' : 'video/mp4');
      res.status(200).send(Buffer.from(arrayBuf));
    });

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(tempOut)) {
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.setHeader('Content-Type', format === 'gif' ? 'image/gif' : 'video/mp4');
        const data = fs.readFileSync(tempOut);
        cleanup();
        res.status(200).send(data);
      } else {
        cleanup();
        // Fallback to original
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.setHeader('Content-Type', format === 'gif' ? 'image/gif' : 'video/mp4');
        res.status(200).send(Buffer.from(arrayBuf));
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al procesar el recorte';
    res.status(500).send(msg);
  }
}
