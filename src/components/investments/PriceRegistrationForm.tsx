import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { useHistoricalPrices } from '@/hooks/useHistoricalPrices';
import { format } from 'date-fns';

interface PriceRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedSecurity?: string;
}

export default function PriceRegistrationForm({ 
  onSuccess, 
  onCancel, 
  preselectedSecurity 
}: PriceRegistrationFormProps) {
  const { securities, createPrice } = useHistoricalPrices();
  const [formData, setFormData] = useState({
    security_id: preselectedSecurity || '',
    price_date: format(new Date(), 'yyyy-MM-dd'),
    closing_price: '',
    opening_price: '',
    high_price: '',
    low_price: '',
    volume: '',
    currency_code: 'NOK',
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
  React.useEffect(() => {
    if (formData.price_date) {
      const date = new Date(formData.price_date);
      const isYearEnd = date.getMonth() === 11 && date.getDate() === 31; // December 31st
      if (isYearEnd !== formData.is_year_end) {
        setFormData(prev => ({ ...prev, is_year_end: isYearEnd }));
      }
    }
  }, [formData.price_date]);

  // Get selected security details
  const selectedSecurity = securities.find(s => s.id === formData.security_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.security_id || !formData.price_date || !formData.closing_price) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createPrice({
        security_id: formData.security_id,
        price_date: formData.price_date,
        closing_price: parseFloat(formData.closing_price),
        opening_price: formData.opening_price ? parseFloat(formData.opening_price) : undefined,
        high_price: formData.high_price ? parseFloat(formData.high_price) : undefined,
        low_price: formData.low_price ? parseFloat(formData.low_price) : undefined,
        volume: formData.volume ? parseInt(formData.volume) : undefined,
        currency_code: formData.currency_code,
        source: formData.source,
        source_reference: formData.source_reference || undefined,
        is_year_end: formData.is_year_end,
        notes: formData.notes || undefined
      });
      
      // Reset form
      setFormData({
        security_id: preselectedSecurity || '',
        price_date: format(new Date(), 'yyyy-MM-dd'),
        closing_price: '',
        opening_price: '',
        high_price: '',
        low_price: '',
        volume: '',
        currency_code: selectedSecurity?.currency_code || 'NOK',
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
      <div className="grid gap-2">
        <Label htmlFor="security">Verdipapir *</Label>
        <Select 
          value={formData.security_id} 
          onValueChange={(value) => {
            handleInputChange('security_id', value);
            const security = securities.find(s => s.id === value);
            if (security) {
              handleInputChange('currency_code', security.currency_code);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg verdipapir" />
          </SelectTrigger>
          <SelectContent>
            {securities.map((security) => (
              <SelectItem key={security.id} value={security.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{security.name}</span>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                    {security.isin_code}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedSecurity && (
          <div className="text-xs text-muted-foreground">
            {selectedSecurity.name} ({selectedSecurity.isin_code})
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="price_date">Dato *</Label>
          <div className="relative">
            <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="price_date"
              type="date"
              value={formData.price_date}
              onChange={(e) => handleInputChange('price_date', e.target.value)}
              className="pl-8"
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="currency">Valuta *</Label>
          <Select 
            value={formData.currency_code} 
            onValueChange={(value) => handleInputChange('currency_code', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NOK">NOK</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="SEK">SEK</SelectItem>
              <SelectItem value="DKK">DKK</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CHF">CHF</SelectItem>
              <SelectItem value="JPY">JPY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="closing_price">Sluttkurs *</Label>
          <div className="relative">
            <TrendingUp className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="closing_price"
              type="number"
              step="0.000001"
              value={formData.closing_price}
              onChange={(e) => handleInputChange('closing_price', e.target.value)}
              placeholder="100.50"
              className="pl-8"
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="opening_price">Åpningskurs</Label>
          <Input
            id="opening_price"
            type="number"
            step="0.000001"
            value={formData.opening_price}
            onChange={(e) => handleInputChange('opening_price', e.target.value)}
            placeholder="99.75"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="high_price">Høyeste kurs</Label>
          <Input
            id="high_price"
            type="number"
            step="0.000001"
            value={formData.high_price}
            onChange={(e) => handleInputChange('high_price', e.target.value)}
            placeholder="101.25"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="low_price">Laveste kurs</Label>
          <Input
            id="low_price"
            type="number"
            step="0.000001"
            value={formData.low_price}
            onChange={(e) => handleInputChange('low_price', e.target.value)}
            placeholder="98.50"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="volume">Volum (antall aksjer)</Label>
        <Input
          id="volume"
          type="number"
          value={formData.volume}
          onChange={(e) => handleInputChange('volume', e.target.value)}
          placeholder="1000000"
        />
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
              <SelectItem value="yahoo_finance">Yahoo Finance</SelectItem>
              <SelectItem value="bloomberg">Bloomberg</SelectItem>
              <SelectItem value="oslo_bors">Oslo Børs</SelectItem>
              <SelectItem value="nasdaq">Nasdaq</SelectItem>
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
                Denne kursen vil brukes for verdsettelse i årsoppgjøret og revisjonsformål.
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
          placeholder="Tilleggsopplysninger om kursen..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button 
          type="submit" 
          disabled={!formData.security_id || !formData.price_date || !formData.closing_price || isSubmitting}
        >
          {isSubmitting ? 'Lagrer...' : 'Lagre kurs'}
        </Button>
      </div>
    </form>
  );
}