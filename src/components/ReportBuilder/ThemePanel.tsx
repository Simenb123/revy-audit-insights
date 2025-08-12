import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useThemeConfig } from '@/contexts/ThemeContext';
import { palettes, fonts, logos } from '@/styles/theme';

export function ThemePanel() {
  const { theme, setPalette, setFont, setLogo } = useThemeConfig();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Fargepalett</label>
        <Select value={theme.palette} onValueChange={setPalette}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(palettes).map(key => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Font</label>
        <Select value={theme.font} onValueChange={setFont}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(fonts).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.split(',')[0]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Logo</label>
        <Select value={theme.logo} onValueChange={setLogo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(logos).map(key => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <img src={logos[theme.logo]} alt="Logo" className="h-12" />
      </div>
    </div>
  );
}
