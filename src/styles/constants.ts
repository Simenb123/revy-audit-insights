export const STYLE_COLORS = {
  BLUE: '#3B82F6',
  RED: '#EF4444',
  GREEN: '#10B981',
  YELLOW: '#F59E0B',
  PURPLE: '#8B5CF6',
  PINK: '#EC4899',
  GRAY: '#6B7280'
} as const;

export const COLOR_OPTIONS = [
  { value: STYLE_COLORS.BLUE, label: 'Blå', color: STYLE_COLORS.BLUE },
  { value: STYLE_COLORS.RED, label: 'Rød', color: STYLE_COLORS.RED },
  { value: STYLE_COLORS.GREEN, label: 'Grønn', color: STYLE_COLORS.GREEN },
  { value: STYLE_COLORS.YELLOW, label: 'Gul', color: STYLE_COLORS.YELLOW },
  { value: STYLE_COLORS.PURPLE, label: 'Lilla', color: STYLE_COLORS.PURPLE },
  { value: STYLE_COLORS.PINK, label: 'Rosa', color: STYLE_COLORS.PINK },
  { value: STYLE_COLORS.GRAY, label: 'Grå', color: STYLE_COLORS.GRAY }
];

export const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' }
];

export const DEFAULT_TAG_COLOR = STYLE_COLORS.BLUE;
export const DEFAULT_SUBJECT_COLOR = STYLE_COLORS.GREEN;
