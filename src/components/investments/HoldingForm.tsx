import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useInvestmentSecurities } from '@/hooks/useInvestmentSecurities';
import { useCurrencies } from '@/hooks/useCurrencies';

const holdingSchema = z.object({
  security_id: z.string().min(1, 'Verdipapir er påkrevd'),
  quantity: z.number().min(0.0001, 'Antall må være større enn 0'),
  average_cost_price: z.number().optional(),
  cost_price_currency: z.string().optional(),
  acquisition_date: z.string().optional(),
  cost_basis: z.number().optional(),
  notes: z.string().optional(),
});

type HoldingFormData = z.infer<typeof holdingSchema>;

interface HoldingFormProps {
  portfolioId: string;
  onSubmit: (data: HoldingFormData & { portfolio_id: string }) => Promise<any>;
  children?: React.ReactNode;
}

export function HoldingForm({ portfolioId, onSubmit, children }: HoldingFormProps) {
  const [open, setOpen] = React.useState(false);
  const { securities } = useInvestmentSecurities();
  const { currencies } = useCurrencies();
  
  const form = useForm<HoldingFormData>({
    resolver: zodResolver(holdingSchema),
    defaultValues: {
      security_id: '',
      quantity: 0,
      average_cost_price: undefined,
      cost_price_currency: 'NOK',
      acquisition_date: '',
      cost_basis: undefined,
      notes: '',
    },
  });

  const watchQuantity = form.watch('quantity');
  const watchCostPrice = form.watch('average_cost_price');

  // Auto-calculate cost basis when quantity and cost price change
  React.useEffect(() => {
    if (watchQuantity && watchCostPrice) {
      const costBasis = watchQuantity * watchCostPrice;
      form.setValue('cost_basis', costBasis);
    }
  }, [watchQuantity, watchCostPrice, form]);

  const handleSubmit = async (data: HoldingFormData) => {
    try {
      await onSubmit({ ...data, portfolio_id: portfolioId });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error submitting holding:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Legg til beholdning
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Registrer ny beholdning</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="security_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Verdipapir</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg verdipapir" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {securities.map((security) => (
                          <SelectItem key={security.id} value={security.id}>
                            {security.name} ({security.isin_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Antall/Nominelt beløp</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.0001"
                        placeholder="F.eks. 100" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="average_cost_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gjennomsnittlig kostpris</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="F.eks. 125.50" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost_price_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kostpris valuta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg valuta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.currency_code} value={currency.currency_code}>
                            {currency.currency_code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acquisition_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anskaffelsesdato</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost_basis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total kostbasis</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="Beregnes automatisk" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notater (valgfritt)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notater om beholdningen..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Avbryt
              </Button>
              <Button type="submit">
                Registrer beholdning
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}