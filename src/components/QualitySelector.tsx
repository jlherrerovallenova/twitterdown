import React from 'react';
import { Download, CheckCircle, Copy, Sparkles, Film, Music } from 'lucide-react';
import { VideoFormat } from '../types';

interface QualitySelectorProps {
  formats: VideoFormat[];
  selectedFormatId: string;
  onSelectFormatId: (id: string) => void;
  onDownload: (format: VideoFormat) => void;
  onCopyLink: () => void;
  isCopied: boolean;
  downloadingId: string | null;
}

export const QualitySelector: React.FC<QualitySelectorProps> = ({
  formats,
  selectedFormatId,
  onSelectFormatId,
  onDownload,
  onCopyLink,
  isCopied,
  downloadingId,
}) => {
  const selectedFormat = formats.find((f) => f.id === selectedFormatId) || formats[0];

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            Selecciona la calidad
          </span>
          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            Sin marcas de agua
          </span>
        </div>

        {/* Quality selection buttons */}
        <div className="grid grid-cols-1 gap-2.5">
          {formats.map((format) => {
            const isSelected = format.id === selectedFormatId;
            const isAudio = !format.hasVideo;
            return (
              <button
                key={format.id}
                type="button"
                onClick={() => onSelectFormatId(format.id)}
                aria-pressed={isSelected}
                className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 transition-[border-color,background-color,box-shadow] duration-200 text-left ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/60 shadow-sm ring-1 ring-sky-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isSelected
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isAudio ? <Music className="w-4 h-4" aria-hidden="true" /> : <Film className="w-4 h-4" aria-hidden="true" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {format.quality}
                      </span>
                      <span className="text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {format.ext}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {format.resolution} {format.bitrate ? `• ${Math.round(format.bitrate)} kbps` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {formatFileSize(format.filesize) && (
                    <span className="text-xs font-semibold text-slate-600 block">
                      {formatFileSize(format.filesize)}
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-sky-600' : 'text-slate-400'
                    }`}
                  >
                    {isSelected ? '✓ Seleccionado' : 'Elegir'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-5 space-y-2.5">
        <button
          type="button"
          onClick={() => selectedFormat && onDownload(selectedFormat)}
          disabled={!selectedFormat || downloadingId !== null}
          aria-label={`Descargar archivo ${selectedFormat?.quality}`}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-[background-color,opacity,box-shadow] duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {downloadingId ? (
            <>
              <CheckCircle className="w-5 h-5 animate-pulse" aria-hidden="true" />
              <span>Iniciando descarga...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" aria-hidden="true" />
              <span>Descargar {selectedFormat?.quality}</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopyLink}
            aria-label="Copiar enlace directo de descarga al portapapeles"
            className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-[background-color,color] duration-150 flex items-center justify-center gap-1.5"
          >
            {isCopied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span className="text-emerald-700">¡Enlace copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>Copiar enlace directo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
