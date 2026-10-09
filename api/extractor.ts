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
  const match =
    cleanUrl.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?(?:[a-zA-Z0-9_]+)\/status(?:es)?\/(\d+)/i) ||
    cleanUrl.match(/(?:twitter\.com|x\.com)\/i\/status\/(\d+)/i) ||
    cleanUrl.match(/^(\d{8,25})$/);

  return match ? match[1] : null;
}

function getSyndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
}

interface SyndicationMedia {
  type?: string;
  media_url_https?: string;
  video_info?: {
    duration_millis?: number;
    variants?: Array<{
      url?: string;
      src?: string;
      content_type?: string;
      type?: string;
      bitrate?: number;
    }>;
  };
}

interface SyndicationVariant {
  src?: string;
  url?: string;
  type?: string;
  content_type?: string;
  bitrate?: number;
}

interface SyndicationTweet {
  id_str?: string;
  text?: string;
  favorite_count?: number;
  conversation_count?: number;
  created_at?: string;
  user?: {
    name?: string;
    screen_name?: string;
    profile_image_url_https?: string;
    verified?: boolean;
    is_blue_verified?: boolean;
  };
  video?: {
    poster?: string;
    durationMs?: number;
    durationMillis?: number;
    variants?: SyndicationVariant[];
  };
  mediaDetails?: SyndicationMedia[];
}

async function extractWithSyndication(tweetId: string): Promise<TweetVideoData | null> {
  try {
    const token = getSyndicationToken(tweetId);
    const res = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=${token}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return null;
    const tweet = (await res.json()) as SyndicationTweet;
    if (!tweet) return null;

    // Collect all variants
    const rawVariants: SyndicationVariant[] = [];
    if (tweet.video?.variants) {
      for (const v of tweet.video.variants) {
        rawVariants.push(v);
      }
    }
    if (tweet.mediaDetails) {
      for (const m of tweet.mediaDetails) {
        if (m.video_info?.variants) {
          for (const v of m.video_info.variants) {
            rawVariants.push(v);
          }
        }
      }
    }

    const formats: VideoFormat[] = [];
    const seenUrls = new Set<string>();

    for (const v of rawVariants) {
      const vUrl = v.src || v.url;
      const vType = v.type || v.content_type || '';

      if (vUrl && (!vType || vType.includes('mp4')) && !seenUrls.has(vUrl)) {
        seenUrls.add(vUrl);
        const matchRes = vUrl.match(/\/(\d+)x(\d+)\//);
        const height = matchRes ? parseInt(matchRes[2], 10) : (v.bitrate ? Math.round(v.bitrate / 2500) : 720);
        const quality =
          height >= 1080 ? 'Full HD (1080p)' : height >= 720 ? 'HD (720p)' : height >= 480 ? 'SD (480p)' : `SD (${height}p)`;

        formats.push({
          id: `mp4-${height}-${v.bitrate || 0}`,
          quality,
          resolution: `${height}p`,
          ext: 'mp4',
          url: vUrl,
          hasAudio: true,
          hasVideo: true,
          bitrate: v.bitrate,
        });
      }
    }

    if (formats.length === 0) return null;

    // Sort descending by resolution and bitrate
    formats.sort((a, b) => {
      const numA = parseInt(a.resolution, 10) || 0;
      const numB = parseInt(b.resolution, 10) || 0;
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

    const durationRaw =
      tweet.video?.durationMs ||
      tweet.video?.durationMillis ||
      tweet.mediaDetails?.[0]?.video_info?.duration_millis ||
      0;

    return {
      id: tweet.id_str || tweetId,
      url: `https://x.com/${tweet.user?.screen_name || 'i'}/status/${tweetId}`,
      text: tweet.text || '',
      author: {
        name: tweet.user?.name || 'Twitter User',
        screenName: `@${tweet.user?.screen_name || 'user'}`,
        avatar: tweet.user?.profile_image_url_https || '',
        verified: Boolean(tweet.user?.verified || tweet.user?.is_blue_verified),
      },
      thumbnail: tweet.video?.poster || tweet.mediaDetails?.[0]?.media_url_https || '',
      duration: Math.round(durationRaw / 1000),
      likes: tweet.favorite_count,
      retweets: tweet.conversation_count,
      createdAt: tweet.created_at,
      formats,
    };
  } catch {
    return null;
  }
}

// Fallback to FixTweet API
async function extractWithFixTweet(tweetId: string): Promise<TweetVideoData | null> {
  try {
    const endpoints = [
      `https://api.fxtwitter.com/i/status/${tweetId}`,
      `https://api.fxtwitter.com/status/${tweetId}`,
    ];

    for (const ep of endpoints) {
      const res = await fetch(ep, {
        headers: {
          'User-Agent': 'TwitterVideoDownloader/1.0 (Mozilla/5.0)',
        },
      });

      if (!res.ok) continue;

      const body = (await res.json()) as {
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
        const mp4Variants = video.variants.filter((v) => v.url && (!v.content_type || v.content_type.includes('mp4')));

        for (const v of mp4Variants) {
          const matchRes = v.url.match(/\/(\d+)x(\d+)\//);
          const height = matchRes ? parseInt(matchRes[2], 10) : (v.bitrate ? Math.round(v.bitrate / 2500) : 720);
          const quality =
            height >= 1080 ? 'Full HD (1080p)' : height >= 720 ? 'HD (720p)' : height >= 480 ? 'SD (480p)' : `SD (${height}p)`;

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
          const numA = parseInt(a.resolution, 10) || 0;
          const numB = parseInt(b.resolution, 10) || 0;
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

export async function extractVideo(inputUrl: string): Promise<TweetVideoData> {
  const trimmed = inputUrl.trim();
  const tweetId = extractTweetId(trimmed);

  if (!tweetId) {
    throw new Error('URL de Twitter / X no válida. Asegúrate de ingresar un enlace como https://x.com/usuario/status/123456');
  }

  // 1. Direct Twitter Syndication CDN (fastest, reliable, zero external binary dependency)
  const syndicationResult = await extractWithSyndication(tweetId);
  if (syndicationResult && syndicationResult.formats.length > 0) {
    return syndicationResult;
  }

  // 2. FixTweet API (fallback)
  const fixTweetResult = await extractWithFixTweet(tweetId);
  if (fixTweetResult && fixTweetResult.formats.length > 0) {
    return fixTweetResult;
  }

  throw new Error('No se pudo encontrar ningún video en este tweet. Verifica que el tweet contenga un video o GIF público.');
}
