import React from 'react';
import { ShieldCheck, Zap, Download } from 'lucide-react';

interface HeaderProps {
  onReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <a
          href="/"
          onClick={(e) => {
            if (onReset) {
              e.preventDefault();
              onReset();
            }
          }}
          className="flex items-center gap-3 select-none shrink-0 group rounded-xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500"
          aria-label="OmniVideo Inicio - Descargador de videos"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-150">
            <Download className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-slate-900">
                Omni<span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Video</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200">
                HD 4K
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
              Descargador de Videos Twitter / X
            </p>
          </div>
        </a>

        {/* Feature badges */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>100% Gratis</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
            <Zap className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
            <span>Sin Límites</span>
          </div>
        </div>
      </div>
    </header>
  );
};
