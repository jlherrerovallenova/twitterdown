import React from 'react';
import {
  SlidersHorizontal,
  LayoutGrid,
  List,
  Clock,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { SearchFilters } from '../types';

interface SearchFilterBarProps {
  filters: SearchFilters;
  onChangeFilters: (updated: Partial<SearchFilters>) => void;
  totalResults: number;
  viewMode: 'grid' | 'list';
  onChangeViewMode: (mode: 'grid' | 'list') => void;
  onResetFilters: () => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filters,
  onChangeFilters,
  totalResults,
  viewMode,
  onChangeViewMode,
  onResetFilters,
}) => {
  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm mb-6 transition">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Filter Icon Label */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider pr-2 border-r border-slate-200">
            <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            <span>Filtros</span>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl">
            <button
              onClick={() => onChangeFilters({ platform: 'all' })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                filters.platform === 'all'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas las Fuentes
            </button>
            <button
              onClick={() => onChangeFilters({ platform: 'youtube' })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                filters.platform === 'youtube'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              YouTube
            </button>
            <button
              onClick={() => onChangeFilters({ platform: 'twitter' })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                filters.platform === 'twitter'
                  ? 'bg-white text-sky-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              X / Twitter
            </button>
          </div>

          {/* Duration Filter */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.duration}
              onChange={(e) => onChangeFilters({ duration: e.target.value as SearchFilters['duration'] })}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:border-sky-500 transition cursor-pointer"
            >
              <option value="all">Cualquier duración</option>
              <option value="short">Cortos (&lt; 2 min)</option>
              <option value="medium">Medios (2 - 10 min)</option>
              <option value="long">Largos (&gt; 10 min)</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => onChangeFilters({ sortBy: e.target.value as SearchFilters['sortBy'] })}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:border-sky-500 transition cursor-pointer"
            >
              <option value="relevance">Más Relevante</option>
              <option value="views">Más Vistos / Popular</option>
              <option value="duration_asc">Menor Duración</option>
              <option value="duration_desc">Mayor Duración</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(filters.platform !== 'all' || filters.duration !== 'all' || filters.sortBy !== 'relevance') && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition"
              title="Restablecer filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Right: Results Count & View Mode Toggle */}
        <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <span className="text-xs font-semibold text-slate-500">
            {totalResults > 0 ? (
              <>
                <span className="text-sky-600 font-bold">{totalResults}</span> videos encontrados
              </>
            ) : (
              'Búsqueda lista'
            )}
          </span>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => onChangeViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-white text-sky-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-white text-sky-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
