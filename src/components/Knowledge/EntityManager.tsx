import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { Plus } from 'lucide-react';

export interface EntityManagerProps<T> {
  title: string;
  items: T[];
  isLoading?: boolean;
  onSubmit: (formData: FormData, editingItem: T | null) => void;
  onDelete: (item: T) => void;
  renderFormFields: (item: T | null) => React.ReactNode;
  renderItem: (item: T, actions: { onEdit: () => void; onDelete: () => void }) => React.ReactNode;
  itemTypeLabel: string;
  getItemName: (item: T) => string;
}

const EntityManager = <T,>({
  title,
  items,
  isLoading,
  onSubmit,
  onDelete,
  renderFormFields,
  renderItem,
  itemTypeLabel,
  getItemName,
}: EntityManagerProps<T>) => {
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit(formData, editingItem);
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const openDialog = (item?: T) => {
    setEditingItem(item || null);
    setIsDialogOpen(true);
  };

  const handleDelete = (item: T) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ny
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? `Rediger ${itemTypeLabel}` : `Ny ${itemTypeLabel}`}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {renderFormFields(editingItem)}
                  <Button type="submit" className="w-full">
                    {editingItem ? 'Oppdater' : 'Opprett'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Laster...</div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx}>{renderItem(item, { onEdit: () => openDialog(item), onDelete: () => handleDelete(item) })}</div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Ingen {itemTypeLabel} opprettet ennå.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={`Slett ${itemTypeLabel}`}
        itemName={itemToDelete ? getItemName(itemToDelete) : ''}
        itemType={itemTypeLabel}
      />
    </>
  );
};

export default EntityManager;
