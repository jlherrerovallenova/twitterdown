import React, { useState, useRef } from 'react';
import { X, Scissors, Play, Film, Image as ImageIcon, Loader2, Clock } from 'lucide-react';
import { TweetVideoData } from '../types';

interface TrimmerModalProps {
  videoData: TweetVideoData | null;
  onClose: () => void;
}

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 10);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
}

export const TrimmerModal: React.FC<TrimmerModalProps> = ({ videoData, onClose }) => {
  if (!videoData) return null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const bestVideoUrl = videoData.formats.find((f) => f.hasVideo && f.url)?.url || videoData.url;
  const maxDuration = Math.max(videoData.duration || 10, 1);

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(() => Math.min(videoData.duration || 5, 5));
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

  const handleExport = (format: 'mp4' | 'gif') => {
    if (isProcessing) return;
    setIsProcessing(true);
    setProcessType(format);

    const safeTitle = (videoData.author.name || 'clip')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);
    const filename = `[Clip]_${safeTitle}_${Math.round(startTime)}s-${Math.round(endTime)}s.${format}`;

    const url = `/api/trim?url=${encodeURIComponent(bestVideoUrl)}&start=${startTime}&end=${endTime}&format=${format}&filename=${encodeURIComponent(filename)}`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsProcessing(false);
      setProcessType(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Recortador de Video & Creador GIF</h3>
              <p className="text-xs text-slate-500">Selecciona el inicio y final para exportar un fragmento</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Video Preview */}
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-md">
            <video
              ref={videoRef}
              src={bestVideoUrl}
              controls
              className="w-full h-full object-contain"
              poster={videoData.thumbnail}
            />
          </div>

          {/* Timeline Range Controls */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-700">Duración del fragmento:</span>
                <span className="text-xs font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">
                  {clipDuration.toFixed(1)} segundos
                </span>
              </div>

              <button
                type="button"
                onClick={handlePreviewSelection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Previsualizar Recorte</span>
              </button>
            </div>

            {/* Sliders */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Punto de Inicio:</span>
                  <span className="font-mono font-bold text-slate-700">{formatSeconds(startTime)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxDuration}
                  step="0.1"
                  value={startTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setStartTime(val);
                    if (val >= endTime) setEndTime(Math.min(val + 1, maxDuration));
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Punto Final:</span>
                  <span className="font-mono font-bold text-slate-700">{formatSeconds(endTime)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxDuration}
                  step="0.1"
                  value={endTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setEndTime(val);
                    if (val <= startTime) setStartTime(Math.max(val - 1, 0));
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleExport('mp4')}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-purple-500/20 transition disabled:opacity-50"
            >
              {isProcessing && processType === 'mp4' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando MP4...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>Exportar Clip MP4 ({clipDuration.toFixed(1)}s)</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleExport('gif')}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white font-bold text-sm shadow-md transition disabled:opacity-50"
            >
              {isProcessing && processType === 'gif' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando GIF animado...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                  <span>Convertir a GIF Animado</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
