import React from 'react';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onSelectPage: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onSelectPage,
}) => {
  // Generate visible page numbers around current page
  const pages: number[] = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = startPage + 4;

  for (let p = startPage; p <= endPage; p++) {
    pages.push(p);
  }

  return (
    <div className="w-full mt-10 space-y-6 text-center">
      {/* 1. Main Action: Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-blue-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-500/25 transition disabled:opacity-50 cursor-pointer group"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Cargando más videos...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                <span>Cargar más videos (Página {currentPage + 1})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 2. Secondary Navigation: Specific Page Selector */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2">
        {/* Previous Button */}
        <button
          onClick={() => onSelectPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || isLoadingMore}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-slate-200 hover:border-sky-300 text-slate-600 hover:text-sky-600 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-xs"
          title="Página Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* First page jump if far */}
        {startPage > 1 && (
          <>
            <button
              onClick={() => onSelectPage(1)}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-sky-300 text-slate-700 text-xs font-bold transition shadow-xs"
            >
              1
            </button>
            {startPage > 2 && <span className="text-slate-400 px-1 text-xs">...</span>}
          </>
        )}

        {/* Page Buttons */}
        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => onSelectPage(p)}
              disabled={isLoadingMore}
              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/30 scale-105'
                  : 'bg-white border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-600 shadow-xs'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => onSelectPage(currentPage + 1)}
          disabled={!hasMore || isLoadingMore}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-slate-200 hover:border-sky-300 text-slate-600 hover:text-sky-600 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-xs"
          title="Página Siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
