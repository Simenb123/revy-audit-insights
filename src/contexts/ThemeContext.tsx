import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme, defaultTheme, type ThemeConfig } from '@/styles/theme';

interface ThemeContextValue {
  theme: ThemeConfig;
  setPalette: (p: ThemeConfig['palette']) => void;
  setFont: (f: ThemeConfig['font']) => void;
  setLogo: (l: ThemeConfig['logo']) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ProviderProps {
  initialTheme?: ThemeConfig;
  onChange?: (theme: ThemeConfig) => void;
  children: React.ReactNode;
}

export function ThemeProvider({ initialTheme, onChange, children }: ProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme || defaultTheme);

  useEffect(() => {
    applyTheme(theme);
    onChange?.(theme);
  }, [theme, onChange]);

  const setPalette = (p: ThemeConfig['palette']) => setTheme(prev => ({ ...prev, palette: p }));
  const setFont = (f: ThemeConfig['font']) => setTheme(prev => ({ ...prev, font: f }));
  const setLogo = (l: ThemeConfig['logo']) => setTheme(prev => ({ ...prev, logo: l }));

  return (
    <ThemeContext.Provider value={{ theme, setPalette, setFont, setLogo }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeConfig must be used within ThemeProvider');
  return ctx;
}
