import { useAuth } from './AuthProvider';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, isLoading, connectionStatus } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();

  if (isLoading || connectionStatus === 'checking' || profileLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (connectionStatus === 'disconnected' || !session) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user profile exists but is not active (pending approval)
  if (userProfile && !userProfile.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Clock className="h-12 w-12 text-orange-500" />
            </div>
            <CardTitle>Venter på godkjenning</CardTitle>
            <CardDescription>
              Din konto venter på godkjenning fra en administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Du har registrert deg successfully, men din konto må godkjennes av en administrator før du kan få tilgang til systemet.
            </p>
            <p className="text-sm text-muted-foreground">
              Du vil motta en e-post når kontoen din er aktivert.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => session && supabase.auth.signOut()}
                className="text-sm text-primary hover:underline"
              >
                Logg ut og prøv en annen konto
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;