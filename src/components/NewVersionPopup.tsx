import React, { useState, useEffect } from 'react';
import { Sparkles, X, CheckCircle, RefreshCw } from 'lucide-react';

export const CURRENT_APP_VERSION = '2.6.0';

interface VersionInfo {
  version: string;
  title: string;
  releaseDate: string;
  notes: string[];
}

export const NewVersionPopup: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Check if the user has already acknowledged this version
    const lastSeenVersion = localStorage.getItem('omni_last_seen_version');

    fetch('/api/version')
      .then((res) => res.text())
      .then((text) => {
        try {
          const data: VersionInfo = JSON.parse(text);
          if (data && data.version) {
            setVersionInfo(data);
            if (lastSeenVersion !== data.version) {
              const timer = setTimeout(() => {
                setIsVisible(true);
              }, 1000);
              return () => clearTimeout(timer);
            }
          }
        } catch {
          // Fallback if not json
        }
      })
      .catch(() => {
        // Fallback static version info
        if (lastSeenVersion !== CURRENT_APP_VERSION) {
          setVersionInfo({
            version: CURRENT_APP_VERSION,
            title: 'Buscador Pro de Videos por Palabras Clave y Etiquetas',
            releaseDate: '2026-10-10',
            notes: [
              'Buscador universal de videos por keywords y #hashtags',
              'Nube interactiva de tendencias y categorías rápidas',
              'Filtros por plataforma, duración y ordenación',
              'Reproductor modal integrado con descarga 1080p FHD y MP3',
              'Gestor de favoritos y recortador de clips/GIFs',
            ],
          });
          const timer = setTimeout(() => setIsVisible(true), 1000);
          return () => clearTimeout(timer);
        }
      });
  }, []);

  const handleDismiss = () => {
    if (versionInfo) {
      localStorage.setItem('omni_last_seen_version', versionInfo.version);
    }
    setIsVisible(false);
  };

  const handleReload = () => {
    handleDismiss();
    window.location.reload();
  };

  if (!isVisible || !versionInfo) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border-2 border-sky-500/50 p-5 backdrop-blur-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 shrink-0 animate-bounce">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                  ¡Nueva Versión Disponible!
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-black border border-sky-500/30">
                  v{versionInfo.version}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white leading-tight mt-0.5">
                {versionInfo.title}
              </h4>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            title="Descartar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Change list */}
        <div className="mt-3 text-xs text-slate-300 relative z-10 space-y-1.5">
          <ul className="space-y-1">
            {versionInfo.notes.slice(0, isExpanded ? versionInfo.notes.length : 3).map((note, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span>{note}</span>
              </li>
            ))}
          </ul>

          {versionInfo.notes.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] font-bold text-sky-400 hover:text-sky-300 underline mt-1 cursor-pointer"
            >
              {isExpanded ? 'Ver menos' : `+ Ver ${versionInfo.notes.length - 3} novedades más`}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 relative z-10">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Entendido
          </button>

          <button
            onClick={handleReload}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar Interfaz</span>
          </button>
        </div>
      </div>
    </div>
  );
};
