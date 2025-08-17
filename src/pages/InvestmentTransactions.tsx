import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function InvestmentTransactions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'dividend':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'buy':
        return <Badge className="bg-green-100 text-green-800">Kjøp</Badge>;
      case 'sell':
        return <Badge className="bg-red-100 text-red-800">Salg</Badge>;
      case 'dividend':
        return <Badge className="bg-blue-100 text-blue-800">Utbytte</Badge>;
      case 'split':
        return <Badge className="bg-purple-100 text-purple-800">Split</Badge>;
      case 'merger':
        return <Badge className="bg-orange-100 text-orange-800">Fusjon</Badge>;
      default:
        return <Badge variant="secondary">Annet</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investeringstransaksjoner</h1>
          <p className="text-muted-foreground">
            Registrer kjøp, salg, utbytte og andre transaksjoner
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ny transaksjon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Registrer ny transaksjon</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="security">Verdipapir</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg verdipapir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-securities">Ingen verdipapirer registrert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Transaksjonstype</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Kjøp</SelectItem>
                    <SelectItem value="sell">Salg</SelectItem>
                    <SelectItem value="dividend">Utbytte</SelectItem>
                    <SelectItem value="split">Aksjesplit</SelectItem>
                    <SelectItem value="merger">Fusjon</SelectItem>
                    <SelectItem value="other">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date">Transaksjonsdato</Label>
                <Input
                  id="date"
                  type="date"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Antall</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.000001"
                    placeholder="100.000000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Pris per enhet</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="125.50"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="total">Total beløp</Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  placeholder="12550.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="currency">Valuta</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="NOK" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOK">NOK</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="SEK">SEK</SelectItem>
                      <SelectItem value="DKK">DKK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="exchange-rate">Valutakurs</Label>
                  <Input
                    id="exchange-rate"
                    type="number"
                    step="0.0001"
                    placeholder="1.0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="fees">Gebyr</Label>
                  <Input
                    id="fees"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tax">Kildeskatt</Label>
                  <Input
                    id="tax"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="voucher">Bilagsreferanse</Label>
                <Input
                  id="voucher"
                  placeholder="B001, F123, etc."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notater</Label>
                <Textarea
                  id="notes"
                  placeholder="Tilleggsinfo om transaksjonen..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                Lagre transaksjon
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale kjøp</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Ingen transaksjoner
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale salg</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Ingen transaksjoner
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utbytte mottatt</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Ingen utbytter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Antall transaksjoner</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              I år
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaksjonshistorikk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ingen transaksjoner registrert</h3>
            <p className="text-muted-foreground mb-4">
              Start med å registrere investeringstransaksjoner for å bygge opp porteføljen
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrer første transaksjon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FIFO Info */}
      <Card>
        <CardHeader>
          <CardTitle>FIFO-beregning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Først inn, først ut (FIFO)</strong> brukes for å beregne gevinst/tap ved salg.
            </p>
            <p className="text-sm text-muted-foreground">
              Automatisk beregning vil være tilgjengelig når transaksjoner er registrert.
              Alle kjøp og salg registreres kronologisk for korrekt kostprisberegning.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}