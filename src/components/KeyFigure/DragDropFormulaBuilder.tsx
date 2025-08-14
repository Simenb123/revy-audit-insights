import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  Minus, 
  X, 
  Divide,
  Calculator,
  Wand2,
  Trash2,
  Copy,
  Eye,
  Parentheses
} from 'lucide-react';
import { useFormulaValidator } from '@/hooks/useFormulaValidator';
import { cn } from '@/lib/utils';

interface FormulaElement {
  id: string;
  type: 'account' | 'operator' | 'number' | 'parenthesis';
  value: string;
  displayValue?: string;
}

interface DragDropFormulaBuilderProps {
  formula?: string;
  onFormulaChange?: (formula: string) => void;
  availableAccounts?: Array<{ code: string; name: string }>;
  className?: string;
}

const operators = [
  { value: '+', icon: Plus, label: 'Addition' },
  { value: '-', icon: Minus, label: 'Subtraction' },
  { value: '*', icon: X, label: 'Multiplikasjon' },
  { value: '/', icon: Divide, label: 'Divisjon' },
  { value: '(', icon: Parentheses, label: 'Åpne parentes' },
  { value: ')', icon: Parentheses, label: 'Lukke parentes' }
];

function SortableFormulaElement({ 
  element, 
  onRemove 
}: { 
  element: FormulaElement; 
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getElementColor = () => {
    switch (element.type) {
      case 'account': return 'bg-primary/10 text-primary border-primary/20';
      case 'operator': return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'number': return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
      case 'parenthesis': return 'bg-muted text-muted-foreground border-muted-foreground/20';
      default: return 'bg-background text-foreground border-border';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-grab active:cursor-grabbing',
        'hover:shadow-md transition-all duration-200',
        getElementColor(),
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <span className="font-mono text-sm">
        {element.displayValue || element.value}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(element.id);
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function DragDropFormulaBuilder({
  formula = '',
  onFormulaChange,
  availableAccounts = [],
  className
}: DragDropFormulaBuilderProps) {
  const [elements, setElements] = useState<FormulaElement[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [customNumber, setCustomNumber] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  const validator = useFormulaValidator({
    allowedAccounts: availableAccounts.map(acc => acc.code)
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Parse existing formula into elements
  React.useEffect(() => {
    if (formula && elements.length === 0) {
      parseFormulaToElements(formula);
    }
  }, [formula]);

  const parseFormulaToElements = (formulaStr: string) => {
    const tokens = formulaStr.match(/(\d{3,4}|\d+\.?\d*|[+\-*/()])/g) || [];
    const newElements: FormulaElement[] = tokens.map((token, index) => {
      let type: FormulaElement['type'] = 'number';
      let displayValue = token;

      if (/^\d{3,4}$/.test(token)) {
        type = 'account';
        const account = availableAccounts.find(acc => acc.code === token);
        displayValue = account ? `${token} - ${account.name}` : token;
      } else if (['+', '-', '*', '/', '(', ')'].includes(token)) {
        type = token === '(' || token === ')' ? 'parenthesis' : 'operator';
      }

      return {
        id: `element-${index}-${Date.now()}`,
        type,
        value: token,
        displayValue
      };
    });

    setElements(newElements);
  };

  const buildFormulaString = useCallback(() => {
    return elements.map(el => el.value).join(' ');
  }, [elements]);

  // Update formula when elements change
  React.useEffect(() => {
    const formulaStr = buildFormulaString();
    onFormulaChange?.(formulaStr);
  }, [elements, buildFormulaString, onFormulaChange]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setElements((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const addElement = (element: Omit<FormulaElement, 'id'>) => {
    const newElement: FormulaElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random()}`
    };
    setElements(prev => [...prev, newElement]);
  };

  const removeElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
  };

  const addAccount = (account: { code: string; name: string }) => {
    addElement({
      type: 'account',
      value: account.code,
      displayValue: `${account.code} - ${account.name}`
    });
  };

  const addOperator = (operator: string) => {
    addElement({
      type: operator === '(' || operator === ')' ? 'parenthesis' : 'operator',
      value: operator
    });
  };

  const addCustomNumber = () => {
    if (customNumber && /^\d+\.?\d*$/.test(customNumber)) {
      addElement({
        type: 'number',
        value: customNumber
      });
      setCustomNumber('');
    }
  };

  const clearAll = () => {
    setElements([]);
  };

  const copyFormula = () => {
    const formulaStr = buildFormulaString();
    navigator.clipboard.writeText(formulaStr);
  };

  const currentFormula = buildFormulaString();
  const validation = currentFormula ? validator.validate(currentFormula) : null;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Account Palette */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Kontoer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {availableAccounts.map(account => (
              <Button
                key={account.code}
                variant="outline"
                size="sm"
                className="justify-start text-xs h-auto py-2"
                onClick={() => addAccount(account)}
              >
                <span className="font-mono">{account.code}</span>
                <span className="ml-1 truncate">{account.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operators and Numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operatorer og tall</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Operators */}
          <div className="flex flex-wrap gap-2">
            {operators.map(op => {
              const IconComponent = op.icon;
              return (
                <Button
                  key={op.value}
                  variant="outline"
                  size="sm"
                  onClick={() => addOperator(op.value)}
                  className="flex items-center gap-1"
                >
                  <IconComponent className="h-3 w-3" />
                  {op.value}
                </Button>
              );
            })}
          </div>

          {/* Custom Number Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Legg til tall..."
              value={customNumber}
              onChange={(e) => setCustomNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomNumber()}
              className="flex-1"
            />
            <Button 
              onClick={addCustomNumber}
              disabled={!customNumber || !/^\d+\.?\d*$/.test(customNumber)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formula Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Formel-bygger
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyFormula}
                disabled={elements.length === 0}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={elements.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={elements} strategy={verticalListSortingStrategy}>
              <div className="min-h-24 p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                {elements.length === 0 ? (
                  <div className="flex items-center justify-center h-16 text-muted-foreground">
                    Dra elementer hit for å bygge din formel
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {elements.map(element => (
                      <SortableFormulaElement
                        key={element.id}
                        element={element}
                        onRemove={removeElement}
                      />
                    ))}
                  </div>
                )}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeId ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 bg-background shadow-lg">
                  {elements.find(el => el.id === activeId)?.displayValue || 
                   elements.find(el => el.id === activeId)?.value}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Formula Preview */}
          {showPreview && currentFormula && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium mb-1">Formel:</div>
              <code className="text-sm font-mono">{currentFormula}</code>
            </div>
          )}

          {/* Validation Results */}
          {validation && (
            <div className="space-y-2">
              {validation.errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>
                    <strong>{error.type.toUpperCase()}:</strong> {error.message}
                  </AlertDescription>
                </Alert>
              ))}
              
              {validation.warnings.map((warning, index) => (
                <Alert key={index}>
                  <AlertDescription>
                    <strong>Advarsel:</strong> {warning}
                  </AlertDescription>
                </Alert>
              ))}

              {validation.isValid && (
                <Alert>
                  <AlertDescription className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {validation.complexity} kompleksitet
                    </Badge>
                    <span>Formelen er gyldig og klar til bruk</span>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}