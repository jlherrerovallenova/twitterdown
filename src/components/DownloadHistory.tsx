import React from 'react';
import { History, Trash2, Download, ExternalLink, Clock } from 'lucide-react';
import { HistoryItem } from '../types';

interface DownloadHistoryProps {
  items: HistoryItem[];
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
}

const dateDisplayFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({
  items,
  onClearHistory,
  onDeleteItem,
}) => {
  if (items.length === 0) return null;

  const formatDate = (timestamp: number) => {
    return dateDisplayFormatter.format(new Date(timestamp));
  };

  const handleReDownload = (item: HistoryItem) => {
    const filename = `[Twitter]_${item.authorName}_${item.tweetId}.mp4`;
    const link = document.createElement('a');
    link.href = `/api/download?url=${encodeURIComponent(item.downloadUrl)}&filename=${encodeURIComponent(filename)}`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section aria-labelledby="history-heading" className="w-full max-w-4xl mx-auto mt-12">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <History className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="history-heading" className="text-base font-bold text-slate-800">
                Historial de descargas recientes
              </h2>
              <p className="text-xs text-slate-400">
                Guardado localmente en tu navegador
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClearHistory}
            aria-label="Borrar todo el historial de descargas"
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 border border-rose-100"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Borrar historial</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="font-medium text-slate-600">{item.screenName}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-0.5">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {formatDate(item.timestamp)}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded text-[11px]">
                      {item.quality}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => handleReDownload(item)}
                  aria-label={`Volver a descargar video de ${item.screenName}`}
                  className="p-2 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition border border-slate-200"
                  title="Volver a descargar"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </button>
                <a
                  href={`https://x.com/i/status/${item.tweetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir tweet ${item.tweetId} en X`}
                  className="p-2 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition border border-slate-200"
                  title="Ver tweet en X"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  aria-label="Eliminar del historial"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Eliminar de la lista"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
