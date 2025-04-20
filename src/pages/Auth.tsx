
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuth = async (action: 'login' | 'signup') => {
    try {
      setLoading(true);
      
      const authAction = action === 'login' 
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

      const { error } = await authAction;

      if (error) throw error;

      if (action === 'signup') {
        toast({
          title: "Registrering vellykket",
          description: "Din konto er nå opprettet. Du kan nå logge inn.",
        });
      } else {
        toast({
          title: "Innlogget",
          description: "Du er nå logget inn.",
        });
        navigate('/');
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
            Logg inn eller registrer deg for å fortsette
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
