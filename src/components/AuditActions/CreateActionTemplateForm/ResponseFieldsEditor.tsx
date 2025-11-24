import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { CreateActionTemplateFormData } from './schema';

interface ResponseFieldsEditorProps {
  form: UseFormReturn<CreateActionTemplateFormData>;
}

type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'checkbox_group';

interface ResponseField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

const fieldTypeLabels: Record<FieldType, string> = {
  text: 'Kort tekst',
  textarea: 'Lang tekst',
  select: 'Dropdown',
  checkbox: 'Avkrysningsboks',
  checkbox_group: 'Flere avkrysningsbokser'
};

export function ResponseFieldsEditor({ form }: ResponseFieldsEditorProps) {
  const fields = (form.watch('response_fields') || []) as ResponseField[];

  const addField = () => {
    const newField: ResponseField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'textarea',
      required: false,
      placeholder: ''
    };
    form.setValue('response_fields', [...fields, newField]);
  };

  const removeField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    form.setValue('response_fields', updated);
  };

  const updateField = (index: number, updates: Partial<ResponseField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    form.setValue('response_fields', updated);
  };

  const addOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    const options = field.options || [];
    updateField(fieldIndex, { options: [...options, ''] });
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = fields[fieldIndex];
    const options = [...(field.options || [])];
    options[optionIndex] = value;
    updateField(fieldIndex, { options });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex];
    const options = (field.options || []).filter((_, i) => i !== optionIndex);
    updateField(fieldIndex, { options });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Resultatfelter</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Definer hvilke felt revisoren skal fylle ut når handlingen utføres
          </p>
        </div>
        <Button type="button" onClick={addField} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Legg til felt
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <p>Ingen resultatfelter definert ennå.</p>
          <p className="text-sm mt-1">Klikk "Legg til felt" for å komme i gang.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field, fieldIndex) => (
            <Card key={field.id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Feltnavn *</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(fieldIndex, { label: e.target.value })}
                          placeholder="F.eks. 'Handling utført'"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value: FieldType) => updateField(fieldIndex, { type: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(fieldTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {(field.type === 'text' || field.type === 'textarea') && (
                      <div>
                        <Label className="text-sm">Plassholdertekst</Label>
                        <Input
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(fieldIndex, { placeholder: e.target.value })}
                          placeholder="F.eks. 'Beskriv hva du gjorde...'"
                          className="mt-1"
                        />
                      </div>
                    )}

                    {(field.type === 'select' || field.type === 'checkbox_group') && (
                      <div>
                        <Label className="text-sm">Alternativer</Label>
                        <div className="space-y-2 mt-2">
                          {(field.options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(fieldIndex, optionIndex, e.target.value)}
                                placeholder={`Alternativ ${optionIndex + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(fieldIndex, optionIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(fieldIndex)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Legg til alternativ
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(fieldIndex, { required: checked })}
                      />
                      <Label className="text-sm cursor-pointer">Obligatorisk felt</Label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(fieldIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
