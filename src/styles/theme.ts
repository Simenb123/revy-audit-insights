export const palettes = {
  light: {
    primary: '175 80% 35%',
    background: '213 100% 97%',
    foreground: '213 29% 18%',
  },
  forest: {
    primary: '142 71% 30%',
    background: '143 67% 96%',
    foreground: '143 24% 20%',
  },
};

export const fonts = {
  sans: "Inter, sans-serif",
  serif: "Georgia, serif",
};

export const logos = {
  default: '/placeholder.svg',
  alt: '/favicon.ico',
};

export interface ThemeConfig {
  palette: keyof typeof palettes;
  font: keyof typeof fonts;
  logo: keyof typeof logos;
}

export const defaultTheme: ThemeConfig = {
  palette: 'light',
  font: 'sans',
  logo: 'default',
};

export function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  const palette = palettes[theme.palette];
  root.style.setProperty('--primary', palette.primary);
  root.style.setProperty('--background', palette.background);
  root.style.setProperty('--foreground', palette.foreground);
  root.style.setProperty('--font-family', fonts[theme.font]);
}
