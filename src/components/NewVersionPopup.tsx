import React, { useState, useEffect } from 'react';
import { Sparkles, X, CheckCircle, RefreshCw } from 'lucide-react';

export const CURRENT_APP_VERSION = '3.0.0';

interface VersionInfo {
  version: string;
  title: string;
  releaseDate: string;
  notes: string[];
}

const DEFAULT_VERSION_INFO: VersionInfo = {
  version: CURRENT_APP_VERSION,
  title: 'Descargador de Videos Ultra Rápido y Optimizado',
  releaseDate: '2026-10-15',
  notes: [
    'Modo exclusivo de descargas de alta velocidad para Twitter / X',
    'Eliminadas dependencias y sobrecarga para una carga instantánea',
    'Extracción optimizada de videos hasta 1080p FHD y pistas de audio MP3',
    'Previsualización fluida y recorte de clips con descarga directa',
  ],
};

export const NewVersionPopup: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    const lastSeenVersion = localStorage.getItem('omni_last_seen_version');

    const checkVersion = async () => {
      try {
        const res = await fetch('/api/version', { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        const data = (await res.json()) as VersionInfo;
        if (isMounted && data && data.version) {
          setVersionInfo(data);
          if (lastSeenVersion !== data.version) {
            timer = setTimeout(() => {
              if (isMounted) setIsVisible(true);
            }, 1000);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        // Fallback to local default version info
        if (isMounted && lastSeenVersion !== CURRENT_APP_VERSION) {
          setVersionInfo(DEFAULT_VERSION_INFO);
          timer = setTimeout(() => {
            if (isMounted) setIsVisible(true);
          }, 1000);
        }
      }
    };

    checkVersion();

    return () => {
      isMounted = false;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
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
    <aside
      aria-label="Aviso de nueva versión"
      className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border-2 border-sky-500/50 p-5 backdrop-blur-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 shrink-0 animate-bounce">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
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
              <h2 className="text-sm sm:text-base font-black text-white leading-tight mt-0.5">
                {versionInfo.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar notificación de actualización"
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-150 shrink-0"
            title="Descartar notificación"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Change list */}
        <div className="mt-3 text-xs text-slate-300 relative z-10 space-y-1.5">
          <ul className="space-y-1">
            {versionInfo.notes.slice(0, isExpanded ? versionInfo.notes.length : 3).map((note) => (
              <li key={note} className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{note}</span>
              </li>
            ))}
          </ul>

          {versionInfo.notes.length > 3 && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className="text-[11px] font-bold text-sky-400 hover:text-sky-300 underline mt-1 cursor-pointer"
            >
              {isExpanded ? 'Ver menos' : `+ Ver ${versionInfo.notes.length - 3} novedades más`}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 relative z-10">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors duration-150"
          >
            Entendido
          </button>

          <button
            type="button"
            onClick={handleReload}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition-[background-color,box-shadow] duration-150"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Actualizar Interfaz</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
