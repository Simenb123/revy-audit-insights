import { z } from 'zod';

// Base widget configuration schema
export const BaseWidgetConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  refreshInterval: z.number().min(0).optional(),
  autoRefresh: z.boolean().optional(),
});

// Widget layout schema
export const WidgetLayoutSchema = z.object({
  i: z.string(),
  x: z.number().min(0),
  y: z.number().min(0),
  w: z.number().min(1),
  h: z.number().min(1),
  widgetId: z.string(),
  dataSourceId: z.string().optional(),
  sectionId: z.string().optional(),
  minW: z.number().min(1).optional(),
  minH: z.number().min(1).optional(),
  maxW: z.number().optional(),
  maxH: z.number().optional(),
  static: z.boolean().optional(),
});

// Widget types enum - matching existing types
export const WidgetTypeSchema = z.enum([
  'kpi',
  'table',
  'chart',
  'text',
  'formula',
  'filter',
  'pivot',
  'gauge',
  'accountLines',
  'statementTable',
  'budgetKpi',
  'budgetTable',
  'budgetChart',
  'heatmap',
  'treemap',
  'bubble',
  'map',
  'waterfall',
  'enhancedKpi',
  'metricCard',
  'progress',
  'activityFeed',
  'alerts',
  'accountHierarchy',
  'metricsExplorer',
  'smartNavigation',
  'crossCheck'
]);

// Widget data source schema
export const DataSourceSchema = z.object({
  id: z.string(),
  type: z.enum(['database', 'api', 'file', 'manual']),
  endpoint: z.string().optional(),
  query: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
  lastUpdated: z.string().optional(),
});

// Widget schema
export const WidgetSchema = z.object({
  id: z.string(),
  type: WidgetTypeSchema,
  title: z.string(),
  config: BaseWidgetConfigSchema.extend({
    chartType: z.enum(['bar', 'line', 'pie', 'area', 'scatter']).optional(),
    dataSource: DataSourceSchema.optional(),
    filters: z.record(z.string(), z.any()).optional(),
    formatting: z.object({
      currency: z.boolean().optional(),
      percentage: z.boolean().optional(),
      decimals: z.number().min(0).max(10).optional(),
    }).optional(),
  }).optional(),
  data: z.any().optional(),
  metadata: z.object({
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    createdBy: z.string().optional(),
    version: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  performance: z.object({
    lastLoadTime: z.number().optional(),
    averageLoadTime: z.number().optional(),
    errorCount: z.number().optional(),
    successRate: z.number().min(0).max(100).optional(),
  }).optional(),
});

// Dashboard configuration schema
export const DashboardConfigSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Dashboard name is required'),
  description: z.string().optional(),
  widgets: z.array(WidgetSchema),
  layouts: z.array(WidgetLayoutSchema),
  settings: z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    autoSave: z.boolean().default(true),
    refreshInterval: z.number().min(0).default(300000), // 5 minutes
    gridSize: z.object({
      cols: z.number().min(1).default(12),
      rowHeight: z.number().min(1).default(150),
    }),
  }),
  permissions: z.object({
    canEdit: z.boolean().default(true),
    canShare: z.boolean().default(false),
    canExport: z.boolean().default(true),
  }),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    version: z.string().default('1.0.0'),
    clientId: z.string().optional(),
    year: z.number().optional(),
  }),
});

// CrossCheck configuration schema
export const CrossCheckConfigSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'CrossCheck name is required'),
  description: z.string().optional(),
  rules: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['balance', 'variance', 'threshold', 'custom']),
    condition: z.string(),
    tolerance: z.number().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    enabled: z.boolean().default(true),
  })),
  dataSources: z.array(DataSourceSchema),
  schedule: z.object({
    enabled: z.boolean().default(false),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    time: z.string().optional(),
  }),
  notifications: z.object({
    email: z.boolean().default(false),
    emailList: z.array(z.string().email()).optional(),
    webhook: z.boolean().default(false),
    webhookUrl: z.string().url().optional(),
  }),
});

// Report template schema
export const ReportTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.string().default('general'),
  widgets: z.array(WidgetSchema),
  layouts: z.array(WidgetLayoutSchema),
  settings: z.object({
    autoGenerate: z.boolean().default(false),
    schedule: z.object({
      enabled: z.boolean().default(false),
      frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    }),
    format: z.enum(['pdf', 'excel', 'html']).default('pdf'),
  }),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    version: z.string().default('1.0.0'),
    isPublic: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

// TypeScript types derived from schemas
export type Widget = z.infer<typeof WidgetSchema>;
export type WidgetLayout = z.infer<typeof WidgetLayoutSchema>;
export type WidgetType = z.infer<typeof WidgetTypeSchema>;
export type DataSource = z.infer<typeof DataSourceSchema>;
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
export type CrossCheckConfig = z.infer<typeof CrossCheckConfigSchema>;
export type ReportTemplate = z.infer<typeof ReportTemplateSchema>;
export type BaseWidgetConfig = z.infer<typeof BaseWidgetConfigSchema>;

// Validation helper functions
export const validateWidget = (data: unknown): Widget => {
  return WidgetSchema.parse(data);
};

export const validateWidgetLayout = (data: unknown): WidgetLayout => {
  return WidgetLayoutSchema.parse(data);
};

export const validateDashboardConfig = (data: unknown): DashboardConfig => {
  return DashboardConfigSchema.parse(data);
};

export const validateCrossCheckConfig = (data: unknown): CrossCheckConfig => {
  return CrossCheckConfigSchema.parse(data);
};

export const validateReportTemplate = (data: unknown): ReportTemplate => {
  return ReportTemplateSchema.parse(data);
};

// Safe validation functions that return results instead of throwing
export const safeValidateWidget = (data: unknown): { success: boolean; data?: Widget; error?: string } => {
  try {
    const validData = WidgetSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof z.ZodError ? error.issues.map((e: any) => e.message).join(', ') : 'Validation failed'
    };
  }
};

export const safeValidateDashboardConfig = (data: unknown): { success: boolean; data?: DashboardConfig; error?: string } => {
  try {
    const validData = DashboardConfigSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof z.ZodError ? error.issues.map((e: any) => e.message).join(', ') : 'Validation failed'
    };
  }
};