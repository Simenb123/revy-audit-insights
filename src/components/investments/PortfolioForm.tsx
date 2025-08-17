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
import { useCurrencies } from '@/hooks/useCurrencies';

const portfolioSchema = z.object({
  portfolio_name: z.string().min(1, 'Porteføljenavn er påkrevd'),
  portfolio_type: z.string().min(1, 'Porteføljetype er påkrevd'),
  currency_code: z.string().min(1, 'Valuta er påkrevd'),
  description: z.string().optional(),
});

type PortfolioFormData = z.infer<typeof portfolioSchema>;

interface PortfolioFormProps {
  clientId: string;
  onSubmit: (data: PortfolioFormData & { client_id: string }) => Promise<any>;
  children?: React.ReactNode;
}

const portfolioTypes = [
  { value: 'general', label: 'Generell portefølje' },
  { value: 'pension', label: 'Pensjonsportefølje' },
  { value: 'insurance', label: 'Forsikringsportefølje' },
  { value: 'segregated', label: 'Segregert portefølje' },
  { value: 'mutual_fund', label: 'Verdipapirfond' },
  { value: 'alternative', label: 'Alternative investeringer' },
];

export function PortfolioForm({ clientId, onSubmit, children }: PortfolioFormProps) {
  const [open, setOpen] = React.useState(false);
  const { currencies } = useCurrencies();
  
  const form = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      portfolio_name: '',
      portfolio_type: 'general',
      currency_code: 'NOK',
      description: '',
    },
  });

  const handleSubmit = async (data: PortfolioFormData) => {
    try {
      await onSubmit({ ...data, client_id: clientId });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error submitting portfolio:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ny portefølje
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Opprett ny portefølje</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="portfolio_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porteføljenavn</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="F.eks. Hovedportefølje" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portfolio_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porteføljetype</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {portfolioTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="currency_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hovedvaluta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg valuta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.currency_code} value={currency.currency_code}>
                            {currency.currency_code} - {currency.currency_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivelse (valgfritt)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Beskriv porteføljens formål og strategi..."
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
                Opprett portefølje
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}