
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuditAction {
  id: string;
  title: string;
  description: string;
  subjectAreas: string[];
  riskLevel: 'low' | 'medium' | 'high';
  estimatedHours: number;
  isaReferences: string[];
}

const AuditActionManager = () => {
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - will be replaced with real data from knowledge articles
  const auditActions: AuditAction[] = [
    {
      id: '1',
      title: 'Inntektsføring - Salgstesting',
      description: 'Detaljert testing av salgstransaksjoner for å sikre korrekt inntektsføring',
      subjectAreas: ['inntekter'],
      riskLevel: 'high',
      estimatedHours: 8,
      isaReferences: ['ISA 315', 'ISA 330']
    },
    {
      id: '2',
      title: 'Bankavstemminger',
      description: 'Kontroll av bankavstemminger og oppfølging av avstemmingsposter',
      subjectAreas: ['banktransaksjoner'],
      riskLevel: 'medium',
      estimatedHours: 4,
      isaReferences: ['ISA 330', 'ISA 505']
    },
    {
      id: '3',
      title: 'Varelager - Fysisk kontroll',
      description: 'Fysisk telling og verdsettelse av varelager',
      subjectAreas: ['varelager'],
      riskLevel: 'high',
      estimatedHours: 12,
      isaReferences: ['ISA 501', 'ISA 315']
    }
  ];

  const subjectAreaOptions = [
    { value: 'all', label: 'Alle områder' },
    { value: 'inntekter', label: 'Inntekter/Salg' },
    { value: 'lonn', label: 'Lønn' },
    { value: 'andre-driftskostnader', label: 'Andre driftskostnader' },
    { value: 'varelager', label: 'Varelager' },
    { value: 'banktransaksjoner', label: 'Banktransaksjoner' },
    { value: 'investeringer', label: 'Investeringer/Anleggsmidler' },
    { value: 'kundefordringer', label: 'Kundefordringer' },
    { value: 'leverandorgjeld', label: 'Leverandørgjeld' },
    { value: 'egenkapital', label: 'Egenkapital' },
    { value: 'naerstaaende', label: 'Nærstående transaksjoner' }
  ];

  const riskLevelOptions = [
    { value: 'all', label: 'Alle risikonivå' },
    { value: 'high', label: 'Høy risiko' },
    { value: 'medium', label: 'Medium risiko' },
    { value: 'low', label: 'Lav risiko' }
  ];

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'high': return 'Høy risiko';
      case 'medium': return 'Medium risiko';
      case 'low': return 'Lav risiko';
      default: return level;
    }
  };

  const filteredActions = auditActions.filter(action => {
    const matchesSubjectArea = selectedSubjectArea === 'all' || 
      action.subjectAreas.includes(selectedSubjectArea);
    const matchesRiskLevel = selectedRiskLevel === 'all' || 
      action.riskLevel === selectedRiskLevel;
    const matchesSearch = searchTerm === '' || 
      action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSubjectArea && matchesRiskLevel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revisjonshandlinger</CardTitle>
              <p className="text-sm text-muted-foreground">
                Administrer og søk i revisjonshandlinger kategorisert etter fagområde
              </p>
            </div>
            <Button asChild>
              <Link to="/fag/ny-artikkel" state={{ contentType: 'revisjonshandlinger' }}>
                <Plus className="w-4 h-4 mr-2" />
                Ny revisjonshandling
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="sr-only">Søk</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Søk i revisjonshandlinger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-[200px]">
              <Label htmlFor="subject-area" className="sr-only">Fagområde</Label>
              <Select value={selectedSubjectArea} onValueChange={setSelectedSubjectArea}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Fagområde" />
                </SelectTrigger>
                <SelectContent>
                  {subjectAreaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Label htmlFor="risk-level" className="sr-only">Risikonivå</Label>
              <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Risikonivå" />
                </SelectTrigger>
                <SelectContent>
                  {riskLevelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3">
            {filteredActions.map((action) => (
              <Card key={action.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-2">{action.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {action.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getRiskLevelColor(action.riskLevel)}>
                          {getRiskLevelText(action.riskLevel)}
                        </Badge>
                        <Badge variant="outline">
                          {action.estimatedHours}t estimert
                        </Badge>
                        {action.isaReferences.map((ref) => (
                          <Badge key={ref} variant="secondary">
                            {ref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Rediger
                      </Button>
                      <Button size="sm">
                        Bruk i revisjon
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredActions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Ingen revisjonshandlinger funnet med de valgte filtrene.
              </p>
              <Button asChild className="mt-4">
                <Link to="/fag/ny-artikkel" state={{ contentType: 'revisjonshandlinger' }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Opprett første revisjonshandling
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditActionManager;
