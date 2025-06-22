import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Palette,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

const SubjectAreaManager = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  // Mock data - replace with actual data from hooks
  const subjectAreas = [
    {
      id: '1',
      name: 'sales',
      display_name: 'Inntekter/Salg',
      description: 'Alle aspekter ved salgsinntekter og inntektsføring',
      icon: '💰',
      color: '#10B981',
      sort_order: 1,
      is_active: true
    },
    {
      id: '2',
      name: 'inventory',
      display_name: 'Varelager',
      description: 'Lagerføring, verdisetting og fysisk kontroll',
      icon: '📦',
      color: '#3B82F6',
      sort_order: 2,
      is_active: true
    },
    {
      id: '3',
      name: 'payroll',
      display_name: 'Lønn og personal',
      description: 'Lønn, personalfrynsegoder og pensjon',
      icon: '👥',
      color: '#8B5CF6',
      sort_order: 3,
      is_active: true
    },
    {
      id: '4',
      name: 'banking',
      display_name: 'Bank og kontanter',
      description: 'Bankavstemming og kontanthåndtering',
      icon: '🏦',
      color: '#F59E0B',
      sort_order: 4,
      is_active: true
    },
    {
      id: '5',
      name: 'fixed_assets',
      display_name: 'Anleggsmidler',
      description: 'Varige driftsmidler og immaterielle eiendeler',
      icon: '🏭',
      color: '#EF4444',
      sort_order: 5,
      is_active: false
    }
  ];

  const colorOptions = [
    { value: '#10B981', label: 'Grønn', color: '#10B981' },
    { value: '#3B82F6', label: 'Blå', color: '#3B82F6' },
    { value: '#8B5CF6', label: 'Lilla', color: '#8B5CF6' },
    { value: '#F59E0B', label: 'Gul', color: '#F59E0B' },
    { value: '#EF4444', label: 'Rød', color: '#EF4444' },
    { value: '#6B7280', label: 'Grå', color: '#6B7280' }
  ];

  const iconOptions = [
    '💰', '📦', '👥', '🏦', '🏭', '📊', '🔍', '📋', '💼', '⚖️'
  ];

  const handleCreateArea = (formData) => {
    console.log('Creating subject area:', formData);
    toast.success('Emneområde opprettet');
    setCreateDialogOpen(false);
  };

  const handleEditArea = (formData) => {
    console.log('Editing subject area:', formData);
    toast.success('Emneområde oppdatert');
    setEditDialogOpen(false);
  };

  const handleDeleteArea = (areaId) => {
    console.log('Deleting subject area:', areaId);
    toast.success('Emneområde slettet');
  };

  const handleToggleActive = (areaId) => {
    console.log('Toggling active status:', areaId);
    toast.success('Status oppdatert');
  };

  const handleMoveArea = (areaId, direction) => {
    console.log('Moving area:', areaId, direction);
    toast.success('Emneområde flyttet');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Emneområde Administrasjon
            </span>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nytt Emneområde
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opprett Emneområde</DialogTitle>
                </DialogHeader>
                <SubjectAreaForm onSubmit={handleCreateArea} colorOptions={colorOptions} iconOptions={iconOptions} />
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Emneområder</h3>
              <Badge variant="outline">
                {subjectAreas.filter(a => a.is_active).length} aktive
              </Badge>
            </div>

            <div className="grid gap-4">
              {subjectAreas.map((area) => (
                <SubjectAreaCard 
                  key={area.id} 
                  area={area} 
                  onSelect={setSelectedArea}
                  onEdit={() => {
                    setSelectedArea(area);
                    setEditDialogOpen(true);
                  }}
                  onDelete={() => handleDeleteArea(area.id)}
                  onToggleActive={() => handleToggleActive(area.id)}
                  onMove={handleMoveArea}
                  selected={selectedArea?.id === area.id}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger Emneområde</DialogTitle>
          </DialogHeader>
          <SubjectAreaForm 
            area={selectedArea} 
            onSubmit={handleEditArea} 
            colorOptions={colorOptions}
            iconOptions={iconOptions}
          />
        </DialogContent>
      </Dialog>

      {/* Area Details */}
      {selectedArea && (
        <Card>
          <CardHeader>
            <CardTitle>Emneområde Detaljer</CardTitle>
          </CardHeader>
          <CardContent>
            <SubjectAreaDetails area={selectedArea} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const SubjectAreaCard = ({ area, onSelect, onEdit, onDelete, onToggleActive, onMove, selected }) => {
  return (
    <Card className={`cursor-pointer transition-colors hover:bg-accent/50 ${selected ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1" onClick={() => onSelect(area)}>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: area.color }}
            >
              {area.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{area.display_name}</h4>
                <Badge variant="outline" className="text-xs">
                  {area.sort_order}
                </Badge>
                {!area.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Inaktiv
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {area.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={() => onMove(area.id, 'up')}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={() => onMove(area.id, 'down')}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={() => onToggleActive(area.id)}
            >
              {area.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => onDelete(area.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SubjectAreaForm = ({ area, onSubmit, colorOptions, iconOptions }: { area?: any; onSubmit: any; colorOptions: any; iconOptions: any }) => {
  const [formData, setFormData] = useState({
    name: area?.name || '',
    display_name: area?.display_name || '',
    description: area?.description || '',
    icon: area?.icon || '📋',
    color: area?.color || '#10B981',
    sort_order: area?.sort_order || 0,
    is_active: area?.is_active !== undefined ? area.is_active : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">System navn</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="f.eks. sales"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="display_name">Visningsnavn</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="icon">Ikon</Label>
          <Select 
            value={formData.icon} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map((icon) => (
                <SelectItem key={icon} value={icon}>
                  <span className="text-lg">{icon}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="color">Farge</Label>
          <Select 
            value={formData.color} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color.color }}
                    />
                    {color.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sort_order">Sortering</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: Boolean(checked) }))}
        />
        <Label htmlFor="is_active">Aktiv</Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {area ? 'Oppdater' : 'Opprett'}
        </Button>
        <Button type="button" variant="outline">
          Avbryt
        </Button>
      </div>
    </form>
  );
};

const SubjectAreaDetails = ({ area }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
          style={{ backgroundColor: area.color }}
        >
          {area.icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{area.display_name}</h3>
          <p className="text-sm text-muted-foreground">System navn: {area.name}</p>
        </div>
      </div>

      <div>
        <Label className="font-semibold">Beskrivelse</Label>
        <p className="text-sm">{area.description}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="font-semibold">Farge</Label>
          <div className="flex items-center gap-2 mt-1">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: area.color }}
            />
            <span className="text-sm font-mono">{area.color}</span>
          </div>
        </div>
        <div>
          <Label className="font-semibold">Sortering</Label>
          <p className="text-sm">{area.sort_order}</p>
        </div>
        <div>
          <Label className="font-semibold">Status</Label>
          <p className="text-sm">
            {area.is_active ? 'Aktiv' : 'Inaktiv'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubjectAreaManager;
