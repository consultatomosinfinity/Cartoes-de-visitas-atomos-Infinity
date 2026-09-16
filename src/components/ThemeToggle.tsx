import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function applyTheme(isDark: boolean) {
  if (typeof document === 'undefined') return;
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    try {
      localStorage.setItem('theme', 'dark');
    } catch {}
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    try {
      localStorage.setItem('theme', 'light');
    } catch {}
  }
  // Dispara evento customizado para sincronizar todos os botões na tela
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { isDark } }));
}

interface ThemeToggleProps {
  variant?: 'floating' | 'header';
}

export function ThemeToggle({ variant = 'floating' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') || getInitialTheme();
    }
    return false;
  });

  useEffect(() => {
    // Sincroniza estado inicial
    const active = getInitialTheme();
    setIsDark(active);
    applyTheme(active);

    const onThemeChange = (e: Event) => {
      const custom = e as CustomEvent<{ isDark: boolean }>;
      if (custom.detail && typeof custom.detail.isDark === 'boolean') {
        setIsDark(custom.detail.isDark);
      } else {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };

    window.addEventListener('theme-change', onThemeChange);
    return () => window.removeEventListener('theme-change', onThemeChange);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
  };

  if (variant === 'header') {
    return (
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
        title={isDark ? "Alternar para Modo Dia (Claro)" : "Alternar para Modo Noite (Escuro)"}
        aria-label={isDark ? "Alternar para Modo Dia" : "Alternar para Modo Noite"}
      >
        {isDark ? (
          <>
            <Sun size={15} className="text-amber-400" />
            <span className="hidden sm:inline">Modo Dia</span>
          </>
        ) : (
          <>
            <Moon size={15} className="text-sky-600" />
            <span className="hidden sm:inline">Modo Noite</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-slate-900 dark:bg-slate-100 text-amber-400 dark:text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-slate-700 dark:border-slate-300 cursor-pointer"
      title={isDark ? "Mudar para modo dia (claro)" : "Mudar para modo noite (escuro)"}
      aria-label={isDark ? "Mudar para modo dia" : "Mudar para modo noite"}
    >
      {isDark ? <Sun size={22} className="text-amber-400" /> : <Moon size={22} className="text-sky-300" />}
    </button>
  );
}
