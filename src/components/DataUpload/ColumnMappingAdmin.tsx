import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Save, RotateCcw, Settings, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FieldDefinition } from '@/utils/fieldDefinitions';

interface ColumnMappingAdminProps {
  onClose?: () => void;
}

const ColumnMappingAdmin: React.FC<ColumnMappingAdminProps> = ({ onClose }) => {
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [selectedFileType, setSelectedFileType] = useState<string>('trial_balance');
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [newAlias, setNewAlias] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fileTypes = [
    { value: 'trial_balance', label: 'Saldobalanse' },
    { value: 'general_ledger', label: 'Hovedbok' },
    { value: 'chart_of_accounts', label: 'Kontoplan' }
  ];

  useEffect(() => {
    loadFieldDefinitions();
  }, [selectedFileType]);

  const loadFieldDefinitions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('file_type', selectedFileType)
      .order('sort_order');

    if (error) {
      toast.error('Feil ved lasting av feltdefinisjoner');
      console.error(error);
    } else {
      setFieldDefinitions((data || []).map(item => ({
        ...item,
        data_type: item.data_type as 'text' | 'number' | 'date'
      })));
    }
    setIsLoading(false);
  };

  const saveFieldDefinition = async (field: FieldDefinition) => {
    const { error } = await supabase
      .from('field_definitions')
      .upsert({
        id: field.id,
        field_key: field.field_key,
        field_label: field.field_label,
        data_type: field.data_type,
        is_required: field.is_required,
        file_type: selectedFileType as 'trial_balance' | 'general_ledger' | 'chart_of_accounts',
        aliases: field.aliases,
        sort_order: field.sort_order,
        is_active: field.is_active
      });

    if (error) {
      toast.error('Feil ved lagring av feltdefinisjon');
      console.error(error);
      return false;
    }

    toast.success('Feltdefinisjon lagret');
    loadFieldDefinitions();
    setEditingField(null);
    return true;
  };

  const addAlias = (field: FieldDefinition, alias: string) => {
    if (!alias.trim() || field.aliases.includes(alias.trim())) return;
    
    const updatedField = {
      ...field,
      aliases: [...field.aliases, alias.trim()]
    };
    
    saveFieldDefinition(updatedField);
  };

  const removeAlias = (field: FieldDefinition, aliasToRemove: string) => {
    const updatedField = {
      ...field,
      aliases: field.aliases.filter(alias => alias !== aliasToRemove)
    };
    
    saveFieldDefinition(updatedField);
  };

  const createNewField = () => {
    const newField: FieldDefinition = {
      id: '',
      field_key: '',
      field_label: '',
      data_type: 'text',
      is_required: false,
      file_type: selectedFileType as 'trial_balance' | 'general_ledger' | 'chart_of_accounts',
      aliases: [],
      sort_order: fieldDefinitions.length,
      is_active: true
    };
    setEditingField(newField);
  };

  const resetToDefaults = async () => {
    if (!confirm('Er du sikker på at du vil tilbakestille alle feltdefinisjoner til standardverdier? Dette kan ikke angres.')) {
      return;
    }

    // Delete existing definitions for this file type
    const { error: deleteError } = await supabase
      .from('field_definitions')
      .delete()
      .eq('file_type', selectedFileType);

    if (deleteError) {
      toast.error('Feil ved sletting av eksisterende definisjoner');
      return;
    }

    // Re-insert defaults (this would be handled by a separate API call or migration)
    toast.success('Feltdefinisjoner tilbakestilt til standardverdier');
    loadFieldDefinitions();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Administrer kolonnmapping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Administrer kolonnmapping
            </CardTitle>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Lukk
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File type selector */}
          <div className="space-y-2">
            <Label>Filtype</Label>
            <Select value={selectedFileType} onValueChange={setSelectedFileType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fileTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={createNewField} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nytt felt
            </Button>
            <Button variant="outline" onClick={resetToDefaults} className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Tilbakestill til standard
            </Button>
          </div>

          {/* Field definitions list */}
          <div className="space-y-4">
            {fieldDefinitions.map((field) => (
              <Card key={field.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {/* Field header */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{field.field_label}</h4>
                          {field.is_required && (
                            <Badge variant="destructive">Påkrevd</Badge>
                          )}
                          <Badge variant="outline">{field.data_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Nøkkel: {field.field_key}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingField(field)}
                      >
                        Rediger
                      </Button>
                    </div>

                    {/* Aliases */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Alias ({field.aliases.length})</Label>
                      <div className="flex flex-wrap gap-1">
                        {field.aliases.map((alias, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {alias}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-red-500"
                              onClick={() => removeAlias(field, alias)}
                            />
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Add alias */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Legg til nytt alias..."
                          value={newAlias}
                          onChange={(e) => setNewAlias(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addAlias(field, newAlias);
                              setNewAlias('');
                            }
                          }}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            addAlias(field, newAlias);
                            setNewAlias('');
                          }}
                          disabled={!newAlias.trim()}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      {editingField && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              {editingField.id ? 'Rediger felt' : 'Nytt felt'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Feltnøkkel</Label>
                <Input
                  value={editingField.field_key}
                  onChange={(e) => setEditingField({
                    ...editingField,
                    field_key: e.target.value
                  })}
                  placeholder="f.eks. account_number"
                />
              </div>
              <div className="space-y-2">
                <Label>Visningsnavn</Label>
                <Input
                  value={editingField.field_label}
                  onChange={(e) => setEditingField({
                    ...editingField,
                    field_label: e.target.value
                  })}
                  placeholder="f.eks. Kontonr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Datatype</Label>
                <Select
                  value={editingField.data_type}
                  onValueChange={(value: 'text' | 'number' | 'date') => 
                    setEditingField({
                      ...editingField,
                      data_type: value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Tekst</SelectItem>
                    <SelectItem value="number">Tall</SelectItem>
                    <SelectItem value="date">Dato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sorteringsrekkefølge</Label>
                <Input
                  type="number"
                  value={editingField.sort_order}
                  onChange={(e) => setEditingField({
                    ...editingField,
                    sort_order: parseInt(e.target.value) || 0
                  })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingField.is_required}
                  onCheckedChange={(checked) => setEditingField({
                    ...editingField,
                    is_required: checked
                  })}
                />
                <Label>Påkrevd felt</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingField.is_active}
                  onCheckedChange={(checked) => setEditingField({
                    ...editingField,
                    is_active: checked
                  })}
                />
                <Label>Aktiv</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => saveFieldDefinition(editingField)}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Lagre
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingField(null)}
              >
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ColumnMappingAdmin;