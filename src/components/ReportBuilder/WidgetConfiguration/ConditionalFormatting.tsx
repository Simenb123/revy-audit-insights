import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Zap } from 'lucide-react';

interface ConditionalRule {
  id: string;
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
  value: string | number;
  style: {
    color?: string;
    backgroundColor?: string;
    fontWeight?: string;
    icon?: string;
  };
}

interface ConditionalFormattingProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

export function ConditionalFormatting({ config, onChange }: ConditionalFormattingProps) {
  const [newRule, setNewRule] = useState<Partial<ConditionalRule>>({
    field: '',
    operator: 'gt',
    value: '',
    style: {}
  });

  const rules = config.conditionalRules || [];

  const operatorLabels = {
    gt: 'Større enn',
    lt: 'Mindre enn', 
    eq: 'Lik',
    gte: 'Større enn eller lik',
    lte: 'Mindre enn eller lik',
    contains: 'Inneholder'
  };

  const addRule = () => {
    if (!newRule.field || !newRule.value) return;

    const rule: ConditionalRule = {
      id: `rule_${Date.now()}`,
      field: newRule.field!,
      operator: newRule.operator!,
      value: newRule.value!,
      style: newRule.style || {}
    };

    onChange({
      ...config,
      conditionalRules: [...rules, rule]
    });

    setNewRule({
      field: '',
      operator: 'gt',
      value: '',
      style: {}
    });
  };

  const removeRule = (ruleId: string) => {
    onChange({
      ...config,
      conditionalRules: rules.filter((r: ConditionalRule) => r.id !== ruleId)
    });
  };

  const updateNewRuleStyle = (styleUpdates: Record<string, any>) => {
    setNewRule(prev => ({
      ...prev,
      style: { ...prev.style, ...styleUpdates }
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">Betinget formatering</Label>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Definer regler for å endre utseende basert på dataverdier
      </p>

      {/* Existing Rules */}
      {rules.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Aktive regler</Label>
          {rules.map((rule: ConditionalRule) => (
            <Card key={rule.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {rule.field}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {operatorLabels[rule.operator]}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {rule.value}
                  </Badge>
                  {rule.style.color && (
                    <div 
                      className="w-3 h-3 rounded-full border" 
                      style={{ backgroundColor: rule.style.color }}
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRule(rule.id)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Rule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Legg til ny regel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Condition */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Felt</Label>
              <Input
                placeholder="value"
                value={newRule.field || ''}
                onChange={(e) => setNewRule(prev => ({ ...prev, field: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Operator</Label>
              <Select
                value={newRule.operator || 'gt'}
                onValueChange={(value) => setNewRule(prev => ({ ...prev, operator: value as any }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(operatorLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Verdi</Label>
              <Input
                placeholder="100"
                value={newRule.value || ''}
                onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Style Options */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Styling ved match</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tekstfarge</Label>
                <Select
                  value={newRule.style?.color || ''}
                  onValueChange={(value) => updateNewRuleStyle({ color: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Velg farge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Standard</SelectItem>
                    <SelectItem value="hsl(var(--primary))">Primær</SelectItem>
                    <SelectItem value="hsl(var(--destructive))">Rød</SelectItem>
                    <SelectItem value="hsl(120, 100%, 40%)">Grønn</SelectItem>
                    <SelectItem value="hsl(45, 100%, 50%)">Gul</SelectItem>
                    <SelectItem value="hsl(220, 100%, 50%)">Blå</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Bakgrunnsfarge</Label>
                <Select
                  value={newRule.style?.backgroundColor || ''}
                  onValueChange={(value) => updateNewRuleStyle({ backgroundColor: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Velg farge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Standard</SelectItem>
                    <SelectItem value="hsl(var(--primary) / 0.1)">Primær (lett)</SelectItem>
                    <SelectItem value="hsl(var(--destructive) / 0.1)">Rød (lett)</SelectItem>
                    <SelectItem value="hsl(120, 100%, 95%)">Grønn (lett)</SelectItem>
                    <SelectItem value="hsl(45, 100%, 95%)">Gul (lett)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Font-vekt</Label>
              <Select
                value={newRule.style?.fontWeight || ''}
                onValueChange={(value) => updateNewRuleStyle({ fontWeight: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Velg vekt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Standard</SelectItem>
                  <SelectItem value="font-medium">Medium</SelectItem>
                  <SelectItem value="font-semibold">Halvfet</SelectItem>
                  <SelectItem value="font-bold">Fet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={addRule} 
            size="sm" 
            className="w-full"
            disabled={!newRule.field || !newRule.value}
          >
            <Plus className="h-4 w-4 mr-2" />
            Legg til regel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
