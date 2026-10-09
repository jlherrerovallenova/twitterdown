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

export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: number; // in seconds
  durationFormatted: string;
  uploader: string;
  uploaderAvatar?: string;
  platform: 'youtube' | 'twitter' | 'tiktok' | 'reddit' | 'nsfw' | 'other';
  views?: number;
  viewsFormatted?: string;
  uploadedAt?: string;
  url: string;
  embedUrl?: string;
  tags: string[];
  isNsfw?: boolean;
}

export interface SearchFilters {
  query: string;
  platform: string;
  duration: 'all' | 'short' | 'medium' | 'long';
  sortBy: 'relevance' | 'views' | 'date' | 'duration_asc' | 'duration_desc';
  nsfw?: boolean;
}

export interface CategoryPreset {
  key: string;
  label: string;
  icon: string;
  query: string;
  tags: string[];
  isNsfw?: boolean;
}

export interface FavoriteVideo {
  id: string;
  title: string;
  thumbnail: string;
  durationFormatted: string;
  duration: number;
  uploader: string;
  url: string;
  platform: string;
  savedAt: number;
  tags?: string[];
  isNsfw?: boolean;
}
