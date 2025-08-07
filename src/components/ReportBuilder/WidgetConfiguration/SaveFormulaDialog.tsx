import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import { useCreateFormulaDefinition } from '@/hooks/useFormulas';
import { FormulaData } from '@/components/Admin/forms/EnhancedFormulaBuilder';
import { useToast } from '@/hooks/use-toast';

interface SaveFormulaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula: FormulaData | null;
  onSave?: (savedFormulaId: string) => void;
}

const categories = [
  { value: 'profitability', label: 'Lønnsomhet' },
  { value: 'liquidity', label: 'Likviditet' },
  { value: 'solvency', label: 'Soliditet' },
  { value: 'efficiency', label: 'Effektivitet' },
  { value: 'growth', label: 'Vekst' },
  { value: 'custom', label: 'Egendefinert' },
];

export function SaveFormulaDialog({ open, onOpenChange, formula, onSave }: SaveFormulaDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const { mutate: createFormula, isPending } = useCreateFormulaDefinition();
  const { toast } = useToast();

  const handleSave = () => {
    if (!formula || !name.trim()) {
      toast({
        title: "Feil",
        description: "Formelnavn er påkrevd",
        variant: "destructive",
      });
      return;
    }

    createFormula({
      name: name.trim(),
      formula_expression: formula,
      description: description.trim() || null,
      category: category,
      is_active: true,
      is_system_formula: false,
      version: 1,
      metadata: {},
    }, {
      onSuccess: (savedFormula) => {
        toast({
          title: "Suksess",
          description: `Formelen "${savedFormula.name}" ble lagret og er nå aktiv`,
        });
        setName('');
        setDescription('');
        setCategory('custom');
        onOpenChange(false);
        onSave?.(savedFormula.id);
      },
      onError: (error) => {
        const errorMessage = error?.message?.includes('authenticated') 
          ? "Du må være logget inn for å lagre formler"
          : "Kunne ikke lagre formelen";
          
        toast({
          title: "Feil",
          description: errorMessage,
          variant: "destructive",
        });
        console.error('Error saving formula:', error);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Lagre formel
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="formula-name">Formelnavn *</Label>
            <Input
              id="formula-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="f.eks. Bruttofortjenestegrad"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="formula-description">Beskrivelse</Label>
            <Textarea
              id="formula-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivelse av formelen..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="formula-category">Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isPending || !name.trim()}
          >
            {isPending ? 'Lagrer...' : 'Lagre formel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}