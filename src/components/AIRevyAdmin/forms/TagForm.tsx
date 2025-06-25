import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';

const tagSchema = z.object({
  name: z.string().min(1),
  display_name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().min(1),
  category: z.string().optional(),
  sort_order: z.number().optional().default(0),
  is_active: z.boolean().default(true),
});

export type TagFormData = z.infer<typeof tagSchema>;

interface TagFormProps {
  defaultValues?: Partial<TagFormData>;
  onSubmit: (data: TagFormData) => void;
}

const TagForm = ({ defaultValues, onSubmit }: TagFormProps) => {
  const form = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      display_name: '',
      description: '',
      color: '#6B7280',
      category: '',
      sort_order: 0,
      is_active: true,
      ...defaultValues,
    }
  });

  const handleSubmit = (data: TagFormData) => {
    onSubmit(data);
  };

  const colorOptions = [
    { value: '#3B82F6', label: 'Blå' },
    { value: '#EF4444', label: 'Rød' },
    { value: '#10B981', label: 'Grønn' },
    { value: '#F59E0B', label: 'Gul' },
    { value: '#8B5CF6', label: 'Lilla' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#6B7280', label: 'Grå' }
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>System navn</FormLabel>
                <FormControl>
                  <Input placeholder="f.eks. isa-200" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visningsnavn</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
              <FormLabel>Beskrivelse</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="isa-standard">ISA Standard</SelectItem>
                    <SelectItem value="risk-level">Risikonivå</SelectItem>
                    <SelectItem value="audit-phase">Revisjonsfase</SelectItem>
                    <SelectItem value="content-type">Innholdstype</SelectItem>
                    <SelectItem value="subject-area">Emneområde</SelectItem>
                    <SelectItem value="custom">Tilpasset</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Farge</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sortering</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
              </FormControl>
              <Label>Aktiv</Label>
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit">{defaultValues ? 'Oppdater' : 'Opprett'}</Button>
        </div>
      </form>
    </Form>
  );
};

export default TagForm;
