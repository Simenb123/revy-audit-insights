import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Edit, 
  Trash2,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import { useHistoricalPrices } from '@/hooks/useHistoricalPrices';
import PriceRegistrationForm from '@/components/investments/PriceRegistrationForm';
import { format, parseISO } from 'date-fns';
import { nb } from 'date-fns/locale';

export default function InvestmentPrices() {
  const { prices, securities, loading, getYearEndPrices } = useHistoricalPrices();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecurity, setSelectedSecurity] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showYearEndOnly, setShowYearEndOnly] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get unique years from prices
  const availableYears = useMemo(() => {
    const years = new Set(prices.map(price => new Date(price.price_date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [prices]);

  // Filter prices based on search and filters
  const filteredPrices = useMemo(() => {
    let filtered = prices;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(price => {
        const security = securities.find(s => s.id === price.security_id);
        return security?.name.toLowerCase().includes(searchLower) ||
               security?.isin_code.toLowerCase().includes(searchLower);
      });
    }

    // Filter by security
    if (selectedSecurity !== 'all') {
      filtered = filtered.filter(price => price.security_id === selectedSecurity);
    }

    // Filter by year
    if (selectedYear !== 'all') {
      const year = parseInt(selectedYear);
      filtered = filtered.filter(price => new Date(price.price_date).getFullYear() === year);
    }

    // Filter by year-end only
    if (showYearEndOnly) {
      filtered = filtered.filter(price => price.is_year_end);
    }

    return filtered;
  }, [prices, securities, searchTerm, selectedSecurity, selectedYear, showYearEndOnly]);

  const getSecurityName = (securityId: string) => {
    const security = securities.find(s => s.id === securityId);
    return security ? security.name : 'Ukjent verdipapir';
  };

  const getSecurityISIN = (securityId: string) => {
    const security = securities.find(s => s.id === securityId);
    return security ? security.isin_code : '';
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString('nb-NO', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    })} ${currency}`;
  };

  const getSourceBadge = (source: string) => {
    const sourceNames: Record<string, string> = {
      manual: 'Manuell',
      yahoo_finance: 'Yahoo Finance',
      bloomberg: 'Bloomberg',
      oslo_bors: 'Oslo Børs',
      nasdaq: 'Nasdaq',
      other: 'Annet'
    };
    
    return (
      <Badge variant="outline" className="text-xs">
        {sourceNames[source] || source}
      </Badge>
    );
  };

  const yearEndPrices = getYearEndPrices();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historiske kurser</h1>
          <p className="text-muted-foreground">
            Registrer og administrer kurser for verdsettelse på balansedag
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ny kurs
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrer ny kurs</DialogTitle>
            </DialogHeader>
            <PriceRegistrationForm 
              onSuccess={() => setIsDialogOpen(false)}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Year-end Summary */}
      {yearEndPrices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Balansedag-kurser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {yearEndPrices.slice(0, 6).map((price) => (
                <div key={price.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{getSecurityName(price.security_id)}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {getSecurityISIN(price.security_id)}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-semibold">
                      {formatPrice(price.closing_price, price.currency_code)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(price.price_date), 'dd.MM.yyyy', { locale: nb })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {yearEndPrices.length > 6 && (
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={() => setShowYearEndOnly(true)}
              >
                Vis alle {yearEndPrices.length} balansedag-kurser
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter verdipapir..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={selectedSecurity} onValueChange={setSelectedSecurity}>
              <SelectTrigger>
                <SelectValue placeholder="Alle verdipapirer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle verdipapirer</SelectItem>
                {securities.map((security) => (
                  <SelectItem key={security.id} value={security.id}>
                    {security.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Alle år" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle år</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant={showYearEndOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowYearEndOnly(!showYearEndOnly)}
                className="flex-1"
              >
                <Filter className="mr-2 h-4 w-4" />
                {showYearEndOnly ? 'Vis alle' : 'Kun balansedag'}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prices List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Registrerte kurser</CardTitle>
          <div className="text-sm text-muted-foreground">
            {filteredPrices.length} av {prices.length} kurser
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">Laster kurser...</p>
            </div>
          ) : filteredPrices.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {prices.length === 0 ? 'Ingen kurser registrert' : 'Ingen resultater'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {prices.length === 0 
                  ? 'Start med å registrere historiske kurser for dine verdipapirer'
                  : 'Prøv å justere søkekriteriene dine'
                }
              </p>
              {prices.length === 0 && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrer første kurs
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrices.map((price) => (
                <div key={price.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {getSecurityName(price.security_id)}
                        </h3>
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {getSecurityISIN(price.security_id)}
                        </code>
                        {price.is_year_end && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            Balansedag
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Dato:</span>
                          <p className="font-medium">
                            {format(parseISO(price.price_date), 'dd.MM.yyyy', { locale: nb })}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sluttkurs:</span>
                          <p className="font-semibold text-lg">
                            {formatPrice(price.closing_price, price.currency_code)}
                          </p>
                        </div>
                        {price.opening_price && (
                          <div>
                            <span className="text-muted-foreground">Åpning:</span>
                            <p className="font-medium">
                              {formatPrice(price.opening_price, price.currency_code)}
                            </p>
                          </div>
                        )}
                        {price.volume && (
                          <div>
                            <span className="text-muted-foreground">Volum:</span>
                            <p className="font-medium">
                              {price.volume.toLocaleString('nb-NO')}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        {getSourceBadge(price.source)}
                        {price.source_reference && (
                          <span className="text-xs text-muted-foreground">
                            Ref: {price.source_reference}
                          </span>
                        )}
                      </div>

                      {price.notes && (
                        <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {price.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Revisjonsformål
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Balansedag-kurser:</strong> Marker kurser per 31.12 som balansedag-kurser. 
              Disse brukes for verdsettelse i årsoppgjøret og er spesielt viktige for revisjonsformål.
            </p>
            <p>
              <strong>Kurskilder:</strong> Dokumenter alltid kilden til kursinformasjonen. 
              Dette er viktig for etterprøvbarhet i revisjonssammenheng.
            </p>
            <p>
              <strong>Valutakurser:</strong> Husk å ta hensyn til valutakurser ved verdsettelse 
              av utenlandske verdipapirer på balansedagen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}