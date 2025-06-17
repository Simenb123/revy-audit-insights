
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ContentType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

const ContentTypeManager = () => {
  const [editingType, setEditingType] = useState<ContentType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Updated with "Revisjonshandlinger" as new content type
  const [contentTypes, setContentTypes] = useState<ContentType[]>([
    { id: '1', name: 'fagartikkel', display_name: 'Fagartikkel', description: 'Generelle fagartikler og veiledninger', icon: 'file-text', color: '#3B82F6', sort_order: 1, is_active: true },
    { id: '2', name: 'lov', display_name: 'Lov', description: 'Lovtekster og juridiske dokumenter', icon: 'scale', color: '#10B981', sort_order: 2, is_active: true },
    { id: '3', name: 'isa-standard', display_name: 'ISA-standard', description: 'International Standards on Auditing', icon: 'file-code', color: '#8B5CF6', sort_order: 3, is_active: true },
    { id: '4', name: 'nrs-standard', display_name: 'NRS-standard', description: 'Norske Revisjons Standarder', icon: 'book', color: '#6366F1', sort_order: 4, is_active: true },
    { id: '5', name: 'forskrift', display_name: 'Forskrift', description: 'Forskrifter og reglementer', icon: 'gavel', color: '#F59E0B', sort_order: 5, is_active: true },
    { id: '6', name: 'forarbeider', display_name: 'Forarbeider', description: 'Forarbeider og proposisjoner', icon: 'file-text', color: '#6B7280', sort_order: 6, is_active: true },
    { id: '7', name: 'dom', display_name: 'Dom', description: 'Rettsavgjørelser og dommer', icon: 'scale', color: '#EF4444', sort_order: 7, is_active: true },
    { id: '8', name: 'revisjonshandlinger', display_name: 'Revisjonshandlinger', description: 'Praktiske revisjonshandlinger og prosedyrer', icon: 'list-checks', color: '#059669', sort_order: 8, is_active: true }
  ]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const typeData = {
      id: editingType?.id || Date.now().toString(),
      name: formData.get('name') as string,
      display_name: formData.get('display_name') as string,
      description: formData.get('description') as string || undefined,
      icon: formData.get('icon') as string || undefined,
      color: formData.get('color') as string,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      is_active: formData.get('is_active') === 'on'
    };

    if (editingType) {
      setContentTypes(prev => prev.map(type => type.id === editingType.id ? typeData : type));
      toast.success('Innholdstype oppdatert');
    } else {
      setContentTypes(prev => [...prev, typeData]);
      toast.success('Innholdstype opprettet');
    }

    setIsDialogOpen(false);
    setEditingType(null);
  };

  const handleDelete = (id: string) => {
    setContentTypes(prev => prev.filter(type => type.id !== id));
    toast.success('Innholdstype slettet');
  };

  const openDialog = (type?: ContentType) => {
    setEditingType(type || null);
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Innholdstyper</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Ny type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingType ? 'Rediger innholdstype' : 'Ny innholdstype'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Navn (teknisk)</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingType?.name || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="display_name">Visningsnavn</Label>
                  <Input
                    id="display_name"
                    name="display_name"
                    defaultValue={editingType?.display_name || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={editingType?.description || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Ikon</Label>
                  <Input
                    id="icon"
                    name="icon"
                    defaultValue={editingType?.icon || ''}
                    placeholder="file-text"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Farge</Label>
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    defaultValue={editingType?.color || '#3B82F6'}
                  />
                </div>
                <div>
                  <Label htmlFor="sort_order">Sorteringsrekkefølge</Label>
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={editingType?.sort_order || 0}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={editingType?.is_active ?? true}
                  />
                  <Label htmlFor="is_active">Aktiv</Label>
                </div>
                <Button type="submit" className="w-full">
                  {editingType ? 'Oppdater' : 'Opprett'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contentTypes.map((type) => (
            <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: type.color }}
                />
                <div>
                  <div className="font-medium">{type.display_name}</div>
                  <div className="text-sm text-muted-foreground">{type.description}</div>
                </div>
                <Badge variant={type.is_active ? 'default' : 'secondary'}>
                  {type.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDialog(type)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(type.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentTypeManager;
