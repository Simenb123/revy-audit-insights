import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileText } from 'lucide-react';
import RichTextEditor from '@/components/Knowledge/RichTextEditor';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Client } from '@/types/revio';
import { ClientAuditAction } from '@/types/audit-actions';
import VersionHistory from './VersionHistory';

interface AIEnabledActionEditorProps {
  clientId: string;
}

const fetchAuditAction = async (clientId: string): Promise<ClientAuditAction | null> => {
    const { data, error } = await supabase
        .from('client_audit_actions')
        .select('*')
        .eq('client_id', clientId)
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching audit action:', error.message);
        if (error.code === 'PGRST116') return null; // No rows found is not an error here
        throw error;
    }
    return data;
};

const fetchClient = async (clientId: string): Promise<Client | null> => {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
    if (error) {
        console.error('Error fetching client:', error.message);
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return { 
      ...data, 
      riskAreas: [], 
      documents: [], 
      roles: [],
      announcements: []
    } as Client;
}

const AIEnabledActionEditor: React.FC<AIEnabledActionEditorProps> = ({ clientId }) => {
    const { data: action, isLoading: isLoadingAction, error: actionError } = useQuery<ClientAuditAction | null>({
        queryKey: ['auditActionDemo', clientId],
        queryFn: () => fetchAuditAction(clientId),
        enabled: !!clientId,
    });
    
    const { data: client, isLoading: isLoadingClient, error: clientError } = useQuery<Client | null>({
        queryKey: ['clientForAuditDemo', clientId],
        queryFn: () => fetchClient(clientId),
        enabled: !!clientId,
    });

    const [procedures, setProcedures] = useState('');
    const [editorKey, setEditorKey] = useState(Date.now());

    useEffect(() => {
        if (action?.procedures) {
            setProcedures(action.procedures);
        }
    }, [action]);

    const handleRestore = (content: string) => {
        setProcedures(content);
        setEditorKey(Date.now()); // Force re-render of RichTextEditor
    };

    const handleSave = () => {
        console.log("Saving procedures:", procedures);
        toast({
            title: 'Lagret (Demo)',
            description: 'Endringene dine er lagret i konsollen.',
        });
    };

    if (isLoadingAction || isLoadingClient) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    const queryError = actionError || clientError;
    if (queryError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Feil</AlertTitle>
                <AlertDescription>Kunne ikke laste data for AI-assistert redigering: {queryError.message}</AlertDescription>
            </Alert>
        );
    }

    if (!action || !client) {
        return (
            <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Ingen handling funnet</AlertTitle>
                <AlertDescription>Fant ingen revisjonshandling eller klientdata for denne klienten å demonstrere på.</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>AI-assistert redigering (Demo)</CardTitle>
                <CardDescription>
                    Her er et eksempel på hvordan du kan redigere revisjonshandlingen '{action.name}' med hjelp fra Revy.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Prosedyrer</h3>
                    <RichTextEditor
                        key={editorKey}
                        content={procedures}
                        onChange={setProcedures}
                        context="audit"
                        contextData={{ client: client, action: action as any }}
                    />
                </div>
                
                <VersionHistory client={client} action={action as any} onRestore={handleRestore} />
                
                <div className="flex justify-end">
                    <Button onClick={handleSave}>Lagre endringer (Demo)</Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default AIEnabledActionEditor;
