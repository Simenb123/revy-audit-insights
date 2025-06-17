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

interface SubjectArea {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

const SubjectAreaManager = () => {
  const [editingArea, setEditingArea] = useState<SubjectArea | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Expanded with specific audit areas for revisjonshandlinger
  const [subjectAreas, setSubjectAreas] = useState<SubjectArea[]>([
    // Original general areas
    { id: '1', name: 'revisjon', display_name: 'Revisjon', description: 'Generell revisjonsteori og metodikk', icon: 'shield-check', color: '#3B82F6', sort_order: 1, is_active: true },
    { id: '2', name: 'regnskap', display_name: 'Regnskap', description: 'Regnskapsstandarder og regnskapsregler', icon: 'calculator', color: '#10B981', sort_order: 2, is_active: true },
    { id: '3', name: 'skatt', display_name: 'Skatt', description: 'Skattelover, regler og veiledning', icon: 'coins', color: '#F59E0B', sort_order: 3, is_active: true },
    
    // Specific audit areas for revisjonshandlinger
    { id: '5', name: 'inntekter', display_name: 'Inntekter/Salg', description: 'Revisjonshandlinger for inntektsføring og salg', icon: 'trending-up', color: '#059669', sort_order: 5, is_active: true },
    { id: '6', name: 'lonn', display_name: 'Lønn', description: 'Revisjonshandlinger for lønn og personalutgifter', icon: 'users', color: '#7C3AED', sort_order: 6, is_active: true },
    { id: '7', name: 'andre-driftskostnader', display_name: 'Andre driftskostnader', description: 'Revisjonshandlinger for øvrige driftskostnader', icon: 'receipt', color: '#DC2626', sort_order: 7, is_active: true },
    { id: '8', name: 'varelager', display_name: 'Varelager', description: 'Revisjonshandlinger for varelager og lagerføring', icon: 'package', color: '#EA580C', sort_order: 8, is_active: true },
    { id: '9', name: 'banktransaksjoner', display_name: 'Banktransaksjoner', description: 'Revisjonshandlinger for bank og kontanter', icon: 'banknote', color: '#0891B2', sort_order: 9, is_active: true },
    { id: '10', name: 'investeringer', display_name: 'Investeringer/Anleggsmidler', description: 'Revisjonshandlinger for anleggsmidler og investeringer', icon: 'building', color: '#9333EA', sort_order: 10, is_active: true },
    { id: '11', name: 'kundefordringer', display_name: 'Kundefordringer', description: 'Revisjonshandlinger for kundefordringer og nedskrivninger', icon: 'user-check', color: '#16A34A', sort_order: 11, is_active: true },
    { id: '12', name: 'leverandorgjeld', display_name: 'Leverandørgjeld', description: 'Revisjonshandlinger for leverandørgjeld og påløpte kostnader', icon: 'credit-card', color: '#DB2777', sort_order: 12, is_active: true },
    { id: '13', name: 'egenkapital', display_name: 'Egenkapital', description: 'Revisjonshandlinger for egenkapital og utbytte', icon: 'pie-chart', color: '#7C2D12', sort_order: 13, is_active: true },
    { id: '14', name: 'naerstaaende', display_name: 'Nærstående transaksjoner', description: 'Revisjonshandlinger for nærstående parter og transaksjoner', icon: 'link', color: '#BE185D', sort_order: 14, is_active: true },
    
    // Keep general "annet" category
    { id: '4', name: 'annet', display_name: 'Annet', description: 'Øvrige fagområder og tverrgående temaer', icon: 'folder', color: '#6B7280', sort_order: 15, is_active: true }
  ]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const areaData = {
      id: editingArea?.id || Date.now().toString(),
      name: formData.get('name') as string,
      display_name: formData.get('display_name') as string,
      description: formData.get('description') as string || undefined,
      icon: formData.get('icon') as string || undefined,
      color: formData.get('color') as string,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      is_active: formData.get('is_active') === 'on'
    };

    if (editingArea) {
      setSubjectAreas(prev => prev.map(area => area.id === editingArea.id ? areaData : area));
      toast.success('Emneområde oppdatert');
    } else {
      setSubjectAreas(prev => [...prev, areaData]);
      toast.success('Emneområde opprettet');
    }

    setIsDialogOpen(false);
    setEditingArea(null);
  };

  const handleDelete = (id: string) => {
    setSubjectAreas(prev => prev.filter(area => area.id !== id));
    toast.success('Emneområde slettet');
  };

  const openDialog = (area?: SubjectArea) => {
    setEditingArea(area || null);
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Emneområder</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Nytt emne
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingArea ? 'Rediger emneområde' : 'Nytt emneområde'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Navn (teknisk)</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingArea?.name || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="display_name">Visningsnavn</Label>
                  <Input
                    id="display_name"
                    name="display_name"
                    defaultValue={editingArea?.display_name || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={editingArea?.description || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Ikon</Label>
                  <Input
                    id="icon"
                    name="icon"
                    defaultValue={editingArea?.icon || ''}
                    placeholder="shield-check"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Farge</Label>
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    defaultValue={editingArea?.color || '#10B981'}
                  />
                </div>
                <div>
                  <Label htmlFor="sort_order">Sorteringsrekkefølge</Label>
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={editingArea?.sort_order || 0}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={editingArea?.is_active ?? true}
                  />
                  <Label htmlFor="is_active">Aktiv</Label>
                </div>
                <Button type="submit" className="w-full">
                  {editingArea ? 'Oppdater' : 'Opprett'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {subjectAreas.map((area) => (
            <div key={area.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: area.color }}
                />
                <div>
                  <div className="font-medium">{area.display_name}</div>
                  <div className="text-sm text-muted-foreground">{area.description}</div>
                </div>
                <Badge variant={area.is_active ? 'default' : 'secondary'}>
                  {area.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDialog(area)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(area.id)}
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

export default SubjectAreaManager;
