import React, { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Search, GripVertical, Zap, CheckCircle } from 'lucide-react';
import AccountDisplay from './AccountDisplay';

export interface MappingItem {
  id: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  currentMapping?: string;
  suggestedMapping?: string;
  confidence?: number;
}

export interface InternalCode {
  id: string;
  label: string;
  description?: string;
  category?: string;
}

interface DragDropMappingInterfaceProps {
  accounts: MappingItem[];
  internalCodes: InternalCode[];
  onUpdateMapping: (accountId: string, codeId: string) => void;
  onBulkUpdate: (mappings: Array<{ accountId: string; codeId: string }>) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

interface SortableAccountItemProps {
  account: MappingItem;
  internalCodes: InternalCode[];
  onUpdateMapping: (accountId: string, codeId: string) => void;
}

const SortableAccountItem: React.FC<SortableAccountItemProps> = ({
  account,
  internalCodes,
  onUpdateMapping
}) => {
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
      className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <AccountDisplay
            accountNumber={account.accountNumber}
            accountName={account.accountName}
            variant="detailed"
            showIcon
          />
          
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {Math.abs(account.amount).toLocaleString('nb-NO')} kr
            </Badge>
            
            {account.confidence && (
              <Badge variant={account.confidence > 0.8 ? "default" : "secondary"} className="text-xs">
                {Math.round(account.confidence * 100)}% sikker
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {account.suggestedMapping && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateMapping(account.id, account.suggestedMapping!)}
              className="text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Bruk forslag
            </Button>
          )}
          
          <Select
            value={account.currentMapping || ''}
            onValueChange={(value) => onUpdateMapping(account.id, value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Velg mapping..." />
            </SelectTrigger>
            <SelectContent>
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

const DragDropMappingInterface: React.FC<DragDropMappingInterfaceProps> = ({
  accounts,
  internalCodes,
  onUpdateMapping,
  onBulkUpdate,
  searchTerm,
  onSearchChange
}) => {
  const [items, setItems] = useState(accounts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const filteredItems = items.filter(item =>
    item.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.accountName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mappedCount = items.filter(item => item.currentMapping).length;
  const progressPercentage = items.length > 0 ? Math.round((mappedCount / items.length) * 100) : 0;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  }, []);

  const handleBulkAction = (action: 'accept-suggestions' | 'clear-mappings') => {
    if (action === 'accept-suggestions') {
      const updates = items
        .filter(item => item.suggestedMapping && !item.currentMapping)
        .map(item => ({ accountId: item.id, codeId: item.suggestedMapping! }));
      
      onBulkUpdate(updates);
    } else if (action === 'clear-mappings') {
      const updates = selectedItems.map(id => ({ accountId: id, codeId: '' }));
      onBulkUpdate(updates);
      setSelectedItems([]);
    }
  };

  const activeItem = activeId ? items.find(item => item.id === activeId) : null;

  return (
    <div className="space-y-4">
      {/* Header with Progress and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Mapping Interface</CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-sm text-muted-foreground">
                  {mappedCount} av {items.length} kontoer mappet
                </div>
                <Progress value={progressPercentage} className="w-32 h-2" />
                <Badge variant={progressPercentage === 100 ? "default" : "secondary"}>
                  {progressPercentage}%
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('accept-suggestions')}
                disabled={!items.some(item => item.suggestedMapping && !item.currentMapping)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Godta alle forslag
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('clear-mappings')}
                disabled={selectedItems.length === 0}
              >
                Fjern valgte mappinger
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk på kontonummer eller navn..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Drag and Drop List */}
      <Card>
        <CardContent className="p-0">
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={filteredItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y">
                {filteredItems.map((account) => (
                  <div key={account.id} className="p-4">
                    <SortableAccountItem
                      account={account}
                      internalCodes={internalCodes}
                      onUpdateMapping={onUpdateMapping}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
            
            <DragOverlay>
              {activeItem ? (
                <div className="bg-card border rounded-lg p-4 shadow-lg">
                  <AccountDisplay
                    accountNumber={activeItem.accountNumber}
                    accountName={activeItem.accountName}
                    variant="compact"
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Ingen kontoer funnet som matcher søket.
        </div>
      )}
    </div>
  );
};

export default DragDropMappingInterface;