import React, { useState } from 'react';
import {
  Heart,
  Trash2,
  Play,
  Download,
  Search,
} from 'lucide-react';
import { FavoriteVideo, SearchResultItem } from '../types';

interface FavoritesViewProps {
  favorites: FavoriteVideo[];
  onRemoveFavorite: (id: string) => void;
  onClearAll: () => void;
  onPlay: (item: SearchResultItem) => void;
  onDownload: (item: SearchResultItem) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  onRemoveFavorite,
  onClearAll,
  onPlay,
  onDownload,
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  const filtered = favorites.filter(
    (f) =>
      f.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.uploader.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const convertToSearchResult = (f: FavoriteVideo): SearchResultItem => ({
    id: f.id,
    title: f.title,
    thumbnail: f.thumbnail,
    duration: f.duration,
    durationFormatted: f.durationFormatted,
    uploader: f.uploader,
    platform: f.platform as any,
    url: f.url,
    tags: f.tags || [],
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Mis Videos Favoritos</h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
              {favorites.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Colección privada guardada en tu navegador para ver o descargar cuando quieras.
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search within favorites */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar guardados..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-rose-400"
              />
            </div>

            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition shrink-0"
              title="Borrar todos los favoritos"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {favorites.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No tienes videos guardados aún</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Cuando busques videos, haz clic en el icono del corazón ❤️ en cualquier tarjeta para guardarlo aquí.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-500">
            No se encontraron videos guardados con el término "{searchFilter}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => {
            const searchItem = convertToSearchResult(item);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col group"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => onPlay(searchItem)}
                  className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden group/thumb"
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-bold">
                    {item.durationFormatted}
                  </div>
                </div>

                {/* Body */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-sky-600 truncate block">
                      {item.uploader}
                    </span>
                    <h4
                      onClick={() => onPlay(searchItem)}
                      className="text-xs font-bold text-slate-900 line-clamp-2 mt-1 hover:text-rose-600 transition cursor-pointer"
                      title={item.title}
                    >
                      {item.title}
                    </h4>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-1.5 mt-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onPlay(searchItem)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-700 text-xs font-bold transition"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Ver</span>
                    </button>

                    <button
                      onClick={() => onDownload(searchItem)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-700 text-xs font-bold transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>Bajar</span>
                    </button>

                    <button
                      onClick={() => onRemoveFavorite(item.id)}
                      className="p-1.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
                      title="Eliminar de favoritos"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
