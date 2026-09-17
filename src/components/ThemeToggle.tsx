import React, { useEffect, useState, useRef } from 'react';
import { Moon, Sun, Sparkles, Layers, ChevronDown, Check } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'neu-light' | 'neu-dark';

export function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const savedMode = localStorage.getItem('theme_mode') as ThemeMode;
    if (savedMode && ['light', 'dark', 'neu-light', 'neu-dark'].includes(savedMode)) {
      return savedMode;
    }
    const savedLegacy = localStorage.getItem('theme');
    if (savedLegacy === 'dark') return 'dark';
    if (savedLegacy === 'light') return 'light';
    const isSysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isSysDark ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function getInitialTheme(): boolean {
  const mode = getInitialThemeMode();
  return mode === 'dark' || mode === 'neu-dark';
}

export function applyTheme(modeOrIsDark: ThemeMode | boolean) {
  if (typeof document === 'undefined') return;

  let mode: ThemeMode;
  if (typeof modeOrIsDark === 'boolean') {
    mode = modeOrIsDark ? 'dark' : 'light';
  } else {
    mode = modeOrIsDark;
  }

  const isDark = mode === 'dark' || mode === 'neu-dark';

  // Limpa classes anteriores de tema
  document.documentElement.classList.remove('dark', 'theme-neu-light', 'theme-neu-dark');
  document.body.classList.remove('dark', 'theme-neu-light', 'theme-neu-dark');

  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else if (mode === 'neu-light') {
    document.documentElement.classList.add('theme-neu-light');
    document.body.classList.add('theme-neu-light');
  } else if (mode === 'neu-dark') {
    document.documentElement.classList.add('dark', 'theme-neu-dark');
    document.body.classList.add('dark', 'theme-neu-dark');
  }

  try {
    localStorage.setItem('theme_mode', mode);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  } catch {}

  // Dispara evento customizado para sincronizar todos os seletores na tela
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { isDark, mode } }));
}

interface ThemeToggleProps {
  variant?: 'floating' | 'header';
}

export function ThemeToggle({ variant = 'floating' }: ThemeToggleProps) {
  const [currentMode, setCurrentMode] = useState<ThemeMode>(() => getInitialThemeMode());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sincroniza estado inicial
    const initial = getInitialThemeMode();
    setCurrentMode(initial);
    applyTheme(initial);

    const onThemeChange = (e: Event) => {
      const custom = e as CustomEvent<{ isDark: boolean; mode?: ThemeMode }>;
      if (custom.detail?.mode) {
        setCurrentMode(custom.detail.mode);
      } else if (typeof custom.detail?.isDark === 'boolean') {
        setCurrentMode(custom.detail.isDark ? 'dark' : 'light');
      }
    };

    window.addEventListener('theme-change', onThemeChange);
    return () => window.removeEventListener('theme-change', onThemeChange);
  }, []);

  // Fecha popover ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectMode = (m: ThemeMode) => {
    setCurrentMode(m);
    applyTheme(m);
    setIsOpen(false);
  };

  const getModeInfo = (m: ThemeMode) => {
    switch (m) {
      case 'light':
        return {
          label: 'Modo Dia',
          sub: 'Claro Flat Moderno',
          icon: <Sun size={15} className="text-amber-500 shrink-0" />,
        };
      case 'dark':
        return {
          label: 'Modo Noite',
          sub: 'Escuro Flat Moderno',
          icon: <Moon size={15} className="text-sky-400 shrink-0" />,
        };
      case 'neu-light':
        return {
          label: 'Neumorphism Light',
          sub: 'Soft UI Relevo Claro',
          icon: <Sparkles size={15} className="text-teal-600 shrink-0" />,
        };
      case 'neu-dark':
        return {
          label: 'Neumorphism Dark',
          sub: 'Cyber Slate Relevo Escuro',
          icon: <Layers size={15} className="text-purple-400 shrink-0" />,
        };
    }
  };

  const currentInfo = getModeInfo(currentMode);

  if (variant === 'header') {
    return (
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
          title="Alternar Tema da Interface (Claro, Escuro, Neumorphism Light, Neumorphism Dark)"
        >
          {currentInfo.icon}
          <span className="hidden sm:inline font-bold">{currentInfo.label}</span>
          <ChevronDown size={13} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-700/60 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Estilo da Interface
            </div>

            <div className="p-1 space-y-1">
              {(['light', 'dark', 'neu-light', 'neu-dark'] as ThemeMode[]).map((mode) => {
                const info = getModeInfo(mode);
                const isSelected = currentMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => selectMode(mode)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center">
                        {info.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">{info.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{info.sub}</div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Floating variant
  return (
    <div className="fixed bottom-6 right-6 z-50" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 rounded-full bg-slate-900 dark:bg-slate-100 text-amber-400 dark:text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-slate-700 dark:border-slate-300 cursor-pointer"
        title="Alternar Tema & Estilo Neumorphism"
        aria-label="Alternar Tema"
      >
        {currentMode === 'neu-light' || currentMode === 'neu-dark' ? (
          <Sparkles size={22} className={currentMode === 'neu-light' ? 'text-teal-400' : 'text-purple-400'} />
        ) : currentMode === 'dark' ? (
          <Sun size={22} className="text-amber-400" />
        ) : (
          <Moon size={22} className="text-sky-300" />
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl py-2 z-50">
          <div className="px-3.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Estilo Visual da Aplicação
          </div>
          <div className="p-1 space-y-1">
            {(['light', 'dark', 'neu-light', 'neu-dark'] as ThemeMode[]).map((mode) => {
              const info = getModeInfo(mode);
              const isSelected = currentMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => selectMode(mode)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center">
                      {info.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{info.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{info.sub}</div>
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
