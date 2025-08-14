import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Palette, Type, Layout, Sparkles } from 'lucide-react';

interface WidgetStyleConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

export function WidgetStyleConfig({ config, onChange }: WidgetStyleConfigProps) {
  const updateConfig = (updates: Record<string, any>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Theme Presets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Tema-forhåndsinnstillinger</Label>
        </div>
        <Select 
          value={config.themePreset || 'default'} 
          onValueChange={(value) => updateConfig({ themePreset: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg tema" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Standard</SelectItem>
            <SelectItem value="professional">Profesjonell</SelectItem>
            <SelectItem value="modern">Moderne</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="bold">Kraftfull</SelectItem>
            <SelectItem value="elegant">Elegant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Color Scheme */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Fargetema</Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Primærfarge</Label>
            <Select 
              value={config.primaryColor || 'default'} 
              onValueChange={(value) => updateConfig({ primaryColor: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Standard</SelectItem>
                <SelectItem value="blue">Blå</SelectItem>
                <SelectItem value="green">Grønn</SelectItem>
                <SelectItem value="purple">Lilla</SelectItem>
                <SelectItem value="orange">Oransje</SelectItem>
                <SelectItem value="red">Rød</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Bakgrunn</Label>
            <Select 
              value={config.background || 'default'} 
              onValueChange={(value) => updateConfig({ background: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Standard</SelectItem>
                <SelectItem value="white">Hvit</SelectItem>
                <SelectItem value="muted">Dempet</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="transparent">Gjennomsiktig</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Typography */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Typografi</Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Font-størrelse</Label>
            <Select 
              value={config.fontSize || 'base'} 
              onValueChange={(value) => updateConfig({ fontSize: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xs">Ekstra liten</SelectItem>
                <SelectItem value="sm">Liten</SelectItem>
                <SelectItem value="base">Standard</SelectItem>
                <SelectItem value="lg">Stor</SelectItem>
                <SelectItem value="xl">Ekstra stor</SelectItem>
                <SelectItem value="2xl">Meget stor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Font-vekt</Label>
            <Select 
              value={config.fontWeight || 'normal'} 
              onValueChange={(value) => updateConfig({ fontWeight: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Lett</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="semibold">Halvfet</SelectItem>
                <SelectItem value="bold">Fet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Layout & Spacing */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Layout og avstand</Label>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Padding</Label>
            <Slider
              value={[config.padding || 16]}
              onValueChange={([value]) => updateConfig({ padding: value })}
              min={0}
              max={48}
              step={4}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-right">{config.padding || 16}px</div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Border radius</Label>
            <Slider
              value={[config.borderRadius || 8]}
              onValueChange={([value]) => updateConfig({ borderRadius: value })}
              min={0}
              max={24}
              step={2}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-right">{config.borderRadius || 8}px</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Visual Effects */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Visuelle effekter</Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Skygge</Label>
            <Switch
              checked={config.showShadow ?? true}
              onCheckedChange={(checked) => updateConfig({ showShadow: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Border</Label>
            <Switch
              checked={config.showBorder ?? true}
              onCheckedChange={(checked) => updateConfig({ showBorder: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Hover-effekt</Label>
            <Switch
              checked={config.enableHover ?? true}
              onCheckedChange={(checked) => updateConfig({ enableHover: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Layout Variant */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Layout-variant</Label>
        <Select 
          value={config.layoutVariant || 'default'} 
          onValueChange={(value) => updateConfig({ layoutVariant: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Standard</SelectItem>
            <SelectItem value="compact">Kompakt</SelectItem>
            <SelectItem value="expanded">Utvidet</SelectItem>
            <SelectItem value="card">Kort</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom CSS */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Egendefinerte klasser</Label>
        <div className="flex flex-wrap gap-2">
          {config.customClasses?.map((cls: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {cls}
            </Badge>
          ))}
          {(!config.customClasses || config.customClasses.length === 0) && (
            <span className="text-xs text-muted-foreground">Ingen egendefinerte klasser</span>
          )}
        </div>
      </div>
    </div>
  );
}