
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BrregSearchResult } from '@/types/revio';
import { supabase } from '@/integrations/supabase/client';

interface BrregSearchProps {
  onSelectClient: (result: BrregSearchResult) => void;
  isSearching: boolean;
  setIsSearching: (value: boolean) => void;
}

const BrregSearch: React.FC<BrregSearchProps> = ({ onSelectClient, isSearching, setIsSearching }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BrregSearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<BrregSearchResult | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  // Debounced search effect
  React.useEffect(() => {
    if (searchTerm.length >= 3) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500); // 500ms delay

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleSearch = async () => {
    if (searchTerm.length < 3) {
      toast({
        title: "Søkeord for kort",
        description: "Vennligst skriv inn minst 3 tegn for å søke",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('brreg', {
        body: { query: searchTerm }
      });

      if (error) {
        console.error('BRREG search error:', error);
        toast({
          title: "Søkefeil",
          description: "Kunne ikke søke i Brønnøysundregisteret. Prøv igjen senere.",
          variant: "destructive"
        });
        return;
      }

      if (data?.basis) {
        // Single result from organization number search
        const result: BrregSearchResult = {
          organisasjonsnummer: data.basis.organisasjonsnummer,
          navn: data.basis.navn,
          organisasjonsform: data.basis.organisasjonsform,
          registreringsdatoEnhetsregisteret: data.basis.registreringsdatoEnhetsregisteret,
          hjemmeside: data.basis.homepage,
          registrertIForetaksregisteret: true,
          registrertIStiftelsesregisteret: false,
          registrertIFrivillighetsregisteret: false
        };
        setSearchResults([result]);
      } else if (data?._embedded?.enheter && Array.isArray(data._embedded.enheter)) {
        // Multiple results from name search (raw Brønnøysund API response)
        const results = data._embedded.enheter.map((item: any) => ({
          organisasjonsnummer: item.organisasjonsnummer,
          navn: item.navn,
          organisasjonsform: item.organisasjonsform,
          registreringsdatoEnhetsregisteret: item.registreringsdatoEnhetsregisteret,
          hjemmeside: item.hjemmeside,
          registrertIForetaksregisteret: true,
          registrertIStiftelsesregisteret: false,
          registrertIFrivillighetsregisteret: false
        }));
        setSearchResults(results);
      } else if (data?.results && Array.isArray(data.results)) {
        // Multiple results from processed response
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
        toast({
          title: "Ingen resultater",
          description: `Ingen selskaper funnet for "${searchTerm}"`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Søkefeil",
        description: error.message || "En feil oppstod under søket",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: BrregSearchResult) => {
    setSelectedResult(result);
    setShowDetailView(true);
  };

  const handleBackToResults = () => {
    setShowDetailView(false);
    setSelectedResult(null);
  };

  const handleImportClient = () => {
    if (selectedResult) {
      onSelectClient(selectedResult);
      setShowDetailView(false);
      setSelectedResult(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Søk i Brønnøysundregisteret</CardTitle>
        <CardDescription>Finn og importer klientinformasjon fra Brønnøysundregisteret</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <Input 
              placeholder="Firmanavn eller organisasjonsnummer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSearching}
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching || searchTerm.length < 3} className="flex items-center gap-2">
            {isSearching ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            <span>{isSearching ? 'Søker...' : 'Søk'}</span>
          </Button>
        </div>
        
        {isSearching && (
          <div className="text-center py-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Søker i Brønnøysundregisteret...</p>
          </div>
        )}
        
        {showDetailView && selectedResult ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBackToResults}>
                ← Tilbake til søkeresultater
              </Button>
              <Button onClick={handleImportClient}>
                Importer klient
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Organisasjonsnummer</label>
                <Input value={selectedResult.organisasjonsnummer} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Navn</label>
                <Input value={selectedResult.navn} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Organisasjonsform</label>
                <Input value={selectedResult.organisasjonsform?.beskrivelse || 'Ukjent'} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Registreringsdato</label>
                <Input value={selectedResult.registreringsdatoEnhetsregisteret || 'Ukjent'} disabled />
              </div>
              {selectedResult.hjemmeside && (
                <div>
                  <label className="block text-sm font-medium mb-1">Hjemmeside</label>
                  <Input value={selectedResult.hjemmeside} disabled />
                </div>
              )}
            </div>
          </div>
        ) : (
          !isSearching && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div 
                  key={result.organisasjonsnummer} 
                  className="border rounded-md p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleSelectResult(result)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-medium">{result.navn}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{result.organisasjonsnummer}</p>
                      <p className="text-sm text-muted-foreground">{result.organisasjonsform?.beskrivelse || 'Ukjent'}</p>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClient(result);
                      }}
                    >
                      Importer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {!isSearching && searchTerm.length >= 3 && searchResults.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p>Ingen resultater funnet for "{searchTerm}"</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Søk med organisasjonsnummer (9 siffer) eller firmnavn (minimum 3 tegn)
      </CardFooter>
    </Card>
  );
};

export default BrregSearch;
