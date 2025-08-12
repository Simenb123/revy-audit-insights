import './themes/light.css';
import './themes/dark.css';

export const themeVariables = {
  background: '--rb-background',
  foreground: '--rb-foreground',
  widgetBackground: '--rb-widget-bg',
  widgetForeground: '--rb-widget-foreground',
  widgetBorder: '--rb-widget-border',
} as const;

export const themes = {
  light: 'report-builder-theme-light',
  dark: 'report-builder-theme-dark',
} as const;

export type ThemeName = keyof typeof themes;

export const applyTheme = (el: HTMLElement, theme: ThemeName) => {
  const className = themes[theme];
  Object.values(themes).forEach(cls => el.classList.remove(cls));
  el.classList.add(className);
};
