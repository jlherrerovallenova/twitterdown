import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { UrlInputForm } from './components/UrlInputForm';
import { VideoCard } from './components/VideoCard';
import { DownloadHistory } from './components/DownloadHistory';
import { Footer } from './components/Footer';
import { TweetVideoData, VideoFormat, HistoryItem } from './types';

export const App: React.FC = () => {
  const [videoData, setVideoData] = useState<TweetVideoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('twitter_dl_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync history to localStorage in an effect to keep state updaters pure
  useEffect(() => {
    try {
      localStorage.setItem('twitter_dl_history', JSON.stringify(history));
    } catch {
      // Storage quota or disabled in private browsing
    }
  }, [history]);

  const handleSearch = useCallback(async (url: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No se pudo obtener el video del tweet especificado.');
      }

      setVideoData(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el enlace de Twitter / X.';
      setErrorMessage(msg);
      setVideoData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const handleDownloadCompleted = useCallback((format: VideoFormat) => {
    if (!videoData) return;

    const newItem: HistoryItem = {
      id: `${videoData.id}-${Date.now()}`,
      tweetId: videoData.id,
      title: videoData.text.slice(0, 70) || videoData.author.name,
      authorName: videoData.author.name,
      screenName: videoData.author.screenName,
      thumbnail: videoData.thumbnail,
      timestamp: Date.now(),
      quality: format.quality,
      downloadUrl: format.url,
    };

    setHistory((prev) => [newItem, ...prev.slice(0, 19)]);
  }, [videoData]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const handleDeleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Header />

      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <div className="pt-10 sm:pt-16 pb-8 px-4 text-center max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none">
            Descargar Videos de <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 bg-clip-text text-transparent">
              Twitter y X
            </span>
          </h1>

          <div className="mt-8">
            <UrlInputForm
              onSearch={handleSearch}
              isLoading={isLoading}
              errorMessage={errorMessage}
              onClearError={handleClearError}
            />
          </div>
        </div>

        {/* Video Card Result */}
        {videoData && (
          <div className="px-4">
            <VideoCard
              data={videoData}
              onDownloadCompleted={handleDownloadCompleted}
            />
          </div>
        )}

        {/* Download History */}
        <div className="px-4">
          <DownloadHistory
            items={history}
            onClearHistory={handleClearHistory}
            onDeleteItem={handleDeleteHistoryItem}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
