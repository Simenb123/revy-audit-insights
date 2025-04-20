
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    workplaceCompanyName: ''
  });

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
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
          description: "Sjekk e-posten din for bekreftelseslink.",
        });
      } else {
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
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[400px]">
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

            <div className="space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
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
  );
};

export default Auth;
