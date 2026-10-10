import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Flame,
  Trophy,
  Film,
  Smile,
  X,
  TrendingUp,
  Hash,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { CategoryPreset } from '../types';

interface SearchHeroProps {
  onSearch: (query: string, isNsfw?: boolean) => void;
  currentQuery: string;
  isLoading: boolean;
  isNsfw?: boolean;
}

const CATEGORIES: CategoryPreset[] = [
  { key: 'trending', label: '🔥 Tendencias +18 en X', icon: 'Flame', query: 'viral', tags: ['#NSFW', '#Viral18', '#TwitterAfterDark'], isNsfw: true },
  { key: 'amateur', label: '📹 Amateur & Casero', icon: 'Film', query: 'amateur casero', tags: ['#Amateur', '#Casero', '#Homemade'], isNsfw: true },
  { key: 'onlyfans', label: '💎 OnlyFans & VIPs', icon: 'Sparkles', query: 'onlyfans', tags: ['#OnlyFans', '#VIP', '#Models'], isNsfw: true },
  { key: 'latina', label: '💃 Latinas & España +18', icon: 'Flame', query: 'latina espanol', tags: ['#Latina', '#Espana18', '#Caliente'], isNsfw: true },
  { key: 'cosplay', label: '🎭 Cosplay & Erotic', icon: 'Smile', query: 'cosplay', tags: ['#Cosplay18', '#Erotic', '#Fetish'], isNsfw: true },
  { key: 'pov', label: '👁️ POV & Solos', icon: 'Eye', query: 'pov', tags: ['#POV', '#Solo', '#HD1080p'], isNsfw: true },
  { key: 'hardcore', label: '⚡ Hardcore & Climax', icon: 'Lock', query: 'hardcore', tags: ['#Hardcore', '#Climax', '#18Plus'], isNsfw: true },
  { key: 'topweekly', label: '⭐ Top Semanal X +18', icon: 'Trophy', query: 'popular', tags: ['#TopWeekly', '#BestNSFW', '#Hot'], isNsfw: true },
];

const POPULAR_TAGS = [
  '#NSFW',
  '#OnlyFans',
  '#Amateur',
  '#Casero',
  '#Latina',
  '#Cosplay18',
  '#Viral18',
  '#POV',
  '#TwitterAfterDark',
  '#Espana18',
  '#Hardcore',
  '#ModelVIP',
];

export const SearchHero: React.FC<SearchHeroProps> = ({
  onSearch,
  currentQuery,
  isLoading,
}) => {
  const [inputValue, setInputValue] = useState(currentQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external query changes
  useEffect(() => {
    setInputValue(currentQuery);
  }, [currentQuery]);

  // Fetch live suggestions on input typing
  useEffect(() => {
    if (!inputValue.trim() || inputValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(inputValue)}&nsfw=true`);
        if (res.ok) {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            if (data && Array.isArray(data.suggestions)) {
              setSuggestions(data.suggestions);
            }
          } catch {}
        }
      } catch {
        // Fallback gracefully
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setIsFocused(false);
    onSearch(inputValue.trim(), true);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setIsFocused(false);
    onSearch(suggestion, true);
  };

  const handleCategoryClick = (cat: CategoryPreset) => {
    setActiveCategory(cat.key);
    setInputValue(cat.query);
    onSearch(cat.query, true);
  };

  const handleTagClick = (tag: string) => {
    setInputValue(tag);
    onSearch(tag, true);
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Flame': return <Flame className="w-4 h-4 text-rose-500" />;
      case 'Film': return <Film className="w-4 h-4 text-purple-500" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'Heart': return <Flame className="w-4 h-4 text-pink-500" />;
      case 'Smile': return <Smile className="w-4 h-4 text-yellow-500" />;
      case 'Eye': return <TrendingUp className="w-4 h-4 text-sky-500" />;
      case 'Lock': return <Lock className="w-4 h-4 text-rose-600" />;
      case 'Trophy': return <Trophy className="w-4 h-4 text-amber-500" />;
      default: return <Sparkles className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-center px-4 pt-4 pb-2">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/90 text-rose-800 text-xs font-semibold shadow-xs mb-4">
        <Lock className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
        <span>🔞 Buscador Exclusivo de Videos +18 en Twitter / X</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
        Buscador de Videos +18 de <br className="hidden sm:inline" />
        <span className="bg-gradient-to-r from-rose-500 via-pink-600 to-red-600 bg-clip-text text-transparent">
          Twitter / X Sin Censura
        </span>
      </h1>
      <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
        Explora y descarga millones de videos para adultos de X (Twitter): amateur, OnlyFans, modelos, caseros y cosplay en 1080p Full HD y MP3.
      </p>

      {/* Search Input Bar */}
      <div className="mt-8 relative max-w-3xl mx-auto" ref={dropdownRef}>
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-rose-500/5 border-2 border-slate-200 hover:border-rose-300 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10 transition-all duration-200 p-2">
            <div className="pl-3 pr-2 text-slate-400">
              <Search className="w-6 h-6 text-rose-500" />
            </div>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder="Ej: #NSFW, onlyfans leaks, amateur casero, latina, cosplay, pov..."
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-base sm:text-lg focus:outline-hidden px-2 py-2"
              autoComplete="off"
            />

            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  setSuggestions([]);
                }}
                className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                title="Limpiar búsqueda"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex items-center justify-center gap-2 px-5 sm:px-7 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-md shadow-sky-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <span>Buscar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Auto-Suggestions Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-40 text-left overflow-hidden animate-in fade-in duration-150">
            <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
              Sugerencias de búsqueda
            </div>
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onMouseDown={() => handleSelectSuggestion(item)}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-slate-400 group-hover:text-sky-500" />
                  <span className="font-medium">{item}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 opacity-0 group-hover:opacity-100 transition" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category Discovery Pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryClick(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20 scale-105'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 hover:border-slate-300 shadow-xs'
              }`}
            >
              {renderIcon(cat.icon)}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Trending Hashtags Cloud */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-center gap-1.5 flex-wrap max-w-2xl mx-auto text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 font-semibold text-slate-400 mr-1">
          <Hash className="w-3.5 h-3.5 text-sky-500" />
          Tendencias:
        </span>
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-600 font-medium transition cursor-pointer"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};
