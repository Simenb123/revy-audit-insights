
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const ConnectionStatus = () => {
  const { connectionStatus, session, user } = useAuth();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(connectionStatus)}
          Tilkoblingsstatus
        </CardTitle>
        <CardDescription>
          Status for Supabase-tilkobling og autentisering
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Supabase konfigurert:</span>
          <Badge className={isSupabaseConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {isSupabaseConfigured ? 'Ja' : 'Nei'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Tilkoblingsstatus:</span>
          <Badge className={getStatusColor(connectionStatus)}>
            {connectionStatus === 'connected' ? 'Tilkoblet' : 
             connectionStatus === 'disconnected' ? 'Ikke tilkoblet' : 'Sjekker...'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Innlogget bruker:</span>
          <Badge className={session ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {session ? 'Ja' : 'Nei'}
          </Badge>
        </div>
        
        {user && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600">
              E-post: {user.email}
            </p>
            <p className="text-sm text-gray-600">
              Bruker ID: {user.id.substring(0, 8)}...
            </p>
          </div>
        )}
        
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500">
            Supabase URL: https://fxelhfwaoizqyecikscu.supabase.co
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
