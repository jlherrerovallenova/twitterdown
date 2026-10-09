import React, { useState } from 'react';
import {
  ExternalLink,
  Heart,
  Repeat2,
  Eye,
  Clock
} from 'lucide-react';
import { TweetVideoData, VideoFormat } from '../types';
import { VideoPlayerPreview } from './VideoPlayerPreview';
import { QualitySelector } from './QualitySelector';

interface VideoCardProps {
  data: TweetVideoData;
  onDownloadCompleted: (format: VideoFormat) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ data, onDownloadCompleted }) => {
  const [selectedFormatId, setSelectedFormatId] = useState<string>(
    data.formats[0]?.id || ''
  );
  const [isCopied, setIsCopied] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const selectedFormat = data.formats.find((f) => f.id === selectedFormatId) || data.formats[0];

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return null;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const handleDownload = (format: VideoFormat) => {
    setDownloadingId(format.id);

    const safeTitle = (data.author.name || 'twitter')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);
    const filename = `[Twitter]_${safeTitle}_${data.id}_${format.resolution}.${format.ext}`;
    const downloadEndpoint = `/api/download?url=${encodeURIComponent(format.url)}&filename=${encodeURIComponent(filename)}`;

    // Trigger download via anchor
    const link = document.createElement('a');
    link.href = downloadEndpoint;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onDownloadCompleted(format);

    // Reset button loading state cleanly
    window.setTimeout(() => {
      setDownloadingId(null);
    }, 1500);
  };

  const handleCopyLink = async () => {
    if (!selectedFormat) return;
    try {
      await navigator.clipboard.writeText(selectedFormat.url);
      setIsCopied(true);
      window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  const handleDownloadThumbnail = () => {
    if (!data.thumbnail) return;
    const filename = `[Twitter]_${data.author.screenName}_thumb_${data.id}.jpg`;
    const link = document.createElement('a');
    link.href = `/api/download?url=${encodeURIComponent(data.thumbnail)}&filename=${encodeURIComponent(filename)}`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section aria-labelledby="tweet-result-heading" className="w-full max-w-4xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 overflow-hidden">
        {/* Header bar with author */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <img
              src={data.author.avatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'}
              alt={`Avatar de ${data.author.name}`}
              className="w-12 h-12 rounded-full border border-slate-200 object-cover shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';
              }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 id="tweet-result-heading" className="font-bold text-slate-900 text-base leading-tight">
                  {data.author.name}
                </h2>
                {data.author.verified && (
                  <svg className="w-4 h-4 text-sky-500 fill-current" viewBox="0 0 24 24" aria-label="Cuenta verificada">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {data.author.screenName}
              </p>
            </div>
          </div>

          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir tweet original en Twitter / X en nueva pestaña"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:text-sky-600 hover:border-sky-200 border border-slate-200 shadow-sm transition-colors duration-150"
          >
            <span>Ver en X / Twitter</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>

        {/* Tweet content & metrics */}
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed break-words whitespace-pre-wrap">
            {data.text}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
            {data.duration > 0 && (
              <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>{data.duration}s</span>
              </span>
            )}
            {formatNumber(data.views) && (
              <span className="flex items-center gap-1 text-slate-600">
                <Eye className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>{formatNumber(data.views)} vistas</span>
              </span>
            )}
            {formatNumber(data.likes) && (
              <span className="flex items-center gap-1 text-slate-600">
                <Heart className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                <span>{formatNumber(data.likes)} me gusta</span>
              </span>
            )}
            {formatNumber(data.retweets) && (
              <span className="flex items-center gap-1 text-slate-600">
                <Repeat2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                <span>{formatNumber(data.retweets)} reposts</span>
              </span>
            )}
          </div>
        </div>

        {/* Video Player Preview and Quality Options */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/30">
          <div className="lg:col-span-6">
            <VideoPlayerPreview
              selectedFormat={selectedFormat}
              thumbnail={data.thumbnail}
              onDownloadThumbnail={handleDownloadThumbnail}
            />
          </div>

          <div className="lg:col-span-6">
            <QualitySelector
              formats={data.formats}
              selectedFormatId={selectedFormatId}
              onSelectFormatId={setSelectedFormatId}
              onDownload={handleDownload}
              onCopyLink={handleCopyLink}
              isCopied={isCopied}
              downloadingId={downloadingId}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
