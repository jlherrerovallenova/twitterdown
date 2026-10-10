import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Scissors,
  Share2,
  Check,
  Eye,
  Clock,
  ExternalLink,
  Music,
  Film,
} from 'lucide-react';
import { SearchResultItem, TweetVideoData } from '../types';

interface VideoModalPlayerProps {
  item: SearchResultItem | null;
  onClose: () => void;
  onOpenTrimmer: (videoData: TweetVideoData) => void;
}

export const VideoModalPlayer: React.FC<VideoModalPlayerProps> = ({
  item,
  onClose,
  onOpenTrimmer,
}) => {
  const [extractedData, setExtractedData] = useState<TweetVideoData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch extract details when modal opens
  useEffect(() => {
    if (!item) return;

    let isMounted = true;
    setIsLoadingDetails(true);
    setErrorDetails(null);

    fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: item.url }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.success && json.data) {
          setExtractedData(json.data);
        } else {
          setErrorDetails(json.error || 'No se pudieron obtener los enlaces directos de descarga.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorDetails(err.message || 'Error al conectar con el servidor.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [item]);

  if (!item) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  // Helper to extract video embed ID if applicable
  const getEmbedUrl = (url: string, explicitEmbed?: string) => {
    if (explicitEmbed) return explicitEmbed;
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(item.url, item.embedUrl);

  // Best stream video URL if available
  const directMp4Url = extractedData?.formats?.find((f) => f.hasVideo && f.url)?.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-700 text-xs font-bold uppercase">
              {item.platform}
            </span>
            <span className="text-xs font-bold text-slate-500 truncate max-w-xs sm:max-w-md">
              {item.uploader}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Video Player Container */}
          <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg relative flex items-center justify-center">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={item.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : directMp4Url ? (
              <video
                src={directMp4Url}
                controls
                autoPlay
                playsInline
                crossOrigin="anonymous"
                className="w-full h-full object-contain"
                poster={item.thumbnail}
                onError={(e) => {
                  const target = e.target as HTMLVideoElement;
                  if (!target.src.includes('/api/download')) {
                    target.src = `/api/download?url=${encodeURIComponent(directMp4Url)}`;
                  }
                }}
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-950">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xs"
                />
                <div className="relative z-10 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-sky-500 text-white flex items-center justify-center mx-auto shadow-xl">
                    <Film className="w-8 h-8" />
                  </div>
                  <h4 className="text-white font-bold text-base max-w-md">{item.title}</h4>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition"
                  >
                    <span>Abrir en plataforma de origen</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Title & Metadata */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {item.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span className="font-semibold text-slate-700">{item.durationFormatted}</span>
              </div>

              {item.viewsFormatted && (
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-semibold text-slate-700">{item.viewsFormatted} vistas</span>
                </div>
              )}

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 font-semibold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Compartir enlace'}</span>
              </button>

              {extractedData && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTrimmer(extractedData);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold transition"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Recortar clip / Crear GIF</span>
                </button>
              )}
            </div>
          </div>

          {/* Download Formats Section */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">
                  Descargar Video o Audio
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                Alta Velocidad
              </span>
            </div>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8 gap-3 text-slate-500">
                <div className="w-5 h-5 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                <span className="text-sm font-semibold">Obteniendo calidades disponibles (1080p, 720p, MP3)...</span>
              </div>
            ) : extractedData && extractedData.formats.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {extractedData.formats.map((fmt, idx) => {
                  const isAudio = !fmt.hasVideo;
                  const filename = `${item.title.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}.${fmt.ext}`;
                  const downloadUrl = `/api/download?url=${encodeURIComponent(fmt.url)}&filename=${encodeURIComponent(filename)}`;

                  return (
                    <a
                      key={idx}
                      href={downloadUrl}
                      download={filename}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isAudio ? 'bg-pink-50 text-pink-600' : 'bg-sky-50 text-sky-600'
                        }`}>
                          {isAudio ? <Music className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition">
                            {fmt.quality}
                          </div>
                          <div className="text-[11px] text-slate-400 font-semibold uppercase">
                            {fmt.ext} {fmt.resolution !== 'Audio' ? `• ${fmt.resolution}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                        <Download className="w-4 h-4" />
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600 text-center sm:text-left">
                  {errorDetails || 'Descarga disponible a través del reproductor o enlace directo:'}
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition shrink-0"
                >
                  Abrir Video
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
