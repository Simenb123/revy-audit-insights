
import React, { useState } from 'react';
import { Search, BookOpen, Plus, Upload, Settings, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';

const KnowledgeOverview = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { data: userProfile } = useUserProfile();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/fag/sok?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const canCreateContent = userProfile?.userRole === 'admin' || userProfile?.userRole === 'partner';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kunnskapsbase</h1>
          <p className="text-muted-foreground">
            Fagstoff, artikler og retningslinjer for revisjon
          </p>
        </div>
        {canCreateContent && (
          <div className="flex gap-2">
            <Link to="/fag/upload">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Last opp PDF
              </Button>
            </Link>
            <Link to="/fag/ny">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ny artikkel
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Søk i kunnskapsbasen
          </CardTitle>
          <CardDescription>
            Finn fagartikler, ISA-standarder og andre ressurser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Søk etter artikler, ISA-standarder, emner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/fag/kategori/isa-standarder">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                ISA-standarder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Internasjonale revisjonsstandarder
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/fag/kategori/generelle-fagartikler">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-500" />
                Fagartikler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Praktiske veiledninger og tips
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/fag/kategori/lover-forskrifter">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-500" />
                Lover og forskrifter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Regelverk og juridiske rammer
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* AI Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Revi - Intelligent assistent
          </CardTitle>
          <CardDescription>
            AI Revi kan svare på fagspørsmål basert på kunnskapsbasen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Når du stiller spørsmål til AI Revi, søker den automatisk gjennom alle fagartiklene 
            og gir deg svar basert på oppdatert fagstoff.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Test AI Revi
            </Button>
            {canCreateContent && (
              <Link to="/fag/admin">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Administrer
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/fag/mine">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Mine artikler</CardTitle>
              <CardDescription>
                Artikler du har skrevet eller redigert
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/fag/favoritter">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Favoritter</CardTitle>
              <CardDescription>
                Dine lagrede artikler og ressurser
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default KnowledgeOverview;
