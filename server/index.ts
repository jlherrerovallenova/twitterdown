import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import { extractVideo, SAMPLE_TWEETS } from './extractor';
import { processVideoTrim } from './trimmer';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Samples endpoint
app.get('/api/samples', (_req, res) => {
  const samples = Object.values(SAMPLE_TWEETS).map((s) => ({
    id: s.id,
    title: s.author.name,
    screenName: s.author.screenName,
    text: s.text,
    thumbnail: s.thumbnail,
    duration: s.duration,
  }));
  res.json({ samples });
});

// Extract video metadata
app.post('/api/extract', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'La URL del tweet es obligatoria.' });
      return;
    }

    const data = await extractVideo(url);
    res.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado al procesar el tweet.';
    res.status(422).json({ error: message });
  }
});

// Direct Download Streaming Proxy
app.get('/api/download', async (req, res) => {
  try {
    const fileUrl = req.query.url as string;
    const requestedName = (req.query.filename as string) || 'twitter_video.mp4';

    if (!fileUrl) {
      res.status(400).send('Falta el parámetro url');
      return;
    }

    // Sanitize filename
    const safeFilename = requestedName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

    // Fetch upstream media stream
    const upstreamRes = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      res.status(502).send('No se pudo descargar el archivo de origen');
      return;
    }

    const contentType = upstreamRes.headers.get('content-type') || (safeFilename.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4');
    const contentLength = upstreamRes.headers.get('content-length');

    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Pipe response stream to express
    const reader = upstreamRes.body.getReader();

    async function streamNext() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        streamNext();
      } catch (err) {
        res.end();
      }
    }

    streamNext();
  } catch (err) {
    res.status(500).send('Error interno en la descarga');
  }
});

// Video Trimming & GIF Conversion endpoint
app.get('/api/trim', async (req, res) => {
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

    const stream = fs.createReadStream(result.filePath);
    stream.pipe(res);

    stream.on('end', () => {
      result.cleanup();
    });

    stream.on('error', () => {
      result.cleanup();
      res.end();
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al procesar el recorte';
    res.status(500).send(msg);
  }
});

app.listen(PORT, () => {
  console.log(`[Backend] Twitter Downloader API corriendo en http://localhost:${PORT}`);
});
