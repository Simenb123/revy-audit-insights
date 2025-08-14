import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, Calculator, DollarSign, Activity, BarChart3 } from 'lucide-react';
import { KPI_LIBRARY, KPI_CATEGORIES, getKpisByCategory, searchKpis, type KpiDefinition } from '@/lib/kpiLibrary';

interface KpiLibraryProps {
  onSelectKpi: (kpi: KpiDefinition) => void;
  selectedKpiId?: string;
}

const CATEGORY_ICONS = {
  profitability: TrendingUp,
  liquidity: DollarSign,
  solvency: Activity,
  efficiency: BarChart3,
  growth: Calculator
} as const;

export function KpiLibrary({ onSelectKpi, selectedKpiId }: KpiLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof typeof KPI_CATEGORIES>('profitability');

  const filteredKpis = searchQuery 
    ? searchKpis(searchQuery)
    : getKpisByCategory(activeCategory);

  const renderKpiCard = (kpi: KpiDefinition) => {
    const isSelected = selectedKpiId === kpi.id;
    const CategoryIcon = CATEGORY_ICONS[kpi.category];
    
    return (
      <Card 
        key={kpi.id} 
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
        }`}
        onClick={() => onSelectKpi(kpi)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold">{kpi.name}</h4>
            </div>
            <Badge variant="outline" className="text-xs">
              {KPI_CATEGORIES[kpi.category].name}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {kpi.description}
          </p>
          
          {kpi.interpretation && (
            <p className="text-xs text-muted-foreground mb-3 italic">
              {kpi.interpretation}
            </p>
          )}
          
          {kpi.benchmarks && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Målverdier:</span>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                Excellent: {kpi.benchmarks.excellent}{kpi.displayAsPercentage ? '%' : ''}
              </Badge>
              <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Good: {kpi.benchmarks.good}{kpi.displayAsPercentage ? '%' : ''}
              </Badge>
            </div>
          )}
          
          <div className="flex justify-end mt-3">
            <Button 
              variant={isSelected ? "default" : "outline"} 
              size="sm"
            >
              {isSelected ? 'Valgt' : 'Velg KPI'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter KPI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchQuery ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Søkeresultater ({filteredKpis.length})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {filteredKpis.map(renderKpiCard)}
          </div>
          {filteredKpis.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Ingen KPI-er funnet for "{searchQuery}"</p>
            </div>
          )}
        </div>
      ) : (
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as keyof typeof KPI_CATEGORIES)}>
          <TabsList className="grid w-full grid-cols-5">
            {Object.entries(KPI_CATEGORIES).map(([key, category]) => {
              const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-1 text-xs">
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(KPI_CATEGORIES).map(([key, category]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <div className="text-center py-2">
                <h3 className="text-lg font-semibold">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {getKpisByCategory(key as keyof typeof KPI_CATEGORIES).map(renderKpiCard)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}