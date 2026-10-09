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

export interface HistoryItem {
  id: string;
  tweetId: string;
  title: string;
  authorName: string;
  screenName: string;
  thumbnail: string;
  timestamp: number;
  quality: string;
  downloadUrl: string;
}
