import React from 'react';
import { Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs">
            X
          </div>
          <span className="font-semibold text-slate-700">
            Twitter Video Downloader (Modo Claro)
          </span>
          <span>© {new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            No almacenamos videos en nuestros servidores
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-400">
            Hecho con <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" aria-hidden="true" /> para máxima velocidad
          </span>
        </div>
      </div>
    </footer>
  );
};
