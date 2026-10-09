import { spawn } from 'node:child_process';

export interface VideoFormat {
  id: string;
  quality: string;
  resolution: string;
  ext: string;
  filesize?: number;
  url: string;
  hasAudio: boolean;
  hasVideo: boolean;
  bitrate?: number;
}

export interface TweetVideoData {
  id: string;
  url: string;
  text: string;
  author: {
    name: string;
    screenName: string;
    avatar: string;
    verified: boolean;
  };
  thumbnail: string;
  duration: number; // in seconds
  views?: number;
  likes?: number;
  retweets?: number;
  createdAt?: string;
  formats: VideoFormat[];
}

export function extractTweetId(url: string): string | null {
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?(?:[a-zA-Z0-9_]+)\/status(?:es)?\/(\d+)/i)
    || cleanUrl.match(/(?:twitter\.com|x\.com)\/i\/status\/(\d+)/i)
    || cleanUrl.match(/^(\d{8,25})$/);

  return match ? match[1] : null;
}

// 1. Try yt-dlp extraction
async function extractWithYtDlp(tweetUrl: string): Promise<TweetVideoData | null> {
  return new Promise((resolve) => {
    const process = spawn('python', ['-m', 'yt_dlp', '--dump-json', '--no-warnings', tweetUrl]);

    let stdoutData = '';
    let stderrData = '';

    process.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    process.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    const timeout = setTimeout(() => {
      process.kill();
      resolve(null);
    }, 15000);

    process.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0 || !stdoutData.trim()) {
        resolve(null);
        return;
      }

      try {
        const raw = JSON.parse(stdoutData.trim());
        const formats: VideoFormat[] = [];

        if (Array.isArray(raw.formats)) {
          // Twitter formats
          for (const f of raw.formats) {
            if (f.url && f.ext === 'mp4' && f.vcodec !== 'none') {
              const res = f.height ? `${f.height}p` : (f.resolution || 'MP4');
              const qualityLabel = f.height >= 1080 ? 'Full HD (1080p)'
                : f.height >= 720 ? 'HD (720p)'
                : f.height >= 480 ? 'SD (480p)'
                : f.height ? `SD (${f.height}p)` : 'Video MP4';

              formats.push({
                id: f.format_id || `${f.height || 'mp4'}`,
                quality: qualityLabel,
                resolution: res,
                ext: 'mp4',
                filesize: f.filesize || f.filesize_approx,
                url: f.url,
                hasAudio: f.acodec !== 'none',
                hasVideo: true,
                bitrate: f.tbr,
              });
            }
          }
        }

        // Sort descending by resolution/bitrate
        formats.sort((a, b) => {
          const numA = parseInt(a.resolution) || 0;
          const numB = parseInt(b.resolution) || 0;
          if (numA !== numB) return numB - numA;
          return (b.bitrate || 0) - (a.bitrate || 0);
        });

        // Add audio format if best format exists
        if (formats.length > 0) {
          formats.push({
            id: 'audio-only',
            quality: 'Solo Audio (MP3/M4A)',
            resolution: 'Audio',
            ext: 'mp3',
            url: formats[0].url,
            hasAudio: true,
            hasVideo: false,
          });
        }

        const data: TweetVideoData = {
          id: raw.id || '',
          url: tweetUrl,
          text: raw.description || raw.title || '',
          author: {
            name: raw.uploader || 'Twitter User',
            screenName: raw.uploader_id ? `@${raw.uploader_id}` : '@twitter',
            avatar: raw.thumbnail || '',
            verified: false,
          },
          thumbnail: raw.thumbnail || '',
          duration: Math.round(raw.duration || 0),
          views: raw.view_count,
          likes: raw.like_count,
          retweets: raw.repost_count,
          createdAt: raw.upload_date,
          formats,
        };

        resolve(formats.length > 0 ? data : null);
      } catch {
        resolve(null);
      }
    });

    process.on('error', () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

// 2. Fallback to FixTweet API
async function extractWithFixTweet(tweetId: string): Promise<TweetVideoData | null> {
  try {
    const endpoints = [
      `https://api.fxtwitter.com/i/status/${tweetId}`,
      `https://api.fxtwitter.com/status/${tweetId}`
    ];

    for (const ep of endpoints) {
      const res = await fetch(ep, {
        headers: {
          'User-Agent': 'TwitterVideoDownloader/1.0 (Mozilla/5.0)',
        },
      });

      if (!res.ok) continue;

      const body = await res.json() as {
        code: number;
        tweet?: {
          id: string;
          url: string;
          text: string;
          created_at: string;
          likes?: number;
          retweets?: number;
          views?: number;
          author: {
            name: string;
            screen_name: string;
            avatar_url: string;
            verification?: { verified?: boolean };
          };
          media?: {
            videos?: Array<{
              url: string;
              thumbnail_url?: string;
              duration?: number;
              variants?: Array<{
                url: string;
                content_type?: string;
                bitrate?: number;
              }>;
            }>;
            all?: Array<{
              type: string;
              url: string;
              thumbnail_url?: string;
              variants?: Array<{
                url: string;
                content_type?: string;
                bitrate?: number;
              }>;
            }>;
          };
        };
      };

      if (!body.tweet) continue;
      const tweet = body.tweet;

      const videoList = tweet.media?.videos || [];
      if (videoList.length === 0 && tweet.media?.all) {
        for (const item of tweet.media.all) {
          if (item.type === 'video' || item.type === 'gif') {
            videoList.push(item);
          }
        }
      }

      if (videoList.length === 0) continue;

      const video = videoList[0];
      const formats: VideoFormat[] = [];

      if (Array.isArray(video.variants) && video.variants.length > 0) {
        const mp4Variants = video.variants.filter(v => v.url && (!v.content_type || v.content_type.includes('mp4')));

        for (const v of mp4Variants) {
          const matchRes = v.url.match(/\/(\d+)x(\d+)\//);
          const height = matchRes ? parseInt(matchRes[2]) : (v.bitrate ? Math.round(v.bitrate / 2500) : 720);
          const quality = height >= 1080 ? 'Full HD (1080p)'
            : height >= 720 ? 'HD (720p)'
            : height >= 480 ? 'SD (480p)'
            : `SD (${height}p)`;

          formats.push({
            id: `mp4-${height}-${v.bitrate || 0}`,
            quality,
            resolution: `${height}p`,
            ext: 'mp4',
            url: v.url,
            hasAudio: true,
            hasVideo: true,
            bitrate: v.bitrate,
          });
        }
      } else if (video.url) {
        formats.push({
          id: 'mp4-best',
          quality: 'HD (720p)',
          resolution: '720p',
          ext: 'mp4',
          url: video.url,
          hasAudio: true,
          hasVideo: true,
        });
      }

      if (formats.length > 0) {
        formats.sort((a, b) => {
          const numA = parseInt(a.resolution) || 0;
          const numB = parseInt(b.resolution) || 0;
          if (numA !== numB) return numB - numA;
          return (b.bitrate || 0) - (a.bitrate || 0);
        });

        formats.push({
          id: 'audio-only',
          quality: 'Solo Audio (MP3)',
          resolution: 'Audio',
          ext: 'mp3',
          url: formats[0].url,
          hasAudio: true,
          hasVideo: false,
        });

        return {
          id: tweet.id,
          url: tweet.url || `https://x.com/i/status/${tweet.id}`,
          text: tweet.text,
          author: {
            name: tweet.author.name,
            screenName: `@${tweet.author.screen_name}`,
            avatar: tweet.author.avatar_url,
            verified: Boolean(tweet.author.verification?.verified),
          },
          thumbnail: video.thumbnail_url || `https://pbs.twimg.com/media/${tweetId}.jpg`,
          duration: Math.round(video.duration || 0),
          likes: tweet.likes,
          retweets: tweet.retweets,
          views: tweet.views,
          createdAt: tweet.created_at,
          formats,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// 3. Fallback demo mock for testing when users click sample buttons or in offline sandbox
export const SAMPLE_TWEETS: Record<string, TweetVideoData> = {
  'demo-space': {
    id: 'demo-space',
    url: 'https://x.com/NASA/status/1785000000000000001',
    text: '🚀 Espectacular despegue nocturno rumbo a la Estación Espacial Internacional. El horizonte brilla con la propulsión en alta definición. #SpaceX #NASA',
    author: {
      name: 'NASA Oficial',
      screenName: '@NASA',
      avatar: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=150&auto=format&fit=crop&q=80',
      verified: true,
    },
    thumbnail: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=1200&auto=format&fit=crop&q=80',
    duration: 38,
    views: 482900,
    likes: 38200,
    retweets: 9420,
    createdAt: '2026-04-12T18:22:00Z',
    formats: [
      {
        id: '1080p',
        quality: 'Full HD (1080p)',
        resolution: '1080p',
        ext: 'mp4',
        filesize: 18450000,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        hasAudio: true,
        hasVideo: true,
        bitrate: 4500,
      },
      {
        id: '720p',
        quality: 'HD (720p)',
        resolution: '720p',
        ext: 'mp4',
        filesize: 9800000,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        hasAudio: true,
        hasVideo: true,
        bitrate: 2200,
      },
      {
        id: '480p',
        quality: 'SD (480p)',
        resolution: '480p',
        ext: 'mp4',
        filesize: 4500000,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        hasAudio: true,
        hasVideo: true,
        bitrate: 1100,
      },
      {
        id: 'audio',
        quality: 'Solo Audio (MP3)',
        resolution: 'Audio',
        ext: 'mp3',
        filesize: 1200000,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        hasAudio: true,
        hasVideo: false,
      },
    ],
  },
  'demo-nature': {
    id: 'demo-nature',
    url: 'https://x.com/NatGeo/status/1785000000000000002',
    text: '🌿 La majestuosidad de la naturaleza en su estado más puro. Filmado con cámaras de alta velocidad en los Alpes suizos.',
    author: {
      name: 'National Geographic',
      screenName: '@NatGeo',
      avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80',
      verified: true,
    },
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    duration: 25,
    views: 923400,
    likes: 74100,
    retweets: 16800,
    createdAt: '2026-05-18T10:15:00Z',
    formats: [
      {
        id: '1080p',
        quality: 'Full HD (1080p)',
        resolution: '1080p',
        ext: 'mp4',
        filesize: 14200000,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        hasAudio: true,
        hasVideo: true,
        bitrate: 4200,
      },
      {
        id: '720p',
        quality: 'HD (720p)',
        resolution: '720p',
        ext: 'mp4',
        filesize: 7800000,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        hasAudio: true,
        hasVideo: true,
        bitrate: 2100,
      },
      {
        id: 'audio',
        quality: 'Solo Audio (MP3)',
        resolution: 'Audio',
        ext: 'mp3',
        filesize: 950000,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        hasAudio: true,
        hasVideo: false,
      },
    ],
  },
  'demo-tech': {
    id: 'demo-tech',
    url: 'https://x.com/TechInsider/status/1785000000000000003',
    text: '⚡ El futuro de la robótica y la inteligencia artificial: así es como los nuevos humanoides aprenden a navegar terrenos complejos.',
    author: {
      name: 'Tech Insider',
      screenName: '@TechInsider',
      avatar: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80',
      verified: true,
    },
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
    duration: 45,
    views: 310500,
    likes: 22100,
    retweets: 4500,
    createdAt: '2026-06-02T14:40:00Z',
    formats: [
      {
        id: '1080p',
        quality: 'Full HD (1080p)',
        resolution: '1080p',
        ext: 'mp4',
        filesize: 21000000,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        hasAudio: true,
        hasVideo: true,
        bitrate: 4800,
      },
      {
        id: '720p',
        quality: 'HD (720p)',
        resolution: '720p',
        ext: 'mp4',
        filesize: 11200000,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        hasAudio: true,
        hasVideo: true,
        bitrate: 2300,
      },
      {
        id: 'audio',
        quality: 'Solo Audio (MP3)',
        resolution: 'Audio',
        ext: 'mp3',
        filesize: 1400000,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        hasAudio: true,
        hasVideo: false,
      },
    ],
  },
};

export async function extractVideo(inputUrl: string): Promise<TweetVideoData> {
  const trimmed = inputUrl.trim();

  // Check demo IDs first
  if (SAMPLE_TWEETS[trimmed]) {
    return SAMPLE_TWEETS[trimmed];
  }
  for (const [key, demo] of Object.entries(SAMPLE_TWEETS)) {
    if (demo.url === trimmed || trimmed.includes(key)) {
      return demo;
    }
  }

  const tweetId = extractTweetId(trimmed);
  if (!tweetId) {
    throw new Error('URL de Twitter / X no válida. Asegúrate de ingresar un enlace como https://x.com/usuario/status/123456');
  }

  // 1. Attempt with yt-dlp
  const normalizedUrl = `https://x.com/i/status/${tweetId}`;
  const ytResult = await extractWithYtDlp(normalizedUrl);
  if (ytResult && ytResult.formats.length > 0) {
    return ytResult;
  }

  // 2. Fallback to FixTweet
  const fixTweetResult = await extractWithFixTweet(tweetId);
  if (fixTweetResult && fixTweetResult.formats.length > 0) {
    return fixTweetResult;
  }

  // If live tweet extraction couldn't find a video
  throw new Error('No se pudo encontrar ningún video en este tweet. Verifica que el tweet contenga un video o GIF público.');
}
