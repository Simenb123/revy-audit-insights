import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Shield, Info } from 'lucide-react';
import { validateISIN, getRiskLevelFromISIN, formatISIN } from '@/utils/isinValidation';
import { useInvestmentSecurities } from '@/hooks/useInvestmentSecurities';

interface SecurityRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SecurityRegistrationForm({ onSuccess, onCancel }: SecurityRegistrationFormProps) {
  const { createSecurity, getRiskClassificationForCountry } = useInvestmentSecurities();
  const [formData, setFormData] = useState({
    isin_code: '',
    name: '',
    security_type: '',
    exchange: '',
    currency_code: 'NOK',
    sector: ''
  });
  const [isinValidation, setIsinValidation] = useState<{ isValid: boolean; error?: string; countryCode?: string }>({ isValid: false });
  const [riskLevel, setRiskLevel] = useState<string>('unknown');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate ISIN when it changes
  useEffect(() => {
    if (formData.isin_code.length >= 3) {
      const validation = validateISIN(formData.isin_code);
      setIsinValidation(validation);
      
      if (validation.isValid && validation.countryCode) {
        const risk = getRiskLevelFromISIN(formData.isin_code);
        setRiskLevel(risk);
      } else {
        setRiskLevel('unknown');
      }
    } else {
      setIsinValidation({ isValid: false });
      setRiskLevel('unknown');
    }
  }, [formData.isin_code]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'isin_code' ? value.toUpperCase().replace(/\s/g, '') : value
    }));
  };

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
            <Info className="mr-1 h-3 w-3" />
            Ukjent risiko
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isinValidation.isValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createSecurity({
        ...formData,
        country_code: isinValidation.countryCode
      });
      
      // Reset form
      setFormData({
        isin_code: '',
        name: '',
        security_type: '',
        exchange: '',
        currency_code: 'NOK',
        sector: ''
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
        <Label htmlFor="isin">ISIN-kode *</Label>
        <Input
          id="isin"
          value={formData.isin_code}
          onChange={(e) => handleInputChange('isin_code', e.target.value)}
          placeholder="NO0010081235"
          className="uppercase font-mono"
          maxLength={12}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            12 tegn: 2 bokstaver (land) + 10 alphanumeriske tegn
          </p>
          {formData.isin_code && (
            <div className="text-xs font-mono text-muted-foreground">
              {formatISIN(formData.isin_code)}
            </div>
          )}
        </div>
        
        {/* ISIN Validation Status */}
        {formData.isin_code.length > 0 && (
          <div className="space-y-2">
            {!isinValidation.isValid && isinValidation.error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {isinValidation.error}
              </div>
            )}
            
            {isinValidation.isValid && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle className="h-4 w-4" />
                  Gyldig ISIN ({isinValidation.countryCode})
                </div>
                {getRiskBadge(riskLevel)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">Navn *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Equinor ASA"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="type">Type verdipapir *</Label>
        <Select value={formData.security_type} onValueChange={(value) => handleInputChange('security_type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Velg type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stock">Aksje</SelectItem>
            <SelectItem value="bond">Obligasjon</SelectItem>
            <SelectItem value="fund">Fond</SelectItem>
            <SelectItem value="etf">ETF</SelectItem>
            <SelectItem value="reit">REIT</SelectItem>
            <SelectItem value="warrant">Warrant</SelectItem>
            <SelectItem value="other">Annet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="exchange">Børs</Label>
        <Input
          id="exchange"
          value={formData.exchange}
          onChange={(e) => handleInputChange('exchange', e.target.value)}
          placeholder="Oslo Børs"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="currency">Valuta *</Label>
        <Select value={formData.currency_code} onValueChange={(value) => handleInputChange('currency_code', value)}>
          <SelectTrigger>
            <SelectValue placeholder="NOK" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NOK">NOK - Norske kroner</SelectItem>
            <SelectItem value="USD">USD - US Dollar</SelectItem>
            <SelectItem value="EUR">EUR - Euro</SelectItem>
            <SelectItem value="SEK">SEK - Svenska kronor</SelectItem>
            <SelectItem value="DKK">DKK - Danske kroner</SelectItem>
            <SelectItem value="GBP">GBP - Britiske pund</SelectItem>
            <SelectItem value="CHF">CHF - Sveitsiske franc</SelectItem>
            <SelectItem value="JPY">JPY - Japanske yen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="sector">Sektor</Label>
        <Input
          id="sector"
          value={formData.sector}
          onChange={(e) => handleInputChange('sector', e.target.value)}
          placeholder="Energi, Teknologi, Finans..."
        />
      </div>

      {/* Risk Classification Info */}
      {riskLevel === 'high' && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Høyrisiko-verdipapir</p>
              <p className="text-muted-foreground">
                Dette verdipapiret er registrert i en jurisdiksjon som kan være utenfor fritaksmetoden. 
                Krever særskilt vurdering for skatteplikt på utbytte og gevinster.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button 
          type="submit" 
          disabled={!isinValidation.isValid || !formData.name || !formData.security_type || isSubmitting}
        >
          {isSubmitting ? 'Lagrer...' : 'Lagre verdipapir'}
        </Button>
      </div>
    </form>
  );
}