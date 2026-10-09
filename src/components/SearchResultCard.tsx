import React, { useState } from 'react';
import {
  Play,
  Download,
  Scissors,
  Heart,
  Share2,
  Check,
  Eye,
} from 'lucide-react';
import { SearchResultItem } from '../types';

interface SearchResultCardProps {
  item: SearchResultItem;
  viewMode: 'grid' | 'list';
  onPlay: (item: SearchResultItem) => void;
  onDownload: (item: SearchResultItem) => void;
  onTrim: (item: SearchResultItem) => void;
  onToggleFavorite: (item: SearchResultItem) => void;
  isFavorite: boolean;
  onSelectTag: (tag: string) => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  item,
  viewMode,
  onPlay,
  onDownload,
  onTrim,
  onToggleFavorite,
  isFavorite,
  onSelectTag,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore error
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(item);
  };

  const fallbackThumbnail = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-4 group">
        {/* Thumbnail Box */}
        <div
          onClick={() => onPlay(item)}
          className="relative w-full sm:w-64 h-40 sm:h-36 rounded-xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer group/thumb"
        >
          <img
            src={imgError ? fallbackThumbnail : item.thumbnail}
            alt={item.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-black/40 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-sky-500/90 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-xs font-bold tracking-wider backdrop-blur-xs">
            {item.durationFormatted}
          </div>

          {/* Platform Badge */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold uppercase backdrop-blur-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>{item.platform}</span>
          </div>
        </div>

        {/* Content & Actions */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-sky-600 truncate">
                {item.uploader}
              </span>
              {item.viewsFormatted && (
                <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{item.viewsFormatted} vistas</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h3
              onClick={() => onPlay(item)}
              className="text-base font-bold text-slate-900 line-clamp-2 mt-1 hover:text-sky-600 transition cursor-pointer"
              title={item.title}
            >
              {item.title}
            </h3>

            {/* Description snippet */}
            {item.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                {item.description}
              </p>
            )}

            {/* Tags row */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.slice(0, 4).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onSelectTag(tag)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-600 text-[11px] font-medium transition cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPlay(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs transition"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Ver</span>
              </button>

              <button
                onClick={() => onDownload(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-700 text-xs font-bold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>

              <button
                onClick={() => onTrim(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-500 hover:text-white text-slate-700 text-xs font-bold transition"
                title="Recortar fragmento o hacer GIF"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recortar</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleFavoriteClick}
                className={`p-2 rounded-xl transition ${
                  isFavorite
                    ? 'bg-rose-50 text-rose-500'
                    : 'bg-slate-100 text-slate-500 hover:text-rose-500 hover:bg-rose-50'
                }`}
                title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
              </button>

              <button
                onClick={handleCopyLink}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition"
                title="Copiar enlace"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View (Default)
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Thumbnail Container */}
      <div
        onClick={() => onPlay(item)}
        className="relative w-full aspect-video bg-slate-900 overflow-hidden cursor-pointer group/thumb"
      >
        <img
          src={imgError ? fallbackThumbnail : item.thumbnail}
          alt={item.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Hover Dark Overlay & Center Play Button */}
        <div className="absolute inset-0 bg-black/25 group-hover/thumb:bg-black/45 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-sky-500/90 group-hover/thumb:bg-sky-500 text-white flex items-center justify-center shadow-xl group-hover/thumb:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold uppercase backdrop-blur-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {item.platform}
          </span>

          <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold tracking-wider backdrop-blur-xs shadow-xs">
            HD 1080p
          </span>
        </div>

        {/* Bottom Badges */}
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-black/80 text-white text-xs font-bold tracking-wider backdrop-blur-xs shadow-sm">
          {item.durationFormatted}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Creator & Views */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold text-sky-600 truncate max-w-[65%]">
              {item.uploader}
            </span>
            {item.viewsFormatted && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Eye className="w-3 h-3" />
                <span>{item.viewsFormatted}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => onPlay(item)}
            className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug hover:text-sky-600 transition cursor-pointer"
            title={item.title}
          >
            {item.title}
          </h3>

          {/* Clickable Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {item.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  onClick={() => onSelectTag(tag)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-600 text-[10px] font-medium transition cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Bottom Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-1">
            <button
              onClick={() => onPlay(item)}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-sky-50 hover:bg-sky-500 text-sky-700 hover:text-white font-bold text-xs transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ver</span>
            </button>

            <button
              onClick={() => onDownload(item)}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-emerald-500 text-slate-700 hover:text-white font-bold text-xs transition"
              title="Descargar video"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>

            <button
              onClick={() => onTrim(item)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-purple-500 hover:text-white text-slate-600 transition"
              title="Recortar video o crear GIF"
            >
              <Scissors className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleFavoriteClick}
              className={`p-2 rounded-xl transition ${
                isFavorite
                  ? 'bg-rose-50 text-rose-500'
                  : 'bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
              }`}
              title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
            </button>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
              title="Copiar enlace"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
