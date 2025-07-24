import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import EntityManager from '@/components/common/EntityManager';
import AccountCategoryForm from './forms/AccountCategoryForm';
import { 
  useAccountCategories, 
  useCreateAccountCategory, 
  useUpdateAccountCategory, 
  useDeleteAccountCategory,
  AccountCategory 
} from '@/hooks/useAccountCategories';
import { toast } from 'sonner';

const AccountCategoriesManager = () => {
  const { data: categories = [], isLoading } = useAccountCategories();
  const createMutation = useCreateAccountCategory();
  const updateMutation = useUpdateAccountCategory();
  const deleteMutation = useDeleteAccountCategory();

  const handleCreate = async (data: any) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Kategori opprettet');
    } catch (error) {
      toast.error('Feil ved opprettelse av kategori');
      throw error;
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      await updateMutation.mutateAsync({ id, ...data });
      toast.success('Kategori oppdatert');
    } catch (error) {
      toast.error('Feil ved oppdatering av kategori');
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Kategori slettet');
    } catch (error) {
      toast.error('Feil ved sletting av kategori');
      throw error;
    }
  };

  const renderCategoryCard = (category: AccountCategory, actions: any) => (
    <Card key={category.id} className={`cursor-pointer border-2 ${
      actions.selected ? 'border-primary' : 'border-border'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{category.name}</CardTitle>
          <div className="flex items-center gap-2">
            {category.is_system_category && (
              <Badge variant="secondary">System</Badge>
            )}
            <div 
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: category.color }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">
          {category.description || 'Ingen beskrivelse'}
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={actions.edit}
            disabled={category.is_system_category}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={actions.remove}
            disabled={category.is_system_category}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <EntityManager
      items={categories}
      isLoading={isLoading}
      itemKey={(category) => category.id}
      renderItem={renderCategoryCard}
      FormComponent={AccountCategoryForm}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      header={<CardTitle>Kontokategorier</CardTitle>}
    />
  );
};

export default AccountCategoriesManager;