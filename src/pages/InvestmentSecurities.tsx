import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Shield, AlertTriangle, CheckCircle, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { useInvestmentSecurities } from '@/hooks/useInvestmentSecurities';
import SecurityRegistrationForm from '@/components/investments/SecurityRegistrationForm';
import { formatISIN, getRiskLevelFromISIN } from '@/utils/isinValidation';
import { format } from 'date-fns';

export default function InvestmentSecurities() {
  const { securities, countryRisks, loading, getRiskClassificationForCountry } = useInvestmentSecurities();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter securities based on search term
  const filteredSecurities = useMemo(() => {
    if (!searchTerm.trim()) return securities;
    
    const searchLower = searchTerm.toLowerCase();
    return securities.filter(security => 
      security.isin_code.toLowerCase().includes(searchLower) ||
      security.name.toLowerCase().includes(searchLower) ||
      security.exchange?.toLowerCase().includes(searchLower) ||
      security.sector?.toLowerCase().includes(searchLower)
    );
  }, [securities, searchTerm]);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return (
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            <CheckCircle className="mr-1 h-3 w-3" />
            Lav risiko
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            <Shield className="mr-1 h-3 w-3" />
            Medium risiko
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Høy risiko
          </Badge>
        );
      case 'unknown':
        return (
          <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">
            Ukjent risiko
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSecurityTypeName = (type: string) => {
    const types: Record<string, string> = {
      stock: 'Aksje',
      bond: 'Obligasjon',
      fund: 'Fond',
      etf: 'ETF',
      reit: 'REIT',
      warrant: 'Warrant',
      other: 'Annet'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verdipapirer</h1>
          <p className="text-muted-foreground">
            Global database med ISIN-koder og risikoklassifisering
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nytt verdipapir
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrer nytt verdipapir</DialogTitle>
            </DialogHeader>
            <SecurityRegistrationForm 
              onSuccess={() => setIsDialogOpen(false)}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter ISIN, navn eller børs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Securities List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Registrerte verdipapirer</CardTitle>
          <div className="text-sm text-muted-foreground">
            {filteredSecurities.length} av {securities.length} verdipapirer
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">Laster verdipapirer...</p>
            </div>
          ) : filteredSecurities.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {securities.length === 0 ? 'Ingen verdipapirer registrert' : 'Ingen resultater'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {securities.length === 0 
                  ? 'Start med å registrere verdipapirer med ISIN-koder for automatisk risikoklassifisering'
                  : 'Prøv å justere søkekriteriene dine'
                }
              </p>
              {securities.length === 0 && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrer første verdipapir
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSecurities.map((security) => {
                const riskLevel = getRiskLevelFromISIN(security.isin_code);
                const countryRisk = security.country_code 
                  ? getRiskClassificationForCountry(security.country_code)
                  : null;
                
                return (
                  <div key={security.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground truncate">{security.name}</h3>
                          {getRiskBadge(riskLevel)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">ISIN:</span>
                            <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                              {formatISIN(security.isin_code)}
                            </code>
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {getSecurityTypeName(security.security_type)}
                          </div>
                          <div>
                            <span className="font-medium">Valuta:</span> {security.currency_code}
                          </div>
                          {security.exchange && (
                            <div>
                              <span className="font-medium">Børs:</span> {security.exchange}
                            </div>
                          )}
                          {security.sector && (
                            <div className="col-span-2">
                              <span className="font-medium">Sektor:</span> {security.sector}
                            </div>
                          )}
                          {countryRisk && (
                            <div className="col-span-2">
                              <span className="font-medium">Land:</span> {countryRisk.country_name} ({security.country_code})
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2 text-xs text-muted-foreground">
                          Opprettet {format(new Date(security.created_at), 'dd.MM.yyyy')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {riskLevel === 'high' && (
                      <div className="mt-3 bg-destructive/5 border border-destructive/20 rounded p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-destructive">Høyrisiko-verdipapir</p>
                            <p className="text-muted-foreground">
                              Krever særskilt vurdering av fritaksmetoden for skatteplikt på utbytte og gevinster.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Classification Info */}
      <Card>
        <CardHeader>
          <CardTitle>Risikoklassifisering fritaksmetoden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Automatisk klassifisering basert på ISIN-landkode:</h4>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRiskBadge('low')}
                    <div>
                      <p className="font-medium">Nordiske land</p>
                      <p className="text-sm text-muted-foreground">Norge, Sverige, Danmark, Finland, Island</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {securities.filter(s => s.country_code && ['NO', 'SE', 'DK', 'FI', 'IS'].includes(s.country_code)).length} verdipapirer
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRiskBadge('medium')}
                    <div>
                      <p className="font-medium">Etablerte markeder</p>
                      <p className="text-sm text-muted-foreground">USA, Storbritannia, Tyskland, Luxembourg m.fl.</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {securities.filter(s => s.country_code && ['US', 'GB', 'DE', 'LU', 'FR', 'NL', 'CH', 'CA', 'AU', 'JP'].includes(s.country_code)).length} verdipapirer
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRiskBadge('high')}
                    <div>
                      <p className="font-medium">Høyrisiko-jurisdiksjoner</p>
                      <p className="text-sm text-muted-foreground">Bermuda, Cayman Islands, Jersey m.fl.</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {securities.filter(s => s.country_code && ['BM', 'KY', 'JE', 'GG', 'IM', 'VG', 'BS', 'BB', 'PA', 'MC', 'LI', 'AD', 'MT', 'CY'].includes(s.country_code)).length} verdipapirer
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Viktig informasjon</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Høyrisiko-investeringer krever særskilt vurdering av fritaksmetoden og kan påvirke 
                    skatteplikten for utbytte og gevinster. Kontakt skatterådgiver ved usikkerhet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}