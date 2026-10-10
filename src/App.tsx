import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SearchHero } from './components/SearchHero';
import { SearchFilterBar } from './components/SearchFilterBar';
import { SearchResultCard } from './components/SearchResultCard';
import { VideoModalPlayer } from './components/VideoModalPlayer';
import { TrimmerModal } from './components/TrimmerModal';
import { FavoritesView } from './components/FavoritesView';
import { Pagination } from './components/Pagination';
import { NewVersionPopup } from './components/NewVersionPopup';
import { SmartClipboardBanner } from './components/SmartClipboardBanner';
import { UrlInputForm } from './components/UrlInputForm';
import { VideoCard } from './components/VideoCard';
import { DownloadHistory } from './components/DownloadHistory';
import { Footer } from './components/Footer';
import {
  TweetVideoData,
  VideoFormat,
  HistoryItem,
  SearchResultItem,
  SearchFilters,
  FavoriteVideo,
} from './types';
import { Search, AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'search' | 'downloader' | 'favorites'>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('trending viral nsfw 18 clips x');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<SearchFilters>({
    query: 'trending viral nsfw 18 clips x',
    platform: 'twitter',
    duration: 'all',
    sortBy: 'relevance',
    nsfw: true,
  });

  // Modal Player & Trimmer state
  const [activePlayingVideo, setActivePlayingVideo] = useState<SearchResultItem | null>(null);
  const [activeTrimmerData, setActiveTrimmerData] = useState<TweetVideoData | null>(null);

  // URL Downloader tab state
  const [urlVideoData, setUrlVideoData] = useState<TweetVideoData | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [urlErrorMessage, setUrlErrorMessage] = useState<string | null>(null);

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState<FavoriteVideo[]>(() => {
    try {
      const saved = localStorage.getItem('omni_video_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Download history state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('twitter_dl_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('omni_video_favorites', JSON.stringify(favorites));
    } catch {
      // Ignore
    }
  }, [favorites]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('twitter_dl_history', JSON.stringify(history));
    } catch {
      // Ignore
    }
  }, [history]);

  // Execute video search
  const performSearch = useCallback(
    async (query: string, currentFilters = filters, page = 1, append = false) => {
      if (!query.trim()) return;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsSearching(true);
        setSearchError(null);
      }
      setSearchQuery(query);
      setCurrentPage(page);

      try {
        const params = new URLSearchParams({
          q: query.trim(),
          platform: currentFilters.platform,
          duration: currentFilters.duration,
          sortBy: currentFilters.sortBy,
          nsfw: currentFilters.nsfw || currentFilters.platform === 'nsfw' ? 'true' : 'false',
          page: page.toString(),
          limit: '24',
        });

        const res = await fetch(`/api/search?${params.toString()}`);
        let data: any;
        try {
          const text = await res.text();
          data = JSON.parse(text);
        } catch {
          throw new Error(`Error en la respuesta del servidor (${res.status})`);
        }

        if (!res.ok || !data.success) {
          throw new Error(data?.error || 'Error al buscar videos.');
        }

        const newResults = Array.isArray(data.results) ? data.results : [];
        if (append) {
          setSearchResults((prev) => [...prev, ...newResults]);
        } else {
          setSearchResults(newResults);
        }

        setHasMore(data.hasMore !== undefined ? Boolean(data.hasMore) : newResults.length >= 8);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'No se pudo conectar con el servidor de búsqueda.';
        setSearchError(msg);
        if (!append) setSearchResults([]);
      } finally {
        setIsSearching(false);
        setIsLoadingMore(false);
      }
    },
    [filters]
  );

  // Initial search on mount
  useEffect(() => {
    performSearch('trending viral nsfw 18 clips x');
  }, []);

  const handleFilterChange = (updated: Partial<SearchFilters>) => {
    const nextFilters = { ...filters, ...updated, nsfw: true };
    setFilters(nextFilters);
    performSearch(searchQuery, nextFilters, 1, false);
  };

  const handleResetFilters = () => {
    const defaultFilters: SearchFilters = {
      query: searchQuery,
      platform: 'twitter',
      duration: 'all',
      sortBy: 'relevance',
      nsfw: true,
    };
    setFilters(defaultFilters);
    performSearch(searchQuery, defaultFilters, 1, false);
  };

  const handleLoadMore = () => {
    performSearch(searchQuery, filters, currentPage + 1, true);
  };

  const handleSelectPage = (page: number) => {
    performSearch(searchQuery, filters, page, false);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Toggle favorite
  const handleToggleFavorite = useCallback((item: SearchResultItem) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      if (exists) {
        return prev.filter((f) => f.id !== item.id);
      } else {
        const newFav: FavoriteVideo = {
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail,
          durationFormatted: item.durationFormatted,
          duration: item.duration,
          uploader: item.uploader,
          url: item.url,
          platform: item.platform,
          savedAt: Date.now(),
          tags: item.tags,
        };
        return [newFav, ...prev];
      }
    });
  }, []);

  const handleRemoveFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleClearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  // Quick download helper for Search results
  const handleQuickDownload = useCallback(async (item: SearchResultItem) => {
    setActivePlayingVideo(item);
  }, []);

  // Open trimmer directly for a search result
  const handleOpenTrimmerForResult = useCallback(async (item: SearchResultItem) => {
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.url }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setActiveTrimmerData(json.data);
      } else {
        setActivePlayingVideo(item);
      }
    } catch {
      setActivePlayingVideo(item);
    }
  }, []);

  // URL extraction handler (Tab 2)
  const handleUrlExtract = useCallback(async (url: string) => {
    setIsUrlLoading(true);
    setUrlErrorMessage(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMsg = `Error del servidor (${res.status})`;
        try {
          const errJson = JSON.parse(errorText);
          if (errJson.error) errorMsg = errJson.error;
        } catch {
          if (errorText) errorMsg = errorText.slice(0, 150);
        }
        throw new Error(errorMsg);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'No se pudo obtener el video.');
      }

      setUrlVideoData(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el enlace de video.';
      setUrlErrorMessage(msg);
      setUrlVideoData(null);
    } finally {
      setIsUrlLoading(false);
    }
  }, []);

  const handleDownloadCompleted = useCallback((format: VideoFormat) => {
    if (!urlVideoData) return;

    const newItem: HistoryItem = {
      id: `${urlVideoData.id}-${Date.now()}`,
      tweetId: urlVideoData.id,
      title: urlVideoData.text.slice(0, 70) || urlVideoData.author.name,
      authorName: urlVideoData.author.name,
      screenName: urlVideoData.author.screenName,
      thumbnail: urlVideoData.thumbnail,
      timestamp: Date.now(),
      quality: format.quality,
      downloadUrl: format.url,
    };

    setHistory((prev) => [newItem, ...prev.slice(0, 19)]);
  }, [urlVideoData]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      <Header
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        favoritesCount={favorites.length}
      />

      <main className="flex-1 pb-16">
        {/* ================= TAB 1: BUSCADOR PRO DE VIDEOS ================= */}
        {activeTab === 'search' && (
          <div className="w-full">
            {/* Clipboard Banner for 1-click paste on search page */}
            <div className="pt-4">
              <SmartClipboardBanner
                onSelectUrl={(url) => {
                  setActiveTab('downloader');
                  handleUrlExtract(url);
                }}
                currentUrl={urlVideoData?.url}
              />
            </div>

            {/* Search Hero Area */}
            <SearchHero
              onSearch={(q, isNsfw) => {
                const isTwitterUrl =
                  /(?:twitter\.com|x\.com)\/(?:[a-zA-Z0-9_]+)\/status/i.test(q) ||
                  /(?:twitter\.com|x\.com)\/i\/status/i.test(q);

                if (isTwitterUrl) {
                  setActiveTab('downloader');
                  handleUrlExtract(q);
                  return;
                }

                if (isNsfw !== undefined) {
                  const nextFilters = {
                    ...filters,
                    nsfw: isNsfw,
                    platform: isNsfw ? 'nsfw' : filters.platform === 'nsfw' ? 'all' : filters.platform,
                  };
                  setFilters(nextFilters);
                  performSearch(q, nextFilters);
                } else {
                  performSearch(q);
                }
              }}
              currentQuery={searchQuery}
              isLoading={isSearching}
              isNsfw={filters.nsfw}
            />

            {/* Results & Filters Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              {/* Filter Bar */}
              <SearchFilterBar
                filters={filters}
                onChangeFilters={handleFilterChange}
                totalResults={searchResults.length}
                viewMode={viewMode}
                onChangeViewMode={setViewMode}
                onResetFilters={handleResetFilters}
              />

              {/* Error Alert */}
              {searchError && (
                <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{searchError}</span>
                  </div>
                  <button
                    onClick={() => performSearch(searchQuery)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reintentar</span>
                  </button>
                </div>
              )}

              {/* Loading Skeletons */}
              {isSearching ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-4 space-y-3 animate-pulse"
                    >
                      <div className="aspect-video bg-slate-200 rounded-xl" />
                      <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                      <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                      <div className="flex gap-2 pt-2">
                        <div className="h-7 bg-slate-200 rounded-lg flex-1" />
                        <div className="h-7 bg-slate-200 rounded-lg w-10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                /* Empty Results State */
                <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No se encontraron videos</h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                    Intenta buscar con otras palabras clave, etiquetas generales como #AI, #Gaming, o quita los filtros activos.
                  </p>
                  <button
                    onClick={() => performSearch('trending viral')}
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition"
                  >
                    Ver Videos Virales de Tendencia
                  </button>
                </div>
              ) : (
                /* Video Results List / Grid */
                <>
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
                        : 'flex flex-col gap-4'
                    }
                  >
                    {searchResults.map((item) => (
                      <SearchResultCard
                        key={item.id}
                        item={item}
                        viewMode={viewMode}
                        onPlay={setActivePlayingVideo}
                        onDownload={handleQuickDownload}
                        onTrim={handleOpenTrimmerForResult}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorite={favorites.some((f) => f.id === item.id)}
                        onSelectTag={(tag) => performSearch(tag)}
                      />
                    ))}
                  </div>

                  {/* Pagination & Load More Controls */}
                  <Pagination
                    currentPage={currentPage}
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={handleLoadMore}
                    onSelectPage={handleSelectPage}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: DESCARGADOR POR URL ================= */}
        {activeTab === 'downloader' && (
          <div className="pt-8 sm:pt-12 pb-8 px-4 text-center max-w-4xl mx-auto">
            <SmartClipboardBanner onSelectUrl={handleUrlExtract} currentUrl={urlVideoData?.url} />

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Descargar por Enlace Directo <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Twitter, X & Plataformas
              </span>
            </h1>

            <div className="mt-8">
              <UrlInputForm
                onSearch={handleUrlExtract}
                isLoading={isUrlLoading}
                errorMessage={urlErrorMessage}
                onClearError={() => setUrlErrorMessage(null)}
              />
            </div>

            {/* Video Card Result */}
            {urlVideoData && (
              <div className="mt-8 text-left">
                <VideoCard
                  data={urlVideoData}
                  onDownloadCompleted={handleDownloadCompleted}
                />
              </div>
            )}

            {/* Download History */}
            <div className="mt-12 text-left">
              <DownloadHistory
                items={history}
                onClearHistory={() => setHistory([])}
                onDeleteItem={(id) => setHistory((prev) => prev.filter((item) => item.id !== id))}
              />
            </div>
          </div>
        )}

        {/* ================= TAB 3: FAVORITOS GUARDADOS ================= */}
        {activeTab === 'favorites' && (
          <FavoritesView
            favorites={favorites}
            onRemoveFavorite={handleRemoveFavorite}
            onClearAll={handleClearFavorites}
            onPlay={setActivePlayingVideo}
            onDownload={handleQuickDownload}
          />
        )}
      </main>

      {/* ================= MODAL VIDEO PLAYER ================= */}
      {activePlayingVideo && (
        <VideoModalPlayer
          item={activePlayingVideo}
          onClose={() => setActivePlayingVideo(null)}
          onOpenTrimmer={(videoData) => setActiveTrimmerData(videoData)}
        />
      )}

      {/* ================= MODAL VIDEO TRIMMER ================= */}
      {activeTrimmerData && (
        <TrimmerModal
          videoData={activeTrimmerData}
          onClose={() => setActiveTrimmerData(null)}
        />
      )}

      {/* ================= NEW VERSION NOTIFICATION POPUP ================= */}
      <NewVersionPopup />

      <Footer />
    </div>
  );
};

export default App;
