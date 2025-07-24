import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface EntityManagerProps<T> {
  items: T[];
  isLoading?: boolean;
  itemKey: (item: T) => string;
  renderItem: (item: T, actions: { select: () => void; edit: () => void; remove: () => void; selected: boolean }) => React.ReactNode;
  FormComponent: React.ComponentType<{ defaultValues?: T | null; onSubmit: (data: any) => void }>;
  onCreate: (data: any) => Promise<void>;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  header?: React.ReactNode;
  footer?: (item: T) => React.ReactNode;
}

function EntityManager<T>({
  items,
  isLoading,
  itemKey,
  renderItem,
  FormComponent,
  onCreate,
  onUpdate,
  onDelete,
  header,
  footer
}: EntityManagerProps<T>) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const handleCreate = async (data: any) => {
    await onCreate(data);
    setCreateDialogOpen(false);
  };

  const handleEdit = async (data: any) => {
    if (!selectedItem) return;
    await onUpdate(itemKey(selectedItem), data);
    setEditDialogOpen(false);
    setSelectedItem(null);
  };

  const handleCreateDialogChange = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      // Ensure selected item is cleared when create dialog closes
      setSelectedItem(null);
    }
  };

  const handleEditDialogChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      // Clear selected item when edit dialog closes to prevent state persistence
      setSelectedItem(null);
    }
  };

  const handleDelete = async (item: T) => {
    await onDelete(itemKey(item));
  };

  if (isLoading) {
    return <div>Laster...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            {header ?? <CardTitle>Liste</CardTitle>}
            <Dialog open={createDialogOpen} onOpenChange={handleCreateDialogChange}>
              <DialogTrigger asChild>
                <Button className="gap-2">Ny</Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto" draggable aria-describedby="create-dialog-description">
                <DialogHeader>
                  <DialogTitle>Opprett</DialogTitle>
                  <div id="create-dialog-description" className="sr-only">
                    Opprett ny enhet
                  </div>
                </DialogHeader>
                <FormComponent defaultValues={null} onSubmit={handleCreate} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {items.map((item) =>
              renderItem(item, {
                select: () => setSelectedItem(item),
                edit: () => {
                  setSelectedItem(item);
                  setEditDialogOpen(true);
                },
                remove: () => handleDelete(item),
                selected: selectedItem ? itemKey(selectedItem) === itemKey(item) : false,
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto" draggable aria-describedby="edit-dialog-description">
          <DialogHeader>
            <DialogTitle>Rediger</DialogTitle>
            <div id="edit-dialog-description" className="sr-only">
              Rediger eksisterende enhet
            </div>
          </DialogHeader>
          <FormComponent defaultValues={selectedItem} onSubmit={handleEdit} />
        </DialogContent>
      </Dialog>

      {selectedItem && footer && (
        <Card>
          <CardHeader>
            <CardTitle>Detaljer</CardTitle>
          </CardHeader>
          <CardContent>{footer(selectedItem)}</CardContent>
        </Card>
      )}
    </div>
  );
}

export default EntityManager;
