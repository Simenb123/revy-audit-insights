
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Plus, 
  TrendingUp, 
  Star, 
  FileText,
  Upload,
  Settings,
  Brain,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const KnowledgeOverview = () => {
  // Check if user has admin access for secret area
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const isAdmin = userProfile?.user_role === 'admin' || userProfile?.user_role === 'partner';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fagstoff</h1>
          <p className="text-muted-foreground">
            Tilgang til revisjonsartikler, standarder og veiledninger
          </p>
        </div>
        <Button asChild>
          <Link to="/fag/ny-artikkel">
            <Plus className="h-4 w-4 mr-2" />
            Ny artikkel
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Artikler</p>
                <p className="text-2xl font-bold">142</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Denne måneden</p>
                <p className="text-2xl font-bold">+12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Favoritter</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Utkast</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hurtighandlinger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto p-4">
              <Link to="/fag/sok" className="flex flex-col items-center gap-2">
                <Search className="h-6 w-6" />
                <span>Søk i fagstoff</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4">
              <Link to="/fag/favoritter" className="flex flex-col items-center gap-2">
                <Star className="h-6 w-6" />
                <span>Mine favoritter</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4">
              <Link to="/fag/upload" className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6" />
                <span>Last opp PDF</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4">
              <Link to="/fag/mine" className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>Mine artikler</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      {isAdmin && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Shield className="h-5 w-5" />
              Administrator-handlinger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto p-4">
                <Link to="/fag/admin" className="flex flex-col items-center gap-2">
                  <Settings className="h-6 w-6" />
                  <span>Admin panel</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-4 border-red-200 hover:bg-red-50">
                <Link to="/fag/hemmelig-ai-trening" className="flex flex-col items-center gap-2">
                  <Brain className="h-6 w-6 text-red-600" />
                  <div className="text-center">
                    <span className="text-red-900">🤫 AI-treningsområde</span>
                    <Badge variant="secondary" className="mt-1 bg-red-100 text-red-800">
                      Hemmelig
                    </Badge>
                  </div>
                </Link>
              </Button>
              
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-gray-50">
                <Eye className="h-6 w-6 text-gray-400" />
                <span className="text-gray-600">Flere admin-funksjoner</span>
                <Badge variant="outline">Kommer snart</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Articles */}
      <Card>
        <CardHeader>
          <CardTitle>Nylige artikler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock recent articles */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">ISA 315 - Identifisering og vurdering av risiko</h4>
                <p className="text-sm text-gray-600">Oppdatert guide for risikovurdering</p>
              </div>
              <Badge>Ny</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Vesentlighetsvurdering 2024</h4>
                <p className="text-sm text-gray-600">Nye retningslinjer for vesentlighet</p>
              </div>
              <Badge variant="outline">Oppdatert</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Digital dokumentasjon</h4>
                <p className="text-sm text-gray-600">Best practices for digitale revisjonsarkiv</p>
              </div>
              <Badge variant="secondary">Guide</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeOverview;
