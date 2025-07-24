import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Unlink, CheckCircle, Wand2 } from 'lucide-react';
import { useChartOfAccounts, useStandardAccounts, useAccountMappings, useCreateAccountMapping, useUpdateAccountMapping } from '@/hooks/useChartOfAccounts';
import BulkAccountMappingSuggestions from '@/components/Admin/BulkAccountMappingSuggestions';

interface AccountMappingTableProps {
  clientId: string;
}

const AccountMappingTable = ({ clientId }: AccountMappingTableProps) => {
  const [activeTab, setActiveTab] = useState('manual');
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
      logger.error('Error creating mapping:', error);
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
      logger.error('Error updating mapping:', error);
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

  const mappedCount = mappings.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Kontomapping
        </CardTitle>
        <CardDescription>
          Koble klientens kontoplan til standardkontoer for rapportgenerering
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="manual">Manuell mapping</TabsTrigger>
            <TabsTrigger value="bulk">
              <Wand2 className="h-4 w-4 mr-2" />
              Automatiske forslag
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {mappedCount} av {clientAccounts.length} kontoer mappet
              </div>
              <Badge variant={mappedCount === clientAccounts.length ? "default" : "secondary"}>
                {Math.round((mappedCount / Math.max(clientAccounts.length, 1)) * 100)}% ferdig
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kontonummer</TableHead>
                  <TableHead>Kontonavn</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Standardkonto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientAccounts.map((account) => {
                  const mapping = getMappingForAccount(account.id);
                  const mappedStandardAccount = mapping 
                    ? standardAccounts.find(sa => sa.id === mapping.standard_account_id)
                    : null;

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
                        {mapping ? (
                          <div className="space-y-1">
                            <div className="font-medium">
                              {mappedStandardAccount?.standard_number}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {mappedStandardAccount?.standard_name}
                            </div>
                            {!mapping.is_manual_mapping && (
                              <Badge variant="secondary" className="text-xs">
                                Auto ({Math.round(mapping.mapping_confidence * 100)}%)
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Select
                            onValueChange={(value) => handleCreateMapping(account.id, value)}
                          >
                            <SelectTrigger className="w-[300px]">
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
                        )}
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
                      <TableCell>
                        {mapping && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateMapping(mapping.id, '')}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="bulk">
            <BulkAccountMappingSuggestions clientId={clientId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AccountMappingTable;