import React, { useState } from 'react';
import { Scissors, Play, Film, Image as ImageIcon, Loader2, ChevronDown } from 'lucide-react';

interface VideoTrimmerProps {
  videoUrl: string;
  duration: number; // in seconds
  title: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 10);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
  videoUrl,
  duration,
  title,
  videoRef,
}) => {
  const maxDuration = Math.max(duration, 1);
  const [isOpen, setIsOpen] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(() => Math.min(duration || 5, 5));
  const [isProcessing, setIsProcessing] = useState(false);
  const [processType, setProcessType] = useState<'mp4' | 'gif' | null>(null);

  const clipDuration = Math.max(0, endTime - startTime);

  const handlePreviewSelection = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = startTime;
    video.play();

    const checkTime = () => {
      if (video.currentTime >= endTime) {
        video.pause();
        video.removeEventListener('timeupdate', checkTime);
      }
    };

    video.addEventListener('timeupdate', checkTime);
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setStartTime(val);
    if (val >= endTime) {
      setEndTime(Math.min(val + 1, maxDuration));
    }
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setEndTime(val);
    if (val <= startTime) {
      setStartTime(Math.max(val - 1, 0));
    }
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleExport = (format: 'mp4' | 'gif') => {
    setIsProcessing(true);
    setProcessType(format);

    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25);
    const filename = `[Twitter]_${safeTitle}_clip_${startTime}s-${endTime}s.${format}`;
    const trimUrl = `/api/trim?url=${encodeURIComponent(videoUrl)}&start=${startTime}&end=${endTime}&format=${format}&filename=${encodeURIComponent(filename)}`;

    // Create anchor trigger
    const link = document.createElement('a');
    link.href = trimUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset processing state
    window.setTimeout(() => {
      setIsProcessing(false);
      setProcessType(null);
    }, 3000);
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="trimmer-panel"
        className="w-full py-2.5 px-3.5 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition-[background-color] duration-150"
      >
        <span className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-sky-600" aria-hidden="true" />
          <span>Herramienta de Recorte y Creación de GIF</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
            Nuevo
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-sky-600' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id="trimmer-panel"
          className="mt-3 p-4 bg-sky-50/50 rounded-2xl border border-sky-100 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {/* Header indicator */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-slate-700">
              Selecciona el rango de tiempo
            </span>
            <span className="font-mono font-bold text-sky-700 bg-white px-2 py-0.5 rounded-md border border-sky-200/80 shadow-2xs">
              {formatSeconds(startTime)} ➔ {formatSeconds(endTime)} ({clipDuration.toFixed(1)}s)
            </span>
          </div>

          {/* Sliders */}
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                <label htmlFor="trim-start-slider">Punto de Inicio:</label>
                <span className="font-mono text-sky-600 font-bold">{formatSeconds(startTime)}</span>
              </div>
              <input
                id="trim-start-slider"
                type="range"
                min="0"
                max={maxDuration}
                step="0.1"
                value={startTime}
                onChange={handleStartChange}
                aria-label="Punto de inicio del recorte en segundos"
                className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                <label htmlFor="trim-end-slider">Punto de Fin:</label>
                <span className="font-mono text-sky-600 font-bold">{formatSeconds(endTime)}</span>
              </div>
              <input
                id="trim-end-slider"
                type="range"
                min="0"
                max={maxDuration}
                step="0.1"
                value={endTime}
                onChange={handleEndChange}
                aria-label="Punto de fin del recorte en segundos"
                className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3.5">
            <button
              type="button"
              onClick={handlePreviewSelection}
              aria-label="Reproducir selección recortada en el reproductor"
              className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-[background-color,border-color] duration-150"
            >
              <Play className="w-3.5 h-3.5 text-sky-600 fill-current" aria-hidden="true" />
              <span>Previsualizar</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('mp4')}
              disabled={isProcessing}
              aria-label="Descargar clip recortado en formato MP4"
              className="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-[background-color,opacity] duration-150 disabled:opacity-60"
            >
              {isProcessing && processType === 'mp4' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Recortando...</span>
                </>
              ) : (
                <>
                  <Film className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Bajar Clip MP4</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleExport('gif')}
              disabled={isProcessing}
              aria-label="Convertir selección a GIF animado y descargar"
              className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-[opacity] duration-150 disabled:opacity-60"
            >
              {isProcessing && processType === 'gif' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Generando GIF...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Crear GIF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
