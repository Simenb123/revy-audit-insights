import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useBudgetManagement } from '@/hooks/useBudgetManagement';
import { toast } from 'sonner';

interface BudgetFormProps {
  clientId: string;
  budget?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

interface BudgetFormData {
  budget_name: string;
  budget_year: number;
  budget_type: 'operating' | 'capital' | 'cash_flow' | 'master';
  start_date: string;
  end_date: string;
  currency_code: string;
  notes: string;
}

export function BudgetForm({ clientId, budget, onCancel, onSuccess }: BudgetFormProps) {
  const { createBudget, updateBudget, isCreating, isUpdating } = useBudgetManagement(clientId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BudgetFormData>({
    defaultValues: {
      budget_name: budget?.budget_name || '',
      budget_year: budget?.budget_year || new Date().getFullYear(),
      budget_type: budget?.budget_type || 'operating',
      start_date: budget?.start_date || `${new Date().getFullYear()}-01-01`,
      end_date: budget?.end_date || `${new Date().getFullYear()}-12-31`,
      currency_code: budget?.currency_code || 'NOK',
      notes: budget?.notes || ''
    }
  });

  const budgetYear = watch('budget_year');

  // Auto-update start and end dates when year changes
  const handleYearChange = (year: number) => {
    setValue('budget_year', year);
    setValue('start_date', `${year}-01-01`);
    setValue('end_date', `${year}-12-31`);
  };

  const onSubmit = async (data: BudgetFormData) => {
    setIsSubmitting(true);
    try {
      if (budget) {
        updateBudget({ ...data, id: budget.id });
      } else {
        createBudget(data);
      }
      
      toast.success(budget ? 'Budsjett oppdatert' : 'Budsjett opprettet');
      onSuccess();
    } catch (error) {
      toast.error('Det oppstod en feil');
      console.error('Budget form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isCreating || isUpdating || isSubmitting;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {budget ? 'Rediger budsjett' : 'Nytt budsjett'}
          </h1>
          <p className="text-muted-foreground">
            {budget ? 'Oppdater budsjettdetaljer' : 'Opprett et nytt budsjett for klienten'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Grunnleggende informasjon</CardTitle>
            <CardDescription>
              Fyll ut de grunnleggende detaljene for budsjettet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_name">Budsjettnavn *</Label>
                <Input
                  id="budget_name"
                  {...register('budget_name', { required: 'Budsjettnavn er påkrevd' })}
                  placeholder="f.eks. Årsbudsjett 2024"
                />
                {errors.budget_name && (
                  <p className="text-sm text-red-600">{errors.budget_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget_year">Budsjettår *</Label>
                <Input
                  id="budget_year"
                  type="number"
                  {...register('budget_year', { 
                    required: 'Budsjettår er påkrevd',
                    min: { value: 2020, message: 'År må være 2020 eller senere' },
                    max: { value: 2030, message: 'År kan ikke være etter 2030' },
                    onChange: (e) => handleYearChange(parseInt(e.target.value))
                  })}
                  min="2020"
                  max="2030"
                />
                {errors.budget_year && (
                  <p className="text-sm text-red-600">{errors.budget_year.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Budsjetttype *</Label>
                <Select 
                  defaultValue={budget?.budget_type || 'operating'}
                  onValueChange={(value) => setValue('budget_type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operating">Driftsbudsjett</SelectItem>
                    <SelectItem value="capital">Investeringsbudsjett</SelectItem>
                    <SelectItem value="cash_flow">Kontantstrømbudsjett</SelectItem>
                    <SelectItem value="master">Hovedbudsjett</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valuta</Label>
                <Select 
                  defaultValue={budget?.currency_code || 'NOK'}
                  onValueChange={(value) => setValue('currency_code', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOK">NOK - Norske kroner</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="SEK">SEK - Svenske kroner</SelectItem>
                    <SelectItem value="DKK">DKK - Danske kroner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Startdato *</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date', { required: 'Startdato er påkrevd' })}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-600">{errors.start_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Sluttdato *</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register('end_date', { required: 'Sluttdato er påkrevd' })}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-600">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notater</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Tilleggsnotater om budsjettet..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Avbryt
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Lagrer...' : budget ? 'Oppdater budsjett' : 'Opprett budsjett'}
          </Button>
        </div>
      </form>
    </div>
  );
}