import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

export interface FieldDefinition {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'color' | 'switch' | 'textarea' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface MutationLike {
  mutate: (data: any) => void;
  isPending?: boolean;
}

interface GenericManagerProps<T extends { id: string; [key: string]: any }> {
  title: string;
  itemLabel: string;
  items: T[];
  isLoading?: boolean;
  createMutation: MutationLike;
  updateMutation: MutationLike;
  deleteMutation: MutationLike;
  fields: FieldDefinition[];
}

function GenericManager<T extends { id: string; display_name?: string; name?: string; description?: string; color?: string; is_active?: boolean }>(
  {
    title,
    itemLabel,
    items,
    isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    fields
  }: GenericManagerProps<T>
) {
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  const openDialog = (item?: T) => {
    setEditingItem(item || null);
    setIsDialogOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: Record<string, any> = {};
    fields.forEach(field => {
      let value: any = formData.get(field.name);
      if (field.type === 'number') value = parseInt(value as string) || 0;
      if (field.type === 'switch') value = formData.get(field.name) === 'on';
      data[field.name] = value;
    });

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createMutation.mutate(data);
    }

    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (item: T) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const toggleActive = (item: T) => {
    if (item.is_active === undefined) return;
    updateMutation.mutate({ id: item.id, is_active: !item.is_active });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Laster...</div>
        </CardContent>
      </Card>
    );
  }

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
                  <DialogTitle>{editingItem ? `Rediger ${itemLabel}` : `Ny ${itemLabel}`}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {fields.map(field => (
                    <div key={field.name}>
                      <Label htmlFor={field.name}>{field.label}</Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={field.name}
                          name={field.name}
                          defaultValue={editingItem ? editingItem[field.name] ?? '' : ''}
                          placeholder={field.placeholder}
                          required={field.required}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          id={field.name}
                          name={field.name}
                          defaultValue={editingItem ? editingItem[field.name] : field.options?.[0]?.value}
                          className="border rounded px-3 py-2 w-full"
                        >
                          {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : field.type === 'switch' ? (
                        <div className="flex items-center space-x-2 mt-2">
                          <Switch id={field.name} name={field.name} defaultChecked={editingItem ? !!editingItem[field.name] : true} />
                          <Label htmlFor={field.name}>Aktiv</Label>
                        </div>
                      ) : (
                        <Input
                          id={field.name}
                          name={field.name}
                          type={field.type ?? 'text'}
                          defaultValue={editingItem ? editingItem[field.name] ?? (field.type === 'color' ? '#ffffff' : '') : ''}
                          placeholder={field.placeholder}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? 'Oppdater' : 'Opprett'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {item.color && <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />}
                  <div className={!item.is_active ? 'opacity-50' : ''}>
                    <div className="font-medium">{item.display_name || item.name}</div>
                    {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.is_active !== undefined && (
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(item)} disabled={updateMutation.isPending}>
                      {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openDialog(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} disabled={deleteMutation.isPending}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Ingen elementer opprettet ennå.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={`Slett ${itemLabel}`}
        itemName={itemToDelete?.display_name || itemToDelete?.name || ''}
        itemType={itemLabel}
      />
    </>
  );
}

export default GenericManager;
