
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertTriangle } from 'lucide-react';
import { ConnectionStatus } from '@/components/Debug/ConnectionStatus';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, connectionStatus } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    workplaceCompanyName: ''
  });

  // Check for error parameters in URL
  useEffect(() => {
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');
    
    if (errorCode === 'otp_expired' || (errorDescription && errorDescription.includes('invalid'))) {
      setShowErrorDialog(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (connectionStatus !== 'connected') {
      toast({
        title: "Tilkoblingsfeil",
        description: "Kan ikke koble til Supabase. Sjekk tilkoblingsstatusen.",
        variant: "destructive"
      });
      return;
    }
    
    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Konfigurasjonsfeil",
        description: "Supabase credentials missing",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);

    try {
      if (isSignUp) {
        if (!isSupabaseConfigured || !supabase) {
          toast({
            title: "Konfigurasjonsfeil",
            description: "Supabase credentials missing",
            variant: "destructive"
          });
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              workplace_company_name: formData.workplaceCompanyName
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Registrering vellykket",
          description: "Sjekk e-posten din for bekreftelseslink. Du kan også logge inn direkte.",
        });
        
        // Auto-switch to login view after signup
        setIsSignUp(false);
      } else {
        if (!isSupabaseConfigured || !supabase) {
          toast({
            title: "Konfigurasjonsfeil",
            description: "Supabase credentials missing",
            variant: "destructive"
          });
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4" style={{ minHeight: '100vh' }}>
      {/* Error dialog for invalid/expired email link */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lenken er ugyldig eller har utløpt</DialogTitle>
            <DialogDescription>
              E-postbekreftelseslenken har utløpt eller er ugyldig. Du kan fortsatt logge inn med dine opplysninger.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowErrorDialog(false)}>Lukk</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 w-full max-w-md">
        {/* Connection status warning */}
        {connectionStatus !== 'connected' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Tilkoblingsproblem</AlertTitle>
            <AlertDescription>
              Kan ikke koble til autentiseringsserveren. 
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal underline"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
              >
                Vis feilsøkingsinfo
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Debug info */}
        {showDebugInfo && (
          <ConnectionStatus />
        )}

        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? 'Registrer ny bruker' : 'Logg inn'}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Opprett en ny brukerkonto' 
                : 'Logg inn på din brukerkonto'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">E-post</label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">Passord</label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="firstName">Fornavn</label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="lastName">Etternavn</label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="workplaceCompanyName">Firmanavn</label>
                    <Input
                      id="workplaceCompanyName"
                      type="text"
                      value={formData.workplaceCompanyName}
                      onChange={(e) => setFormData({ ...formData, workplaceCompanyName: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              {isSignUp && (
                <Alert variant="outline" className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Viktig informasjon</AlertTitle>
                  <AlertDescription>
                    Nye brukere må godkjennes av en administrator før de får tilgang til systemet. 
                    Du vil motta en e-post når kontoen din er aktivert.
                  </AlertDescription>
                </Alert>
              )}

              {!isSignUp && (
                <Alert variant="outline" className="mt-4" style={{ transform: 'translateZ(0)' }}>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Tips</AlertTitle>
                  <AlertDescription style={{ willChange: 'auto' }}>
                    Du kan logge inn selv om du ikke har bekreftet e-posten din.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || connectionStatus !== 'connected'}
                >
                  {loading ? 'Vennligst vent...' : (isSignUp ? 'Registrer' : 'Logg inn')}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp 
                    ? 'Har du allerede en konto? Logg inn' 
                    : 'Ny bruker? Registrer deg'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Auth;
