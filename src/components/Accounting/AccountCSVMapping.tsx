import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface MappingProps {
  headers: string[];
  sampleData: Record<string, string>[];
  onComplete: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

const fields = [
  { key: 'account_number', label: 'Kontonummer', required: true },
  { key: 'account_name', label: 'Kontonavn', required: true },
  { key: 'account_type', label: 'Kontotype', required: false },
];

export default function AccountCSVMapping({ headers, sampleData, onComplete, onCancel }: MappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const handleChange = (header: string, value: string) => {
    setMapping(prev => ({ ...prev, [header]: value }));
  };

  const getField = (fieldKey: string) => Object.keys(mapping).find(h => mapping[h] === fieldKey);
  const complete = fields.filter(f => f.required).every(f => getField(f.key));

  const handleFinish = () => {
    if (complete) onComplete(mapping);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kolonnemapping</CardTitle>
        <CardDescription>Map CSV-kolonner til kontofelter</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {headers.map(header => (
          <div key={header} className="flex items-center gap-4">
            <span className="w-1/2 font-mono text-sm">{header}</span>
            <Select value={mapping[header] || 'none'} onValueChange={val => handleChange(header, val)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Velg felt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ignorer</SelectItem>
                {fields.map(f => (
                  <SelectItem key={f.key} value={f.key}>
                    {f.label} {f.required && '*'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>Avbryt</Button>
          <Button onClick={handleFinish} disabled={!complete}>Fortsett</Button>
        </div>
      </CardContent>
    </Card>
  );
}
