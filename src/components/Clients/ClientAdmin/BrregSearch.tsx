
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
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
        
        {!isSearching && searchResults.length > 0 && (
          <div className="border rounded-md">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Organisasjonsnummer</th>
                  <th className="text-left p-3">Navn</th>
                  <th className="text-left p-3">Type</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((result) => (
                  <tr key={result.organisasjonsnummer} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-mono text-sm">{result.organisasjonsnummer}</td>
                    <td className="p-3">{result.navn}</td>
                    <td className="p-3">{result.organisasjonsform?.beskrivelse || 'Ukjent'}</td>
                    <td className="p-3 text-right">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => onSelectClient(result)}
                      >
                        Importer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
