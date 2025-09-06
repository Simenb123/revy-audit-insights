import React, { useState, useCallback, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, 
  GripVertical, 
  Zap, 
  CheckCircle, 
  Target,
  Brain,
  TrendingUp,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import AccountDisplay from './AccountDisplay';

interface MappingItem {
  id: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  currentMapping?: string;
  suggestedMapping?: string;
  confidence?: number;
  category?: 'lønn' | 'tillegg' | 'fradrag' | 'avgift' | 'refusjon';
  lastModified?: Date;
}

interface InternalCode {
  id: string;
  label: string;
  description?: string;
  category?: string;
  color?: string;
}

interface CategoryZone {
  id: string;
  label: string;
  description: string;
  color: string;
  items: MappingItem[];
}

interface EnhancedDragDropMappingInterfaceProps {
  accounts: MappingItem[];
  internalCodes: InternalCode[];
  onUpdateMapping: (accountId: string, codeId: string) => void;
  onBulkUpdate: (mappings: Array<{ accountId: string; codeId: string }>) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function EnhancedDragDropMappingInterface({
  accounts,
  internalCodes,
  onUpdateMapping,
  onBulkUpdate,
  searchTerm,
  onSearchChange
}: EnhancedDragDropMappingInterfaceProps) {
  const [items, setItems] = useState(accounts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'categories'>('categories');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showConfidenceFilter, setShowConfidenceFilter] = useState(false);
  const [minConfidence, setMinConfidence] = useState(0.5);

  // Enhanced sensor configuration for better drag experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start dragging
      },
    })
  );

  // Create category zones based on internal codes
  const categoryZones = useMemo(() => {
    const zones: CategoryZone[] = [
      {
        id: 'unmapped',
        label: 'Umappede kontoer',
        description: 'Kontoer som ikke er tildelt en kategori ennå',
        color: 'bg-muted/50 border-muted',
        items: items.filter(item => !item.currentMapping)
      },
      ...internalCodes.map(code => ({
        id: code.id,
        label: code.label,
        description: code.description || 'Ingen beskrivelse',
        color: code.color || 'bg-primary/10 border-primary/20',
        items: items.filter(item => item.currentMapping === code.id)
      }))
    ];
    return zones;
  }, [items, internalCodes]);

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.accountName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }
    
    if (showConfidenceFilter) {
      filtered = filtered.filter(item => 
        !item.confidence || item.confidence >= minConfidence
      );
    }
    
    return filtered;
  }, [items, searchTerm, filterCategory, showConfidenceFilter, minConfidence]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalItems = items.length;
    const mappedItems = items.filter(item => item.currentMapping).length;
    const highConfidenceItems = items.filter(item => item.confidence && item.confidence > 0.8).length;
    const suggestedMappings = items.filter(item => item.suggestedMapping && !item.currentMapping).length;
    
    return {
      totalItems,
      mappedItems,
      highConfidenceItems,
      suggestedMappings,
      completionRate: totalItems > 0 ? (mappedItems / totalItems) * 100 : 0
    };
  }, [items]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeItem = items.find(item => item.id === active.id);
    const overId = over.id as string;

    if (activeItem) {
      // Check if dropped on a category zone
      const targetZone = categoryZones.find(zone => zone.id === overId);
      if (targetZone && targetZone.id !== 'unmapped') {
        onUpdateMapping(activeItem.id, targetZone.id);
      } else if (overId === 'unmapped') {
        onUpdateMapping(activeItem.id, '');
      }
    }

    setActiveId(null);
  }, [items, categoryZones, onUpdateMapping]);

  const handleBulkAction = (action: 'accept-high-confidence' | 'accept-all-suggestions' | 'clear-selected') => {
    if (action === 'accept-high-confidence') {
      const updates = items
        .filter(item => item.suggestedMapping && !item.currentMapping && (item.confidence || 0) > 0.8)
        .map(item => ({ accountId: item.id, codeId: item.suggestedMapping! }));
      onBulkUpdate(updates);
    } else if (action === 'accept-all-suggestions') {
      const updates = items
        .filter(item => item.suggestedMapping && !item.currentMapping)
        .map(item => ({ accountId: item.id, codeId: item.suggestedMapping! }));
      onBulkUpdate(updates);
    } else if (action === 'clear-selected') {
      const updates = selectedItems.map(id => ({ accountId: id, codeId: '' }));
      onBulkUpdate(updates);
      setSelectedItems([]);
    }
  };

  const SortableAccountItem = ({ account }: { account: MappingItem }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: account.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "bg-card border rounded-lg p-3 hover:shadow-md transition-all duration-200",
          isDragging && "shadow-lg ring-2 ring-primary/50",
          account.confidence && account.confidence > 0.8 && "ring-1 ring-success/30 bg-success/5"
        )}
      >
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </div>
          
          <div className="flex-1 min-w-0">
            <AccountDisplay
              accountNumber={account.accountNumber}
              accountName={account.accountName}
              variant="compact"
              showIcon
            />
            
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {formatCurrency(Math.abs(account.amount))}
              </Badge>
              
              {account.confidence && (
                <Badge variant={account.confidence > 0.8 ? "default" : "secondary"} className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  {Math.round(account.confidence * 100)}%
                </Badge>
              )}

              {account.category && (
                <Badge variant="outline" className="text-xs">
                  {account.category}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {account.suggestedMapping && !account.currentMapping && (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateMapping(account.id, account.suggestedMapping!)}
                    className="text-xs"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    AI forslag
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Foreslått: {internalCodes.find(c => c.id === account.suggestedMapping)?.label}</p>
                  <p>Sikkerhet: {Math.round((account.confidence || 0) * 100)}%</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            <Select
              value={account.currentMapping || ''}
              onValueChange={(value) => onUpdateMapping(account.id, value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Dra eller velg..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ingen mapping</SelectItem>
                {internalCodes.map((code) => (
                  <SelectItem key={code.id} value={code.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{code.label}</span>
                      {code.description && (
                        <span className="text-xs text-muted-foreground">{code.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  };

  const CategoryDropZone = ({ zone }: { zone: CategoryZone }) => {
    return (
      <Card className={cn("min-h-[200px] transition-all duration-200", zone.color)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {zone.label}
            </span>
            <Badge variant="outline">
              {zone.items.length}
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">{zone.description}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {zone.items.map((item) => (
            <SortableAccountItem key={item.id} account={item} />
          ))}
          
          {zone.items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Dra kontoer hit for å mappe til {zone.label.toLowerCase()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Enhanced Header with Statistics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Smart Mapping Interface
                </CardTitle>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Fullføring:</span>
                    <Progress value={stats.completionRate} className="w-20 h-2" />
                    <span className="font-medium">{stats.completionRate.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>{stats.mappedItems}/{stats.totalItems} mappet</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Brain className="h-4 w-4 text-primary" />
                    <span>{stats.highConfidenceItems} høy sikkerhet</span>
                  </div>
                  {stats.suggestedMappings > 0 && (
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-warning" />
                      <span>{stats.suggestedMappings} AI-forslag</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === 'categories' ? 'default' : 'outline'}
                  onClick={() => setViewMode('categories')}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Kategorier
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setViewMode('list')}
                >
                  Liste
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Enhanced Controls */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk på kontonummer eller navn..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfidenceFilter(!showConfidenceFilter)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showConfidenceFilter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('accept-high-confidence')}
                  disabled={stats.highConfidenceItems === 0}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Godta høy sikkerhet
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('accept-all-suggestions')}
                  disabled={stats.suggestedMappings === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Godta alle forslag
                </Button>
              </div>
            </div>

            {showConfidenceFilter && (
              <div className="mt-4 flex items-center gap-4">
                <span className="text-sm font-medium">Min. sikkerhet:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm">{Math.round(minConfidence * 100)}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drag and Drop Interface */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {viewMode === 'categories' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              <SortableContext 
                items={categoryZones.map(zone => zone.id)} 
                strategy={verticalListSortingStrategy}
              >
                {categoryZones.map((zone) => (
                  <CategoryDropZone key={zone.id} zone={zone} />
                ))}
              </SortableContext>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <SortableContext 
                  items={filteredItems.map(item => item.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y">
                    {filteredItems.map((account) => (
                      <div key={account.id} className="p-4">
                        <SortableAccountItem account={account} />
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </CardContent>
            </Card>
          )}
          
          <DragOverlay>
            {activeId ? (
              <div className="bg-card border rounded-lg p-4 shadow-lg ring-2 ring-primary/50">
                {(() => {
                  const item = items.find(i => i.id === activeId);
                  return item ? (
                    <AccountDisplay
                      accountNumber={item.accountNumber}
                      accountName={item.accountName}
                      variant="compact"
                    />
                  ) : null;
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Ingen kontoer funnet</h3>
              <p className="text-muted-foreground">
                Prøv å justere søkekriteriene eller filtrene
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}