import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClientCustomFields, useClientShareholders } from '@/hooks/useExtendedClientData';
import ClientShareholdersTab from './ClientShareholdersTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ClientExtendedDemoProps {
  clientId: string;
}

const ClientExtendedDemo: React.FC<ClientExtendedDemoProps> = ({ clientId }) => {
  const { data: customFields = [] } = useClientCustomFields();
  const { data: shareholders = [] } = useClientShareholders(clientId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Utvidet klientinformasjon</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fields" className="w-full">
            <TabsList>
              <TabsTrigger value="fields">Tilpassede felt</TabsTrigger>
              <TabsTrigger value="shareholders">Aksjonærer</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fields" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.length > 0 ? (
                  customFields.map((field) => (
                    <div key={field.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{field.field_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Type: <Badge variant="outline">{field.field_type}</Badge>
                      </p>
                      {field.field_options && (
                        <div className="flex gap-1 mt-2">
                          {field.field_options.map((option, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {option}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-2">Ingen tilpassede felt konfigurert</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="shareholders">
              <ClientShareholdersTab clientId={clientId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientExtendedDemo;