import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRightLeft, AlertCircle, Banknote } from 'lucide-react';
import { useCurrencies } from '@/hooks/useCurrencies';
import { format } from 'date-fns';

interface ExchangeRateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedCurrency?: string;
}

export default function ExchangeRateForm({ 
  onSuccess, 
  onCancel, 
  preselectedCurrency 
}: ExchangeRateFormProps) {
  const { currencies, createExchangeRate, getBaseCurrency } = useCurrencies();
  const baseCurrency = getBaseCurrency();
  
  const [formData, setFormData] = useState({
    from_currency_code: preselectedCurrency || '',
    to_currency_code: baseCurrency?.currency_code || 'NOK',
    rate_date: format(new Date(), 'yyyy-MM-dd'),
    exchange_rate: '',
    source: 'manual',
    source_reference: '',
    is_year_end: false,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-detect year-end when date changes
  useEffect(() => {
    if (formData.rate_date) {
      const date = new Date(formData.rate_date);
      const isYearEnd = date.getMonth() === 11 && date.getDate() === 31; // December 31st
      if (isYearEnd !== formData.is_year_end) {
        setFormData(prev => ({ ...prev, is_year_end: isYearEnd }));
      }
    }
  }, [formData.rate_date]);

  // Get currency details
  const fromCurrency = currencies.find(c => c.currency_code === formData.from_currency_code);
  const toCurrency = currencies.find(c => c.currency_code === formData.to_currency_code);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.from_currency_code || !formData.rate_date || !formData.exchange_rate) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createExchangeRate({
        from_currency_code: formData.from_currency_code,
        to_currency_code: formData.to_currency_code,
        rate_date: formData.rate_date,
        exchange_rate: parseFloat(formData.exchange_rate),
        source: formData.source,
        source_reference: formData.source_reference || undefined,
        is_year_end: formData.is_year_end,
        notes: formData.notes || undefined
      });
      
      // Reset form
      setFormData({
        from_currency_code: preselectedCurrency || '',
        to_currency_code: baseCurrency?.currency_code || 'NOK',
        rate_date: format(new Date(), 'yyyy-MM-dd'),
        exchange_rate: '',
        source: 'manual',
        source_reference: '',
        is_year_end: false,
        notes: ''
      });
      
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="from_currency">Fra valuta *</Label>
          <Select 
            value={formData.from_currency_code} 
            onValueChange={(value) => handleInputChange('from_currency_code', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg valuta" />
            </SelectTrigger>
            <SelectContent>
              {currencies
                .filter(c => c.currency_code !== formData.to_currency_code)
                .map((currency) => (
                <SelectItem key={currency.currency_code} value={currency.currency_code}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-1 rounded">
                      {currency.currency_code}
                    </span>
                    <span>{currency.currency_name}</span>
                    {currency.symbol && (
                      <span className="text-muted-foreground">({currency.symbol})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="to_currency">Til valuta *</Label>
          <Select 
            value={formData.to_currency_code} 
            onValueChange={(value) => handleInputChange('to_currency_code', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies
                .filter(c => c.currency_code !== formData.from_currency_code)
                .map((currency) => (
                <SelectItem key={currency.currency_code} value={currency.currency_code}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-1 rounded">
                      {currency.currency_code}
                    </span>
                    <span>{currency.currency_name}</span>
                    {currency.symbol && (
                      <span className="text-muted-foreground">({currency.symbol})</span>
                    )}
                    {currency.is_base_currency && (
                      <Badge variant="secondary" className="text-xs">Base</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {fromCurrency && toCurrency && (
        <div className="flex items-center justify-center p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">{fromCurrency.symbol || fromCurrency.currency_code}</span>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{toCurrency.symbol || toCurrency.currency_code}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="rate_date">Dato *</Label>
          <div className="relative">
            <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="rate_date"
              type="date"
              value={formData.rate_date}
              onChange={(e) => handleInputChange('rate_date', e.target.value)}
              className="pl-8"
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="exchange_rate">Valutakurs *</Label>
          <div className="relative">
            <Banknote className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="exchange_rate"
              type="number"
              step="0.00000001"
              value={formData.exchange_rate}
              onChange={(e) => handleInputChange('exchange_rate', e.target.value)}
              placeholder="10.5000"
              className="pl-8"
              required
            />
          </div>
          {fromCurrency && toCurrency && formData.exchange_rate && (
            <p className="text-xs text-muted-foreground">
              1 {fromCurrency.currency_code} = {formData.exchange_rate} {toCurrency.currency_code}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="source">Kilde *</Label>
          <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manuell registrering</SelectItem>
              <SelectItem value="norges_bank">Norges Bank</SelectItem>
              <SelectItem value="ecb">Europeiske sentralbank</SelectItem>
              <SelectItem value="bloomberg">Bloomberg</SelectItem>
              <SelectItem value="reuters">Reuters</SelectItem>
              <SelectItem value="xe">XE.com</SelectItem>
              <SelectItem value="other">Annet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="source_reference">Referanse</Label>
          <Input
            id="source_reference"
            value={formData.source_reference}
            onChange={(e) => handleInputChange('source_reference', e.target.value)}
            placeholder="URL, dokument-ID etc."
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_year_end"
          checked={formData.is_year_end}
          onCheckedChange={(checked) => handleInputChange('is_year_end', checked === true)}
        />
        <Label htmlFor="is_year_end" className="flex items-center gap-2">
          Balansedag (31.12)
          {formData.is_year_end && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Årsavslutning
            </Badge>
          )}
        </Label>
      </div>

      {formData.is_year_end && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary">Balansedag-kurs</p>
              <p className="text-muted-foreground">
                Denne kursen vil brukes for omregning av utenlandske investeringer på balansedagen.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="notes">Notater</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Tilleggsopplysninger om valutakursen..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button 
          type="submit" 
          disabled={!formData.from_currency_code || !formData.rate_date || !formData.exchange_rate || isSubmitting}
        >
          {isSubmitting ? 'Lagrer...' : 'Lagre valutakurs'}
        </Button>
      </div>
    </form>
  );
}