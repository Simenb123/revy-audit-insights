import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function InvestmentSecurities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            Lav risiko
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <Shield className="mr-1 h-3 w-3" />
            Medium risiko
          </Badge>
        );
      case 'high':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Høy risiko
          </Badge>
        );
      default:
        return null;
    }
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Registrer nytt verdipapir</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="isin">ISIN-kode</Label>
                <Input
                  id="isin"
                  placeholder="NO0010081235"
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  12 tegn: 2 bokstaver (land) + 10 alphanumeriske tegn
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Navn</Label>
                <Input
                  id="name"
                  placeholder="Equinor ASA"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type verdipapir</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Aksje</SelectItem>
                    <SelectItem value="bond">Obligasjon</SelectItem>
                    <SelectItem value="fund">Fond</SelectItem>
                    <SelectItem value="etf">ETF</SelectItem>
                    <SelectItem value="other">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="exchange">Børs</Label>
                <Input
                  id="exchange"
                  placeholder="Oslo Børs"
                />
              </div>
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
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                Lagre verdipapir
              </Button>
            </div>
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
        <CardHeader>
          <CardTitle>Registrerte verdipapirer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ingen verdipapirer registrert</h3>
            <p className="text-muted-foreground mb-4">
              Start med å registrere verdipapirer med ISIN-koder for automatisk risikoklassifisering
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrer første verdipapir
            </Button>
          </div>
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
              <h4 className="font-medium mb-2">Automatisk klassifisering basert på ISIN-landkode:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getRiskBadge('low')}
                  <span className="text-sm">Norge (NO), Sverige (SE), Danmark (DK)</span>
                </div>
                <div className="flex items-center gap-2">
                  {getRiskBadge('medium')}
                  <span className="text-sm">USA (US), Storbritannia (GB), Luxembourg (LU)</span>
                </div>
                <div className="flex items-center gap-2">
                  {getRiskBadge('high')}
                  <span className="text-sm">Bermuda (BM), Cayman Islands (KY)</span>
                </div>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Merk:</strong> Høyrisiko-investeringer krever særskilt vurdering av fritaksmetoden 
                og kan påvirke skatteplikten for utbytte og gevinster.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}