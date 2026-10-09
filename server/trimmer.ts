import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';

export interface TrimOptions {
  videoUrl: string;
  start: number;
  end: number;
  format: 'mp4' | 'gif';
  outputFilename: string;
}

export async function processVideoTrim(options: TrimOptions): Promise<{
  filePath: string;
  contentType: string;
  cleanup: () => void;
}> {
  const { videoUrl, start, end, format } = options;
  const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const tempIn = path.join(os.tmpdir(), `twitter_in_${uniqueId}.mp4`);
  const tempOut = path.join(os.tmpdir(), `twitter_out_${uniqueId}.${format}`);

  // Fetch upstream video
  const upstreamRes = await fetch(videoUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!upstreamRes.ok) {
    throw new Error('No se pudo descargar el video original para procesar.');
  }

  const arrayBuf = await upstreamRes.arrayBuffer();
  fs.writeFileSync(tempIn, Buffer.from(arrayBuf));

  const cleanup = () => {
    try {
      if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
      if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
    } catch {
      // Ignore cleanup error
    }
  };

  const ffmpegExe = ffmpegPath || 'ffmpeg';

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

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegExe, ffmpegArgs);

    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    const timeout = setTimeout(() => {
      proc.kill();
      cleanup();
      reject(new Error('El procesamiento tardó demasiado tiempo.'));
    }, 45000);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0 || !fs.existsSync(tempOut)) {
        cleanup();
        reject(new Error(`Error al procesar con FFmpeg: ${stderr.slice(-200)}`));
        return;
      }

      resolve({
        filePath: tempOut,
        contentType: format === 'gif' ? 'image/gif' : 'video/mp4',
        cleanup,
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      cleanup();
      reject(err);
    });
  });
}
