import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFirmStandardAccounts } from '@/hooks/useFirmStandardAccounts';

interface AccountReference {
  accountNumber: string;
  type: 'single' | 'range';
  startNumber?: string;
  endNumber?: string;
  mappedTo?: string;
  mappedName?: string;
}

interface FormulaAccountMapperProps {
  formulaExpression: any;
  clientId?: string;
  onMappingChange?: (mappings: Record<string, string>) => void;
  mappings?: Record<string, string>;
}

export function FormulaAccountMapper({ 
  formulaExpression, 
  clientId, 
  onMappingChange,
  mappings = {} 
}: FormulaAccountMapperProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<AccountReference | null>(null);
  const { data: standardAccounts } = useFirmStandardAccounts();
  const clientAccounts: any[] = []; // TODO: Implement useClientAccounts hook

  // Extract account references from formula
  const accountReferences = useMemo(() => {
    if (!formulaExpression) return [];

    const refs: AccountReference[] = [];
    
    // Handle structured formula
    if (formulaExpression.terms) {
      formulaExpression.terms.forEach((term: any) => {
        if (term.type === 'account' && term.account) {
          const account = term.account;
          if (account.includes('-')) {
            const [start, end] = account.split('-');
            refs.push({
              accountNumber: account,
              type: 'range',
              startNumber: start,
              endNumber: end,
              mappedTo: mappings[account],
              mappedName: standardAccounts?.find((sa: any) => sa.standard_number === mappings[account])?.standard_name
            });
          } else {
            refs.push({
              accountNumber: account,
              type: 'single',
              mappedTo: mappings[account],
              mappedName: standardAccounts?.find((sa: any) => sa.standard_number === mappings[account])?.standard_name
            });
          }
        }
      });
    }
    
    // Handle string-based formula with [XX] syntax
    if (typeof formulaExpression === 'string') {
      const accountMatches = formulaExpression.match(/\[([^\]]+)\]/g) || [];
      accountMatches.forEach(match => {
        const account = match.slice(1, -1); // Remove brackets
        if (account.includes('-')) {
          const [start, end] = account.split('-');
          refs.push({
            accountNumber: account,
            type: 'range',
            startNumber: start,
            endNumber: end,
            mappedTo: mappings[account],
            mappedName: standardAccounts?.find((sa: any) => sa.standard_number === mappings[account])?.standard_name
          });
        } else {
          refs.push({
            accountNumber: account,
            type: 'single',
            mappedTo: mappings[account],
            mappedName: standardAccounts?.find((sa: any) => sa.standard_number === mappings[account])?.standard_name
          });
        }
      });
    }
    
    return refs;
  }, [formulaExpression, mappings, standardAccounts]);

  const filteredStandardAccounts = useMemo(() => {
    if (!standardAccounts) return [];
    return standardAccounts.filter((account: any) =>
      account.standard_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.standard_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [standardAccounts, searchTerm]);

  const handleMapping = (accountRef: string, standardAccountNumber: string) => {
    const newMappings = { ...mappings, [accountRef]: standardAccountNumber };
    onMappingChange?.(newMappings);
  };

  const handleRemoveMapping = (accountRef: string) => {
    const newMappings = { ...mappings };
    delete newMappings[accountRef];
    onMappingChange?.(newMappings);
  };

  const getMappingStatus = () => {
    const totalRefs = accountReferences.length;
    const mappedRefs = accountReferences.filter(ref => ref.mappedTo).length;
    return { total: totalRefs, mapped: mappedRefs };
  };

  const status = getMappingStatus();

  if (accountReferences.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Ingen kontoer funnet i formelen</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Kontomapping
            </CardTitle>
            <Badge variant={status.mapped === status.total ? "default" : "secondary"}>
              {status.mapped}/{status.total} mappet
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {accountReferences.map((ref, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {ref.type === 'range' ? 'Område' : 'Enkelt'}
                    </Badge>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {ref.accountNumber}
                    </code>
                  </div>
                  {ref.mappedTo && ref.mappedName && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      Mappet til: {ref.mappedTo} - {ref.mappedName}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {ref.mappedTo ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedAccount(ref)}
                      >
                        {ref.mappedTo ? 'Endre' : 'Mapp'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          Mapp konto {ref.accountNumber}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Søk i standardkontoer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto border rounded-lg">
                          {filteredStandardAccounts.map((account: any) => (
                            <div
                              key={account.id}
                              className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                              onClick={() => {
                                handleMapping(ref.accountNumber, account.standard_number);
                                setSearchTerm('');
                              }}
                            >
                              <div>
                                <div className="font-medium">
                                  {account.standard_number} - {account.standard_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {account.account_type} • {account.category}
                                </div>
                              </div>
                              <Button size="sm">Velg</Button>
                            </div>
                          ))}
                        </div>
                        
                        {ref.mappedTo && (
                          <div className="pt-4 border-t">
                            <Button 
                              variant="outline" 
                              onClick={() => handleRemoveMapping(ref.accountNumber)}
                              className="w-full"
                            >
                              Fjern mapping
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
          
          {clientId && clientAccounts && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Klientkontoer ({clientAccounts.length})</h4>
              <div className="text-sm text-muted-foreground">
                {clientAccounts.length > 0 
                  ? `Kontoer fra ${clientAccounts[0]?.account_number || 'ukjent'} til ${clientAccounts[clientAccounts.length - 1]?.account_number || 'ukjent'}`
                  : 'Ingen kontoer lastet for denne klienten'
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}