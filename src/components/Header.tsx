import { ShieldCheck, Zap, Search, Link2, Heart } from 'lucide-react';

interface HeaderProps {
  activeTab: 'search' | 'downloader' | 'favorites';
  onChangeTab: (tab: 'search' | 'downloader' | 'favorites') => void;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onChangeTab,
  favoritesCount,
}) => {
  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          onClick={() => onChangeTab('search')}
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Search className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-slate-900">
                Omni<span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Video</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200">
                PRO 4K
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
              Buscador Inteligente & Descargador HD
            </p>
          </div>
        </div>

        {/* Navigation Tabs Switcher */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => onChangeTab('search')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'search'
                ? 'bg-white text-sky-600 shadow-sm scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Buscador</span>
          </button>

          <button
            onClick={() => onChangeTab('downloader')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'downloader'
                ? 'bg-white text-sky-600 shadow-sm scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Descargar URL</span>
          </button>

          <button
            onClick={() => onChangeTab('favorites')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'favorites'
                ? 'bg-white text-rose-600 shadow-sm scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">Favoritos</span>
            {favoritesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {favoritesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Feature badges */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Gratis</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
            <Zap className="w-3.5 h-3.5 text-sky-600" />
            <span>Sin Límites</span>
          </div>
        </div>
      </div>
    </header>
  );
};
