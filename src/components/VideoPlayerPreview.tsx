import React, { useRef } from 'react';
import { Film, Music, Image as ImageIcon } from 'lucide-react';
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
            className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 hover:underline"
          >
            <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
            Descargar miniatura
          </button>
        </div>

        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-md border border-slate-200">
          {selectedFormat?.hasVideo ? (
            <video
              ref={videoRef}
              key={selectedFormat.url}
              src={selectedFormat.url}
              poster={thumbnail}
              controls
              preload="metadata"
              className="w-full h-full object-contain"
            >
              Tu navegador no soporta la reproducción de video HTML5.
            </video>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-800 to-slate-950 text-white">
              <Music className="w-12 h-12 text-sky-400 mb-2" aria-hidden="true" />
              <p className="font-bold text-sm">Pista de solo audio</p>
              <p className="text-xs text-slate-400 mt-1">Listo para descargar en formato MP3/M4A</p>
              <audio src={selectedFormat?.url} controls className="mt-4 w-full max-w-xs" />
            </div>
          )}
        </div>

        {selectedFormat?.hasVideo && (
          <VideoTrimmer
            videoUrl={selectedFormat.url}
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
