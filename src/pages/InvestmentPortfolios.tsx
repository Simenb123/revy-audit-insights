import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useInvestmentPortfolios } from '@/hooks/useInvestmentPortfolios';
import { PortfolioForm } from '@/components/investments/PortfolioForm';
import { HoldingForm } from '@/components/investments/HoldingForm';
import { useClients } from '@/hooks/useClients';

export default function InvestmentPortfolios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  
  const { 
    portfolios, 
    holdings, 
    loading,
    createPortfolio,
    createHolding,
    getPortfolioHoldings 
  } = useInvestmentPortfolios();
  
  const { clients } = useClients();

  const filteredPortfolios = portfolios.filter(portfolio => {
    const matchesSearch = portfolio.portfolio_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = !selectedClient || portfolio.client_id === selectedClient;
    return matchesSearch && matchesClient;
  });

  const selectedPortfolioData = selectedPortfolio 
    ? portfolios.find(p => p.id === selectedPortfolio)
    : null;

  const portfolioHoldings = selectedPortfolio 
    ? getPortfolioHoldings(selectedPortfolio)
    : [];

  const formatCurrency = (amount: number | null | undefined, currency = 'NOK') => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number | null | undefined) => {
    if (percentage === null || percentage === undefined) return 'N/A';
    return `${percentage.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Laster porteføljer...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Investeringsporteføljer</h1>
          <p className="text-muted-foreground">
            Administrer og overvåk investeringsporteføljer
          </p>
        </div>
        {selectedClient && (
          <PortfolioForm 
            clientId={selectedClient} 
            onSubmit={createPortfolio}
          />
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk etter porteføljer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Velg klient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle klienter</SelectItem>
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPortfolios.map((portfolio) => (
          <Card 
            key={portfolio.id} 
            className={`cursor-pointer transition-colors hover:bg-accent/50 ${
              selectedPortfolio === portfolio.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedPortfolio(portfolio.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{portfolio.portfolio_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {portfolio.portfolio_type}
                  </p>
                </div>
                <Badge variant="outline">{portfolio.currency_code}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Markedsverdi:</span>
                  <span className="font-medium">
                    {formatCurrency(portfolio.total_market_value, portfolio.currency_code)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avkastning:</span>
                  <div className="flex items-center">
                    {(portfolio.total_return_percentage || 0) >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      (portfolio.total_return_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(portfolio.total_return_percentage)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Beholdninger:</span>
                  <span className="text-sm">{portfolio.total_holdings || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Portfolio Details */}
      {selectedPortfolioData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Porteføljesammendrag
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Kostbasis</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedPortfolioData.total_cost_basis, selectedPortfolioData.currency_code)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Markedsverdi</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedPortfolioData.total_market_value, selectedPortfolioData.currency_code)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Urealisert gevinst/tap</p>
                  <p className={`text-lg font-semibold ${
                    (selectedPortfolioData.total_unrealized_gain_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(selectedPortfolioData.total_unrealized_gain_loss, selectedPortfolioData.currency_code)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total avkastning</p>
                  <p className={`text-lg font-semibold ${
                    (selectedPortfolioData.total_return_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(selectedPortfolioData.total_return_percentage)}
                  </p>
                </div>
              </div>
              
              <div className="pt-4">
                <HoldingForm 
                  portfolioId={selectedPortfolio} 
                  onSubmit={createHolding}
                >
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Legg til beholdning
                  </Button>
                </HoldingForm>
              </div>
            </CardContent>
          </Card>

          {/* Holdings Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Beholdninger</CardTitle>
            </CardHeader>
            <CardContent>
              {portfolioHoldings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Verdipapir</TableHead>
                      <TableHead className="text-right">Antall</TableHead>
                      <TableHead className="text-right">Kostpris</TableHead>
                      <TableHead className="text-right">Markedsverdi</TableHead>
                      <TableHead className="text-right">Avkastning</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolioHoldings.map((holding) => (
                      <TableRow key={holding.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{holding.security_name}</p>
                            <p className="text-sm text-muted-foreground">{holding.isin_code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {holding.quantity?.toLocaleString('nb-NO', { 
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 4 
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(holding.cost_basis)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(holding.market_value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            {(holding.return_percentage || 0) >= 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                            )}
                            <span className={`text-sm ${
                              (holding.return_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatPercentage(holding.return_percentage)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Ingen beholdninger registrert</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Legg til beholdninger for å se porteføljedetaljene
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* No selection state */}
      {!selectedPortfolioData && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Velg en portefølje</p>
            <p className="text-muted-foreground mb-6">
              Klikk på en portefølje ovenfor for å se detaljer og beholdninger
            </p>
            {!selectedClient && (
              <p className="text-sm text-muted-foreground">
                Velg en klient først for å opprette nye porteføljer
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}