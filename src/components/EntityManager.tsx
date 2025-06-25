import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface EntityManagerProps<T extends { id: string }> {
  title: string;
  useEntities: () => { data?: T[]; isLoading: boolean };
  useCreate: () => { mutateAsync: (data: any) => Promise<any> };
  useUpdate: () => { mutateAsync: (data: any) => Promise<any> };
  useDelete: () => { mutateAsync: (id: string) => Promise<any> };
  createButtonLabel?: string;
  renderCard: (item: T, handlers: { onSelect: (item: T) => void; onEdit: () => void; onDelete: () => void; selected: boolean }) => React.ReactNode;
  renderForm: (item: T | null, onSubmit: (data: any) => void) => React.ReactNode;
  renderDetails: (item: T) => React.ReactNode;
}

function EntityManager<T extends { id: string }>({
  title,
  useEntities,
  useCreate,
  useUpdate,
  useDelete,
  createButtonLabel = 'Ny',
  renderCard,
  renderForm,
  renderDetails
}: EntityManagerProps<T>) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<T | null>(null);

  const { data: items = [], isLoading } = useEntities();
  const create = useCreate();
  const update = useUpdate();
  const remove = useDelete();

  const handleCreate = async (data: any) => {
    await create.mutateAsync(data);
    setCreateOpen(false);
  };

  const handleEdit = async (data: any) => {
    if (!selected) return;
    await update.mutateAsync({ id: selected.id, ...data });
    setEditOpen(false);
    setSelected(null);
  };

  const handleDelete = async (id: string) => {
    await remove.mutateAsync(id);
    if (selected?.id === id) setSelected(null);
  };

  if (isLoading) {
    return <div>Laster {title.toLowerCase()}...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">{createButtonLabel}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opprett {title}</DialogTitle>
                </DialogHeader>
                {renderForm(null, handleCreate)}
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {items.map((item) =>
              renderCard(item, {
                onSelect: (it) => setSelected(it),
                onEdit: () => {
                  setSelected(item);
                  setEditOpen(true);
                },
                onDelete: () => handleDelete(item.id),
                selected: selected?.id === item.id
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger {title}</DialogTitle>
          </DialogHeader>
          {renderForm(selected, handleEdit)}
        </DialogContent>
      </Dialog>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>{title} Detaljer</CardTitle>
          </CardHeader>
          <CardContent>{renderDetails(selected)}</CardContent>
        </Card>
      )}
    </div>
  );
}

export default EntityManager;
