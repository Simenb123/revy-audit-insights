export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  styles: {
    primaryColor: string;
    background: string;
    fontSize: string;
    fontWeight: string;
    padding: number;
    borderRadius: number;
    showShadow: boolean;
    showBorder: boolean;
    layoutVariant: string;
  };
}

export const themePresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'Standard',
    description: 'Standard Revio-tema med balansert design',
    styles: {
      primaryColor: 'default',
      background: 'default',
      fontSize: 'base',
      fontWeight: 'normal',
      padding: 16,
      borderRadius: 8,
      showShadow: true,
      showBorder: true,
      layoutVariant: 'default'
    }
  },
  {
    id: 'professional',
    name: 'Profesjonell',
    description: 'Klassisk og konservativ stil for formelle rapporter',
    styles: {
      primaryColor: 'blue',
      background: 'white',
      fontSize: 'sm',
      fontWeight: 'medium',
      padding: 20,
      borderRadius: 4,
      showShadow: false,
      showBorder: true,
      layoutVariant: 'default'
    }
  },
  {
    id: 'modern',
    name: 'Moderne',
    description: 'Sleek design med gradienter og moderne elementer',
    styles: {
      primaryColor: 'purple',
      background: 'gradient',
      fontSize: 'base',
      fontWeight: 'medium',
      padding: 24,
      borderRadius: 12,
      showShadow: true,
      showBorder: false,
      layoutVariant: 'card'
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ren og enkel stil med mye whitespace',
    styles: {
      primaryColor: 'default',
      background: 'white',
      fontSize: 'sm',
      fontWeight: 'light',
      padding: 32,
      borderRadius: 0,
      showShadow: false,
      showBorder: false,
      layoutVariant: 'minimal'
    }
  },
  {
    id: 'bold',
    name: 'Kraftfull',
    description: 'Sterk visuell stil med tydelige farger og kontraster',
    styles: {
      primaryColor: 'orange',
      background: 'muted',
      fontSize: 'lg',
      fontWeight: 'bold',
      padding: 16,
      borderRadius: 8,
      showShadow: true,
      showBorder: true,
      layoutVariant: 'expanded'
    }
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sofistikert design med subtile detaljer',
    styles: {
      primaryColor: 'purple',
      background: 'gradient',
      fontSize: 'base',
      fontWeight: 'normal',
      padding: 20,
      borderRadius: 16,
      showShadow: true,
      showBorder: false,
      layoutVariant: 'card'
    }
  }
];

export function applyThemePreset(presetId: string, currentConfig: Record<string, any>): Record<string, any> {
  const preset = themePresets.find(p => p.id === presetId);
  if (!preset) return currentConfig;

  return {
    ...currentConfig,
    themePreset: presetId,
    ...preset.styles
  };
}

export function getColorValue(colorName: string): string {
  const colorMap: Record<string, string> = {
    default: 'hsl(var(--primary))',
    blue: 'hsl(220, 100%, 50%)',
    green: 'hsl(120, 100%, 40%)',
    purple: 'hsl(280, 100%, 50%)',
    orange: 'hsl(25, 100%, 50%)',
    red: 'hsl(0, 100%, 50%)'
  };

  return colorMap[colorName] || colorMap.default;
}