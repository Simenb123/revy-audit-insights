import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [updateProfile, setUpdateProfile] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuth = async (action: 'login' | 'signup' | 'update') => {
    try {
      setLoading(true);
      
      if (action === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName
            }
          }
        });
        if (error) throw error;
        toast({
          title: "Registrering vellykket",
          description: "Din konto er nå opprettet. Du kan nå logge inn.",
        });
      } else if (action === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        if (error) throw error;
        toast({
          title: "Innlogget",
          description: "Du er nå logget inn.",
        });
        navigate('/');
      } else if (action === 'update') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.auth.updateUser({
            data: { 
              first_name: firstName, 
              last_name: lastName 
            }
          });
          
          if (error) throw error;
          
          toast({
            title: "Profil oppdatert",
            description: "Din profil er nå oppdatert med fornavn og etternavn.",
          });
          setUpdateProfile(false);
        }
      }
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Velkommen til Revio</CardTitle>
          <CardDescription className="text-center">
            {updateProfile 
              ? "Oppdater din profil" 
              : "Logg inn eller registrer deg for å fortsette"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!updateProfile ? (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Logg inn</TabsTrigger>
                <TabsTrigger value="register">Registrer</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <div className="space-y-4">
                  <Input
                    type="email"
                    placeholder="E-post"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Passord"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button 
                    className="w-full" 
                    onClick={() => handleAuth('login')}
                    disabled={loading}
                  >
                    {loading ? 'Logger inn...' : 'Logg inn'}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="register">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Fornavn"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                      placeholder="Etternavn"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="E-post"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Passord"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button 
                    className="w-full" 
                    onClick={() => handleAuth('signup')}
                    disabled={loading}
                  >
                    {loading ? 'Registrerer...' : 'Registrer'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Fornavn"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  placeholder="Etternavn"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => handleAuth('update')}
                disabled={loading}
              >
                {loading ? 'Oppdaterer...' : 'Oppdater profil'}
              </Button>
              <Button 
                variant="outline"
                className="w-full mt-2" 
                onClick={() => setUpdateProfile(false)}
              >
                Avbryt
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
