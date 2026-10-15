import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SmartClipboardBanner } from './components/SmartClipboardBanner';
import { UrlInputForm } from './components/UrlInputForm';
import { VideoCard } from './components/VideoCard';
import { DownloadHistory } from './components/DownloadHistory';
import { NewVersionPopup } from './components/NewVersionPopup';
import { Footer } from './components/Footer';
import { TweetVideoData, VideoFormat, HistoryItem } from './types';

export const App: React.FC = () => {
  // URL Downloader state
  const [urlVideoData, setUrlVideoData] = useState<TweetVideoData | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [urlErrorMessage, setUrlErrorMessage] = useState<string | null>(null);

  // Download history state persisted in localStorage
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('twitter_dl_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('twitter_dl_history', JSON.stringify(history));
    } catch {
      // Ignore storage write errors (e.g. quota exceeded or incognito)
    }
  }, [history]);

  // URL extraction handler
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

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const handleDeleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleReset = useCallback(() => {
    setUrlVideoData(null);
    setUrlErrorMessage(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      <Header onReset={handleReset} />

      <main className="flex-1 pb-16">
        <div className="pt-8 sm:pt-12 pb-8 px-4 text-center max-w-4xl mx-auto">
          {/* Smart Clipboard paste detector */}
          <SmartClipboardBanner onSelectUrl={handleUrlExtract} currentUrl={urlVideoData?.url} />

          <header className="space-y-3 mb-8">
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Descargar Videos de <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Twitter & X en HD
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
              Descarga videos, clips y audios en alta resolución (1080p, 720p, MP4 o MP3). Rápido, gratis y sin marcas de agua.
            </p>
          </header>

          <div>
            <UrlInputForm
              onSearch={handleUrlExtract}
              isLoading={isUrlLoading}
              errorMessage={urlErrorMessage}
              onClearError={() => setUrlErrorMessage(null)}
            />
          </div>

          {/* Video Result Card */}
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
              onClearHistory={handleClearHistory}
              onDeleteItem={handleDeleteHistoryItem}
            />
          </div>
        </div>
      </main>

      <NewVersionPopup />
      <Footer />
    </div>
  );
};

export default App;
