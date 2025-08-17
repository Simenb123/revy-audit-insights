import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useA07AccountMappings, useSaveA07AccountMapping, useDeleteA07AccountMapping } from '@/hooks/useA07AccountMappings';

interface A07AccountMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

// A07 Performance codes - these should ideally come from a database table
const A07_PERFORMANCE_CODES = [
  { code: '100', description: 'Fast lønn' },
  { code: '101', description: 'Timelønn' },
  { code: '102', description: 'Overtidslønn' },
  { code: '103', description: 'Bonus og tillegg' },
  { code: '104', description: 'Ferie- og ferietillegg' },
  { code: '105', description: 'Sykepenger fra arbeidsgiver' },
  { code: '200', description: 'Arbeidsgiveravgift' },
  { code: '201', description: 'Pensjon' },
  { code: '202', description: 'Forsikring' },
  { code: '203', description: 'Andre ytelser' },
];

export function A07AccountMappingDialog({ 
  open, 
  onOpenChange, 
  clientId 
}: A07AccountMappingDialogProps) {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedA07Code, setSelectedA07Code] = useState('');
  const [mappingDescription, setMappingDescription] = useState('');

  const { data: trialBalanceData } = useTrialBalanceData(clientId);
  const { data: mappings } = useA07AccountMappings(clientId);
  const saveMapping = useSaveA07AccountMapping();
  const deleteMapping = useDeleteA07AccountMapping();

  // Filter for salary/payroll related accounts
  const payrollAccounts = trialBalanceData?.filter(entry => {
    const accountNum = parseInt(entry.account_number);
    return (accountNum >= 5000 && accountNum < 6000) || (accountNum >= 7000 && accountNum < 8000);
  }) || [];

  const handleSaveMapping = () => {
    if (!selectedAccount || !selectedA07Code) return;

    saveMapping.mutate({
      clientId,
      accountNumber: selectedAccount,
      a07PerformanceCode: selectedA07Code,
      mappingDescription,
    }, {
      onSuccess: () => {
        setSelectedAccount('');
        setSelectedA07Code('');
        setMappingDescription('');
      }
    });
  };

  const handleDeleteMapping = (mappingId: string) => {
    deleteMapping.mutate(mappingId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>A07 Konto Mappinger</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Mapping */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">Legg til ny mapping</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="account">Kontonummer</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg konto" />
                  </SelectTrigger>
                  <SelectContent>
                    {payrollAccounts.map(account => (
                      <SelectItem key={account.account_number} value={account.account_number}>
                        {account.account_number} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="a07Code">A07 Kode</Label>
                <Select value={selectedA07Code} onValueChange={setSelectedA07Code}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg A07 kode" />
                  </SelectTrigger>
                  <SelectContent>
                    {A07_PERFORMANCE_CODES.map(code => (
                      <SelectItem key={code.code} value={code.code}>
                        {code.code} - {code.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Beskrivelse (valgfri)</Label>
                <Input
                  id="description"
                  value={mappingDescription}
                  onChange={(e) => setMappingDescription(e.target.value)}
                  placeholder="Beskrivelse av mapping"
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveMapping}
              disabled={!selectedAccount || !selectedA07Code || saveMapping.isPending}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              {saveMapping.isPending ? 'Lagrer...' : 'Legg til mapping'}
            </Button>
          </div>

          {/* Existing Mappings */}
          <div>
            <h3 className="font-medium mb-4">Eksisterende mappinger ({mappings?.length || 0})</h3>
            {mappings && mappings.length > 0 ? (
              <div className="space-y-2">
                {mappings.map(mapping => {
                  const account = payrollAccounts.find(acc => acc.account_number === mapping.account_number);
                  const a07Code = A07_PERFORMANCE_CODES.find(code => code.code === mapping.a07_performance_code);
                  
                  return (
                    <div key={mapping.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="font-mono font-medium">
                            {mapping.account_number}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {account?.account_name || 'Ukjent konto'}
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-muted-foreground text-sm">→</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Badge variant="outline" className="mb-1">
                            A07: {mapping.a07_performance_code}
                          </Badge>
                          <div className="text-sm text-muted-foreground truncate">
                            {a07Code?.description || 'Ukjent A07 kode'}
                          </div>
                        </div>
                        {mapping.mapping_description && (
                          <div className="min-w-0 flex-1 text-sm text-muted-foreground">
                            {mapping.mapping_description}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMapping(mapping.id)}
                        disabled={deleteMapping.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Ingen mappinger opprettet ennå.
                <div className="text-sm mt-1">
                  Legg til mappinger mellom kontoer og A07 koder for å aktivere kontrolloppstillingen.
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
