
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BrregSearchResult } from '@/types/revio';

interface BrregSearchProps {
  onSelectClient: (result: BrregSearchResult) => void;
  isSearching: boolean;
  setIsSearching: (value: boolean) => void;
}

// Mock Brønnøysundregisteret API resultat
const mockBrregResults: BrregSearchResult[] = [
  {
    organisasjonsnummer: '912345678',
    navn: 'NORDHEIM AS',
    organisasjonsform: {
      kode: 'AS',
      beskrivelse: 'Aksjeselskap'
    },
    registreringsdatoEnhetsregisteret: '2010-05-10T00:00:00.000Z',
    hjemmeside: 'www.nordheim.no',
    registrertIForetaksregisteret: true,
    registrertIStiftelsesregisteret: false,
    registrertIFrivillighetsregisteret: false
  },
  {
    organisasjonsnummer: '945678901',
    navn: 'NORDHEIM EIENDOM AS',
    organisasjonsform: {
      kode: 'AS',
      beskrivelse: 'Aksjeselskap'
    },
    registreringsdatoEnhetsregisteret: '2015-06-20T00:00:00.000Z',
    registrertIForetaksregisteret: true,
    registrertIStiftelsesregisteret: false,
    registrertIFrivillighetsregisteret: false
  }
];

const BrregSearch: React.FC<BrregSearchProps> = ({ onSelectClient, isSearching, setIsSearching }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BrregSearchResult[]>([]);

  const handleSearch = () => {
    if (searchTerm.length < 3) {
      toast({
        title: "Søkeord for kort",
        description: "Vennligst skriv inn minst 3 tegn for å søke",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);

    // I en ekte app ville dette være en API-kall til Brønnøysundregisteret
    // For nå simulerer vi en API-respons med timeout
    setTimeout(() => {
      setSearchResults(mockBrregResults);
      setIsSearching(false);
    }, 1000);
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
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching} className="flex items-center gap-2">
            <Search size={18} />
            <span>Søk</span>
          </Button>
        </div>
        
        {isSearching ? (
          <div className="text-center py-6">Søker...</div>
        ) : (
          searchResults.length > 0 && (
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
                      <td className="p-3">{result.organisasjonsnummer}</td>
                      <td className="p-3">{result.navn}</td>
                      <td className="p-3">{result.organisasjonsform.beskrivelse}</td>
                      <td className="p-3 text-right">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => onSelectClient(result)}
                        >
                          Velg
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        I en fullverdig løsning vil dette være en direkteintegrasjon mot Brønnøysundregisteret API.
      </CardFooter>
    </Card>
  );
};

export default BrregSearch;
