
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Unlink, CheckCircle } from 'lucide-react';
import { useChartOfAccounts, useStandardAccounts, useAccountMappings, useCreateAccountMapping, useUpdateAccountMapping } from '@/hooks/useChartOfAccounts';

interface AccountMappingTableProps {
  clientId: string;
}

const AccountMappingTable = ({ clientId }: AccountMappingTableProps) => {
  const { data: clientAccounts = [] } = useChartOfAccounts(clientId);
  const { data: standardAccounts = [] } = useStandardAccounts();
  const { data: mappings = [] } = useAccountMappings(clientId);
  const createMapping = useCreateAccountMapping();
  const updateMapping = useUpdateAccountMapping();

  const getMappingForAccount = (accountId: string) => {
    return mappings.find(m => m.client_account_id === accountId);
  };

  const handleCreateMapping = async (clientAccountId: string, standardAccountId: string) => {
    try {
      await createMapping.mutateAsync({
        client_id: clientId,
        client_account_id: clientAccountId,
        standard_account_id: standardAccountId,
        mapping_confidence: 1.0,
        is_manual_mapping: true,
      });
    } catch (error) {
      console.error('Error creating mapping:', error);
    }
  };

  const handleUpdateMapping = async (mappingId: string, standardAccountId: string) => {
    try {
      await updateMapping.mutateAsync({
        id: mappingId,
        standard_account_id: standardAccountId,
        mapping_confidence: 1.0,
        is_manual_mapping: true,
      });
    } catch (error) {
      console.error('Error updating mapping:', error);
    }
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      asset: 'bg-blue-100 text-blue-800',
      liability: 'bg-red-100 text-red-800',
      equity: 'bg-purple-100 text-purple-800',
      revenue: 'bg-green-100 text-green-800',
      expense: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Kontomapping
        </CardTitle>
        <CardDescription>
          Map klientens kontoplan til standardkontoplan for analyse
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kontonummer</TableHead>
              <TableHead>Kontonavn</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Standardkonto</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientAccounts.map((account) => {
              const mapping = getMappingForAccount(account.id);
              return (
                <TableRow key={account.id}>
                  <TableCell className="font-mono">{account.account_number}</TableCell>
                  <TableCell>{account.account_name}</TableCell>
                  <TableCell>
                    <Badge className={getAccountTypeColor(account.account_type)}>
                      {account.account_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={mapping?.standard_account_id || ''}
                      onValueChange={(value) => {
                        if (mapping) {
                          handleUpdateMapping(mapping.id, value);
                        } else {
                          handleCreateMapping(account.id, value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Velg standardkonto" />
                      </SelectTrigger>
                      <SelectContent>
                        {standardAccounts
                          .filter(sa => sa.account_type === account.account_type)
                          .map((standardAccount) => (
                            <SelectItem key={standardAccount.id} value={standardAccount.id}>
                              {standardAccount.standard_number} - {standardAccount.standard_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {mapping ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Mappet</span>
                        {mapping.is_manual_mapping && (
                          <Badge variant="secondary" className="text-xs">
                            Manuell
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Unlink className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Ikke mappet</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AccountMappingTable;
