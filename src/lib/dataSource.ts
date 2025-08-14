export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'database' | 'file' | 'mock';
  config: Record<string, any>;
  refreshInterval?: number; // minutes
  lastUpdated?: Date;
  isActive: boolean;
}

export interface DataSourceConfig {
  api?: {
    url: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    params?: Record<string, any>;
  };
  database?: {
    table: string;
    query?: string;
    filters?: Record<string, any>;
  };
  file?: {
    path: string;
    format: 'csv' | 'excel' | 'json';
  };
  mock?: {
    data: any[];
    delay?: number;
  };
}

export interface DataTransformation {
  id: string;
  type: 'filter' | 'sort' | 'aggregate' | 'map' | 'calculate';
  config: Record<string, any>;
}

export interface WidgetDataBinding {
  widgetId: string;
  dataSourceId: string;
  transformations?: DataTransformation[];
  refreshInterval?: number;
  autoRefresh: boolean;
}

// Mock data sources for demo
export const mockDataSources: DataSource[] = [
  {
    id: 'revenue-data',
    name: 'Inntektsdata',
    type: 'mock',
    config: {
      data: [
        { month: 'Jan', revenue: 850000, target: 800000 },
        { month: 'Feb', revenue: 920000, target: 850000 },
        { month: 'Mar', revenue: 780000, target: 900000 },
        { month: 'Apr', revenue: 1050000, target: 950000 },
        { month: 'May', revenue: 1150000, target: 1000000 },
        { month: 'Jun', revenue: 980000, target: 1100000 }
      ]
    },
    refreshInterval: 15,
    isActive: true,
    lastUpdated: new Date()
  },
  {
    id: 'client-metrics',
    name: 'Klientmålinger',
    type: 'mock',
    config: {
      data: [
        { category: 'Nye klienter', value: 24, change: 12 },
        { category: 'Aktive klienter', value: 156, change: -3 },
        { category: 'Gjennomsnittlig verdi', value: 450000, change: 8 },
        { category: 'Konverteringsrate', value: 0.23, change: 5 }
      ]
    },
    refreshInterval: 30,
    isActive: true,
    lastUpdated: new Date()
  },
  {
    id: 'performance-data',
    name: 'Ytelsesdata',
    type: 'mock',
    config: {
      data: [
        { metric: 'Gjennomføring av revisjoner', current: 78, target: 85 },
        { metric: 'Klienttilfredshet', current: 92, target: 90 },
        { metric: 'Leveringstid', current: 65, target: 70 },
        { metric: 'Kvalitetsscore', current: 88, target: 85 }
      ]
    },
    refreshInterval: 60,
    isActive: true,
    lastUpdated: new Date()
  }
];

export class DataSourceManager {
  private static instance: DataSourceManager;
  private dataSources: Map<string, DataSource> = new Map();
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  private constructor() {
    // Initialize with mock data
    mockDataSources.forEach(source => {
      this.dataSources.set(source.id, source);
      this.setupAutoRefresh(source);
    });
  }

  static getInstance(): DataSourceManager {
    if (!DataSourceManager.instance) {
      DataSourceManager.instance = new DataSourceManager();
    }
    return DataSourceManager.instance;
  }

  getDataSource(id: string): DataSource | undefined {
    return this.dataSources.get(id);
  }

  getAllDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }

  async fetchData(dataSourceId: string): Promise<any> {
    const source = this.dataSources.get(dataSourceId);
    if (!source) {
      throw new Error(`Data source not found: ${dataSourceId}`);
    }

    switch (source.type) {
      case 'mock':
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, source.config.delay || 100));
        return source.config.data;
      
      case 'api':
        const response = await fetch(source.config.url, {
          method: source.config.method || 'GET',
          headers: source.config.headers,
        });
        return response.json();
      
      default:
        throw new Error(`Unsupported data source type: ${source.type}`);
    }
  }

  subscribe(dataSourceId: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(dataSourceId)) {
      this.subscribers.set(dataSourceId, new Set());
    }
    this.subscribers.get(dataSourceId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(dataSourceId)?.delete(callback);
    };
  }

  private async notifySubscribers(dataSourceId: string) {
    const subscribers = this.subscribers.get(dataSourceId);
    if (subscribers && subscribers.size > 0) {
      try {
        const data = await this.fetchData(dataSourceId);
        subscribers.forEach(callback => callback(data));
      } catch (error) {
        console.error(`Failed to fetch data for ${dataSourceId}:`, error);
      }
    }
  }

  private setupAutoRefresh(source: DataSource) {
    if (source.refreshInterval && source.isActive) {
      const interval = source.refreshInterval * 60 * 1000; // Convert to milliseconds
      const timer = setInterval(() => {
        this.notifySubscribers(source.id);
      }, interval);
      
      this.refreshTimers.set(source.id, timer);
    }
  }

  updateDataSource(source: DataSource) {
    this.dataSources.set(source.id, source);
    
    // Clear existing timer
    const existingTimer = this.refreshTimers.get(source.id);
    if (existingTimer) {
      clearInterval(existingTimer);
    }
    
    // Setup new timer
    this.setupAutoRefresh(source);
  }

  async refreshDataSource(dataSourceId: string) {
    const source = this.dataSources.get(dataSourceId);
    if (source) {
      source.lastUpdated = new Date();
      this.dataSources.set(dataSourceId, source);
      await this.notifySubscribers(dataSourceId);
    }
  }
}

export const dataSourceManager = DataSourceManager.getInstance();