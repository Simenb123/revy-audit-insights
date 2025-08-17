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
  ArrowRightLeft, 
  Calendar, 
  Banknote, 
  Edit, 
  Trash2,
  Filter,
  Download,
  AlertCircle,
  TrendingUp,
  Globe
} from 'lucide-react';
import { useCurrencies } from '@/hooks/useCurrencies';
import ExchangeRateForm from '@/components/investments/ExchangeRateForm';
import { format, parseISO } from 'date-fns';
import { nb } from 'date-fns/locale';

export default function CurrencyManagement() {
  const { currencies, exchangeRates, loading, getYearEndRates, getLatestRate, getCurrencyByCode } = useCurrencies();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showYearEndOnly, setShowYearEndOnly] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get unique years from exchange rates
  const availableYears = useMemo(() => {
    const years = new Set(exchangeRates.map(rate => new Date(rate.rate_date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [exchangeRates]);

  // Filter exchange rates based on search and filters
  const filteredRates = useMemo(() => {
    let filtered = exchangeRates;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(rate => 
        rate.from_currency_code.toLowerCase().includes(searchLower) ||
        rate.to_currency_code.toLowerCase().includes(searchLower)
      );
    }

    // Filter by currency
    if (selectedCurrency !== 'all') {
      filtered = filtered.filter(rate => 
        rate.from_currency_code === selectedCurrency || rate.to_currency_code === selectedCurrency
      );
    }

    // Filter by year
    if (selectedYear !== 'all') {
      const year = parseInt(selectedYear);
      filtered = filtered.filter(rate => new Date(rate.rate_date).getFullYear() === year);
    }

    // Filter by year-end only
    if (showYearEndOnly) {
      filtered = filtered.filter(rate => rate.is_year_end);
    }

    return filtered;
  }, [exchangeRates, searchTerm, selectedCurrency, selectedYear, showYearEndOnly]);

  const formatCurrencyPair = (fromCode: string, toCode: string) => {
    return `${fromCode}/${toCode}`;
  };

  const formatExchangeRate = (rate: number, fromCurrency: string, toCurrency: string) => {
    const fromCurrencyData = getCurrencyByCode(fromCurrency);
    const toCurrencyData = getCurrencyByCode(toCurrency);
    
    const decimals = Math.max(
      fromCurrencyData?.decimal_places || 2,
      toCurrencyData?.decimal_places || 2,
      4
    );
    
    return rate.toLocaleString('nb-NO', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const getSourceBadge = (source: string) => {
    const sourceNames: Record<string, string> = {
      manual: 'Manuell',
      norges_bank: 'Norges Bank',
      ecb: 'ECB',
      bloomberg: 'Bloomberg',
      reuters: 'Reuters',
      xe: 'XE.com',
      other: 'Annet'
    };
    
    return (
      <Badge variant="outline" className="text-xs">
        {sourceNames[source] || source}
      </Badge>
    );
  };

  const yearEndRates = getYearEndRates();

  // Get latest rates for major currencies
  const majorCurrencies = ['USD', 'EUR', 'SEK', 'DKK', 'GBP'];
  const latestRates = majorCurrencies.map(currency => ({
    currency,
    rate: getLatestRate(currency, 'NOK'),
    currencyData: getCurrencyByCode(currency)
  })).filter(item => item.rate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Valutakurser</h1>
          <p className="text-muted-foreground">
            Administrer historiske valutakurser for omregning av utenlandske investeringer
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ny valutakurs
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrer ny valutakurs</DialogTitle>
            </DialogHeader>
            <ExchangeRateForm 
              onSuccess={() => setIsDialogOpen(false)}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Latest Rates Overview */}
      {latestRates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Siste valutakurser (mot NOK)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {latestRates.map(({ currency, rate, currencyData }) => (
                <div key={currency} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-mono font-semibold">{currency}</span>
                    </div>
                    <div>
                      <p className="font-medium">{currencyData?.currency_name || currency}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(rate.rate_date), 'dd.MM.yyyy', { locale: nb })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatExchangeRate(rate.exchange_rate, currency, 'NOK')}
                    </p>
                    <p className="text-xs text-muted-foreground">NOK</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Year-end Summary */}
      {yearEndRates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Balansedag-kurser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {yearEndRates.slice(0, 6).map((rate) => (
                <div key={rate.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {formatCurrencyPair(rate.from_currency_code, rate.to_currency_code)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(rate.rate_date), 'dd.MM.yyyy', { locale: nb })}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-semibold">
                      {formatExchangeRate(rate.exchange_rate, rate.from_currency_code, rate.to_currency_code)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {yearEndRates.length > 6 && (
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={() => setShowYearEndOnly(true)}
              >
                Vis alle {yearEndRates.length} balansedag-kurser
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
                placeholder="Søk etter valuta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Alle valutaer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle valutaer</SelectItem>
                {currencies.map((currency) => (
                  <SelectItem key={currency.currency_code} value={currency.currency_code}>
                    {currency.currency_code} - {currency.currency_name}
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

      {/* Exchange Rates List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Registrerte valutakurser</CardTitle>
          <div className="text-sm text-muted-foreground">
            {filteredRates.length} av {exchangeRates.length} kurser
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">Laster valutakurser...</p>
            </div>
          ) : filteredRates.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {exchangeRates.length === 0 ? 'Ingen valutakurser registrert' : 'Ingen resultater'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {exchangeRates.length === 0 
                  ? 'Start med å registrere historiske valutakurser for omregning av utenlandske investeringer'
                  : 'Prøv å justere søkekriteriene dine'
                }
              </p>
              {exchangeRates.length === 0 && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrer første valutakurs
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRates.map((rate) => (
                <div key={rate.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {formatCurrencyPair(rate.from_currency_code, rate.to_currency_code)}
                        </h3>
                        {rate.is_year_end && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            Balansedag
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Dato:</span>
                          <p className="font-medium">
                            {format(parseISO(rate.rate_date), 'dd.MM.yyyy', { locale: nb })}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kurs:</span>
                          <p className="font-semibold text-lg">
                            {formatExchangeRate(rate.exchange_rate, rate.from_currency_code, rate.to_currency_code)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kilde:</span>
                          <div className="mt-1">
                            {getSourceBadge(rate.source)}
                          </div>
                        </div>
                        {rate.source_reference && (
                          <div>
                            <span className="text-muted-foreground">Referanse:</span>
                            <p className="font-medium text-xs">{rate.source_reference}</p>
                          </div>
                        )}
                      </div>

                      {rate.notes && (
                        <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {rate.notes}
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
            Valutaomregning for revisjonsformål
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Balansedag-kurser:</strong> Registrer valutakurser per 31.12 for korrekt omregning 
              av utenlandske investeringer på balansedagen.
            </p>
            <p>
              <strong>Norges Bank:</strong> Bruk offisielle kurser fra Norges Bank for NOK-omregninger. 
              Disse kan lastes ned fra deres nettside og importeres.
            </p>
            <p>
              <strong>Kildehenvisning:</strong> Dokumenter alltid kilden til valutakursene for 
              etterprøvbarhet i revisjonssammenheng.
            </p>
            <p>
              <strong>Automatisk omregning:</strong> Systemet bruker disse kursene automatisk for 
              omregning av investeringer og transaksjoner i utenlandsk valuta.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}