import React, { useState } from 'react';
import { Link2, Clipboard, X, Loader2, AlertCircle } from 'lucide-react';

interface UrlInputFormProps {
  onSearch: (url: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  onClearError: () => void;
}

export const UrlInputForm: React.FC<UrlInputFormProps> = ({
  onSearch,
  isLoading,
  errorMessage,
  onClearError,
}) => {
  const [url, setUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    await onSearch(url.trim());
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          onClearError();
        }
      }
    } catch {
      // Clipboard access denied or unsupported; ignore silently
    }
  };

  const handleClear = () => {
    setUrl('');
    onClearError();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (errorMessage) {
      onClearError();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        <label htmlFor="tweet-url-input" className="sr-only">
          Introduce el enlace del tweet de Twitter o X
        </label>
        <div className="relative flex flex-col sm:flex-row items-center gap-2.5 p-2 bg-white rounded-2xl border-2 border-slate-200 shadow-xl shadow-slate-200/50 hover:border-sky-400 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100 transition-[border-color,box-shadow] duration-200">
          <div className="relative flex-1 w-full flex items-center">
            <div className="pl-3.5 pr-2 text-slate-400 flex items-center pointer-events-none">
              <Link2 className="w-5 h-5 text-slate-400" aria-hidden="true" />
            </div>
            <input
              id="tweet-url-input"
              type="text"
              value={url}
              onChange={handleInputChange}
              placeholder="Pega el enlace del tweet (ej: https://x.com/usuario/status/...)"
              disabled={isLoading}
              className="w-full py-3 pr-20 text-slate-800 placeholder-slate-400 bg-transparent text-sm sm:text-base font-normal focus:outline-hidden disabled:opacity-50"
              autoComplete="off"
              spellCheck="false"
            />
            {url ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Limpiar enlace ingresado"
                className="absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                aria-label="Pegar enlace desde el portapapeles"
                className="absolute right-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors duration-150 flex items-center gap-1.5 border border-slate-200"
              >
                <Clipboard className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Pegar</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            aria-label="Analizar y extraer video del enlace"
            className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-sky-500/25 transition-[background-color,opacity,box-shadow] duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Analizando...</span>
              </>
            ) : (
              <span>Descargar</span>
            )}
          </button>
        </div>
      </form>

      {errorMessage && (
        <div
          role="alert"
          className="mt-3.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">No se pudo procesar el enlace</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={onClearError}
            aria-label="Cerrar mensaje de error"
            className="text-rose-400 hover:text-rose-600 p-1 rounded-md transition-colors duration-150"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};
