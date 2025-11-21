'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

interface UISettingsContextValue {
  theme: ThemeMode;
  language: Language;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (lang: Language) => void;
}

const UISettingsContext = createContext<UISettingsContextValue | undefined>(undefined);

const THEME_KEY = 'ui-theme';
const LANG_KEY = 'ui-language';

export const UISettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [language, setLanguageState] = useState<Language>('vi');

  useEffect(() => {
    const storedTheme = (localStorage.getItem(THEME_KEY) as ThemeMode | null) || 'dark';
    const storedLang = (localStorage.getItem(LANG_KEY) as Language | null) || 'vi';
    setThemeState(storedTheme);
    setLanguageState(storedLang);
    document.documentElement.dataset.theme = storedTheme;
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  const setTheme = (next: ThemeMode) => {
    setThemeState(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.dataset.theme = next;
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    localStorage.setItem(LANG_KEY, next);
  };

  return (
    <UISettingsContext.Provider value={{ theme, language, setTheme, setLanguage }}>
      {children}
    </UISettingsContext.Provider>
  );
};

export const useUISettings = () => {
  const ctx = useContext(UISettingsContext);
  if (!ctx) {
    throw new Error('useUISettings must be used within UISettingsProvider');
  }
  return ctx;
};
