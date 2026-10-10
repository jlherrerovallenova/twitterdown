import React, { useRef, useState, useEffect } from 'react';
import { Film, Music, Image as ImageIcon, AlertTriangle, RefreshCw } from 'lucide-react';
import { VideoFormat } from '../types';
import { VideoTrimmer } from './VideoTrimmer';

interface VideoPlayerPreviewProps {
  selectedFormat?: VideoFormat;
  thumbnail: string;
  duration: number;
  title: string;
  onDownloadThumbnail: () => void;
}

export const VideoPlayerPreview: React.FC<VideoPlayerPreviewProps> = ({
  selectedFormat,
  thumbnail,
  duration,
  title,
  onDownloadThumbnail,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [useProxy, setUseProxy] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset error states when format changes
  useEffect(() => {
    setUseProxy(false);
    setHasError(false);
  }, [selectedFormat?.url]);

  const directUrl = selectedFormat?.url || '';
  const proxyUrl = directUrl ? `/api/download?url=${encodeURIComponent(directUrl)}` : '';
  const activeVideoSrc = useProxy ? proxyUrl : directUrl;

  const handleVideoError = () => {
    if (!useProxy && directUrl) {
      // Automatically attempt playback via the streaming proxy
      console.warn('Direct stream blocked by CORS/CDN policy. Switching to streaming proxy...');
      setUseProxy(true);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
            Vista previa del video
          </span>
          <button
            type="button"
            onClick={onDownloadThumbnail}
            aria-label="Descargar imagen de portada o miniatura del video"
            className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 hover:underline cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
            Descargar miniatura
          </button>
        </div>

        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-md border border-slate-200">
          {selectedFormat?.hasVideo ? (
            hasError ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white relative">
                {thumbnail && (
                  <img
                    src={thumbnail}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xs"
                  />
                )}
                <div className="relative z-10 space-y-2 max-w-sm">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-200">
                    Previsualización con reproductor seguro
                  </p>
                  <p className="text-[11px] text-slate-400">
                    El video se descargará directamente en tu dispositivo sin restricciones.
                  </p>
                  <button
                    onClick={() => {
                      setHasError(false);
                      setUseProxy(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reintentar reproductor</span>
                  </button>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                key={activeVideoSrc}
                src={activeVideoSrc}
                poster={thumbnail}
                controls
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
                onError={handleVideoError}
                className="w-full h-full object-contain"
              >
                Tu navegador no soporta la reproducción de video HTML5.
              </video>
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-800 to-slate-950 text-white">
              <Music className="w-12 h-12 text-sky-400 mb-2" aria-hidden="true" />
              <p className="font-bold text-sm">Pista de solo audio</p>
              <p className="text-xs text-slate-400 mt-1">Listo para descargar en formato MP3/M4A</p>
              <audio
                src={activeVideoSrc}
                controls
                crossOrigin="anonymous"
                className="mt-4 w-full max-w-xs"
              />
            </div>
          )}
        </div>

        {selectedFormat?.hasVideo && !hasError && (
          <VideoTrimmer
            videoUrl={activeVideoSrc}
            duration={duration}
            title={title}
            videoRef={videoRef}
          />
        )}
      </div>

      <p className="text-[11px] text-slate-400 mt-2 text-center">
        El reproductor utiliza la resolución activa para previsualización inmediata.
      </p>
    </div>
  );
};
