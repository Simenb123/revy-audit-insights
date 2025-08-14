import React from 'react';

interface WidgetPreviewProps {
  type: string;
  title?: string;
  config?: Record<string, any>;
}

export function WidgetPreview({ type, title, config = {} }: WidgetPreviewProps) {
  const heading = title || 'Forhåndsvisning';

  // Apply styling configuration
  const getWidgetStyles = () => {
    const styles: React.CSSProperties = {};
    
    if (config.padding !== undefined) {
      styles.padding = `${config.padding}px`;
    }
    
    if (config.borderRadius !== undefined) {
      styles.borderRadius = `${config.borderRadius}px`;
    }
    
    return styles;
  };

  const getWidgetClasses = () => {
    const classes = ['rounded-md', 'border', 'p-3'];
    
    // Theme preset classes
    if (config.themePreset) {
      switch (config.themePreset) {
        case 'professional':
          classes.push('bg-slate-50', 'border-slate-200');
          break;
        case 'modern':
          classes.push('bg-gradient-to-br', 'from-blue-50', 'to-indigo-50', 'border-blue-200');
          break;
        case 'minimal':
          classes.push('bg-white', 'border-gray-100', 'shadow-none');
          break;
        case 'bold':
          classes.push('bg-primary/5', 'border-primary/20');
          break;
        case 'elegant':
          classes.push('bg-gradient-to-br', 'from-purple-50', 'to-pink-50', 'border-purple-200');
          break;
      }
    }
    
    // Background
    if (config.background) {
      switch (config.background) {
        case 'white':
          classes.push('bg-white');
          break;
        case 'muted':
          classes.push('bg-muted/50');
          break;
        case 'gradient':
          classes.push('bg-gradient-to-br', 'from-primary/5', 'to-secondary/5');
          break;
        case 'transparent':
          classes.push('bg-transparent');
          break;
      }
    }
    
    // Visual effects
    if (config.showShadow !== false) {
      classes.push('shadow-sm');
    }
    
    if (config.showBorder === false) {
      classes.push('border-transparent');
    }
    
    if (config.enableHover !== false) {
      classes.push('hover:shadow-md', 'transition-shadow');
    }
    
    // Layout variant
    if (config.layoutVariant) {
      switch (config.layoutVariant) {
        case 'compact':
          classes.push('p-2');
          break;
        case 'expanded':
          classes.push('p-6');
          break;
        case 'card':
          classes.push('shadow-lg', 'border-2');
          break;
        case 'minimal':
          classes.push('p-1', 'border-0', 'shadow-none');
          break;
      }
    }
    
    // Custom classes
    if (config.customClasses) {
      classes.push(...config.customClasses);
    }
    
    return classes.join(' ');
  };

  const getTextStyles = () => {
    const classes = [];
    
    if (config.fontSize) {
      switch (config.fontSize) {
        case 'xs': classes.push('text-xs'); break;
        case 'sm': classes.push('text-sm'); break;
        case 'base': classes.push('text-base'); break;
        case 'lg': classes.push('text-lg'); break;
        case 'xl': classes.push('text-xl'); break;
        case '2xl': classes.push('text-2xl'); break;
      }
    }
    
    if (config.fontWeight) {
      switch (config.fontWeight) {
        case 'light': classes.push('font-light'); break;
        case 'normal': classes.push('font-normal'); break;
        case 'medium': classes.push('font-medium'); break;
        case 'semibold': classes.push('font-semibold'); break;
        case 'bold': classes.push('font-bold'); break;
      }
    }
    
    return classes.join(' ');
  };

  const renderContent = () => {
    switch (type) {
      case 'kpi':
      case 'enhancedKpi': {
        const value = config.displayAsPercentage ? '12,5 %' : (config.unitScale === 'million' ? '1,23 M' : config.unitScale === 'thousand' ? '123,4 k' : '123 456');
        return (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Nøkkeltall</div>
            <div className="text-3xl font-semibold tracking-tight">{value}{!config.displayAsPercentage && config.showCurrency !== false ? ' kr' : ''}</div>
            {config.showTrend !== false && (
              <div className="text-xs text-muted-foreground">Trend: ↑ 3,2 % siste år</div>
            )}
          </div>
        );
      }
      case 'table':
        return (
          <div className="w-full overflow-hidden rounded-md border">
            <div className="grid grid-cols-3 text-xs bg-muted/30 border-b">
              <div className="px-3 py-2">Kontonr</div>
              <div className="px-3 py-2">Navn</div>
              <div className="px-3 py-2 text-right">Saldo</div>
            </div>
            {[1,2,3,4].map((i) => (
              <div key={i} className="grid grid-cols-3 text-xs">
                <div className="px-3 py-1.5 text-muted-foreground">19{i}</div>
                <div className="px-3 py-1.5 text-muted-foreground truncate">Eksempel konto {i}</div>
                <div className="px-3 py-1.5 text-right">{(1000*i).toLocaleString('no-NO')}</div>
              </div>
            ))}
          </div>
        );
      case 'chart':
        return (
          <div className="flex items-end gap-2 h-24">
            {[28, 60, 40, 80, 55].map((h, idx) => (
              <div key={idx} className="flex-1 bg-primary/20 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        );
      case 'text': {
        const size = config.fontSize || 'sm';
        const sizeClass = size === 'xl' ? 'text-xl' : size === 'lg' ? 'text-lg' : size === 'base' ? 'text-base' : size === 'xs' ? 'text-xs' : 'text-sm';
        return (
          <div className={`${sizeClass} whitespace-pre-wrap text-foreground/90`}>
            {config.content || 'Legg til tekst i innstillingene'}
          </div>
        );
      }
      case 'filter':
        return (
          <div className="flex flex-wrap gap-2 text-xs">
            {config.showSearch !== false && <span className="px-2 py-1 rounded border bg-muted/20">Søk</span>}
            {config.showAccountCategory !== false && <span className="px-2 py-1 rounded border bg-muted/20">Kategori</span>}
            {config.showAccountType !== false && <span className="px-2 py-1 rounded border bg-muted/20">Type</span>}
            {config.showDateRange !== false && <span className="px-2 py-1 rounded border bg-muted/20">Periode</span>}
          </div>
        );
      default:
        return (
          <div className="text-xs text-muted-foreground">
            Forhåndsvisning ikke tilgjengelig for denne widget-typen ennå.
          </div>
        );
    }
  };

  return (
    <div className={getWidgetClasses()} style={getWidgetStyles()}>
      <div className={`text-sm font-medium mb-2 truncate ${getTextStyles()}`}>{heading}</div>
      <div className={getTextStyles()}>
        {renderContent()}
      </div>
    </div>
  );
}
