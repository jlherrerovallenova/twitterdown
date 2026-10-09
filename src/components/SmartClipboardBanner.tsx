import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, ArrowRight, X } from 'lucide-react';

interface SmartClipboardBannerProps {
  onSelectUrl: (url: string) => void;
  currentUrl?: string;
}

export const SmartClipboardBanner: React.FC<SmartClipboardBannerProps> = ({
  onSelectUrl,
  currentUrl,
}) => {
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);

  const checkClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard?.readText) return;
      const text = (await navigator.clipboard.readText()).trim();

      // Check if text is a valid Twitter or X status link
      const isTwitterLink =
        /(?:twitter\.com|x\.com)\/(?:[a-zA-Z0-9_]+)\/status(?:es)?\/\d+/i.test(text) ||
        /(?:twitter\.com|x\.com)\/i\/status\/\d+/i.test(text);

      if (isTwitterLink && text !== currentUrl && text !== dismissedUrl) {
        setDetectedUrl(text);
      }
    } catch {
      // Clipboard permission denied or unavailable
    }
  }, [currentUrl, dismissedUrl]);

  useEffect(() => {
    // Check on window focus and initial mount
    const handleFocus = () => {
      checkClipboard();
    };

    window.addEventListener('focus', handleFocus);
    checkClipboard();

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkClipboard]);

  if (!detectedUrl || detectedUrl === currentUrl || detectedUrl === dismissedUrl) {
    return null;
  }

  const handleApply = () => {
    onSelectUrl(detectedUrl);
    setDetectedUrl(null);
  };

  const handleDismiss = () => {
    setDismissedUrl(detectedUrl);
    setDetectedUrl(null);
  };

  const formatDisplayUrl = (url: string) => {
    try {
      const u = new URL(url);
      return `${u.hostname}${u.pathname}`;
    } catch {
      return url.slice(0, 45);
    }
  };

  return (
    <div
      role="region"
      aria-label="Enlace detectado en el portapapeles"
      className="max-w-2xl mx-auto mb-6 px-4 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/20">
            <ClipboardCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
              <span>Enlace de X detectado en tu portapapeles</span>
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" aria-hidden="true" />
            </p>
            <p className="text-xs text-sky-700 font-mono truncate max-w-xs sm:max-w-md">
              {formatDisplayUrl(detectedUrl)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleApply}
            aria-label="Descargar enlace detectado"
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition-[background-color] duration-150 flex items-center gap-1.5"
          >
            <span>Descargar ahora</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Descartar enlace detectado"
            className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-100 rounded-lg transition-[background-color,color] duration-150"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
