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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff
} from 'lucide-react';
import createTaxonomyHooks from '@/hooks/knowledge/useTaxonomy';
import { useSubjectAreas, type SubjectArea } from '@/hooks/knowledge/useSubjectAreas';

import EntityManager from '../EntityManager';

const SubjectAreaEntityManager = EntityManager<SubjectArea>;

const EnhancedSubjectAreaManager = () => {
  const {
    useCreateTaxonomy: useCreateSubjectArea,
    useUpdateTaxonomy: useUpdateSubjectArea,
    useDeleteTaxonomy: useDeleteSubjectArea,
  } = createTaxonomyHooks<SubjectArea>('subject_areas', 'Emneområde');

  const { data: subjectAreas = [], isLoading } = useSubjectAreas();
  const updateSubjectArea = useUpdateSubjectArea();

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

  const handleToggleActive = async (area: SubjectArea) => {
    await updateSubjectArea.mutateAsync({
      id: area.id,
      is_active: !area.is_active
    });
  };

  const handleMoveArea = async (area: SubjectArea, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? area.sort_order - 1 : area.sort_order + 1;
    await updateSubjectArea.mutateAsync({
      id: area.id,
      sort_order: newOrder
    });
  };

  return (
    <SubjectAreaEntityManager
      title="Emneområde Administrasjon"
      useEntities={useSubjectAreas}
      useCreate={useCreateSubjectArea}
      useUpdate={useUpdateSubjectArea}
      useDelete={useDeleteSubjectArea}
      createButtonLabel="Nytt Emneområde"
      renderCard={(area, handlers) => (
        <SubjectAreaCard
          area={area}
          onSelect={handlers.onSelect}
          onEdit={handlers.onEdit}
          onDelete={() => handlers.onDelete(area.id)}
          onToggleActive={() => handleToggleActive(area)}
          onMove={handleMoveArea}
          selected={handlers.selected}
        />
      )}
      renderForm={(area, onSubmit) => (
        <SubjectAreaForm
          area={area}
          onSubmit={onSubmit}
          colorOptions={colorOptions}
          iconOptions={iconOptions}
        />
      )}
      renderDetails={(area) => (
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Detaljer</TabsTrigger>
            <TabsTrigger value="connections">Koblinger</TabsTrigger>
            <TabsTrigger value="statistics">Statistikk</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <SubjectAreaDetails area={area} />
          </TabsContent>
          <TabsContent value="connections">
            <SubjectAreaConnections subjectArea={area} />
          </TabsContent>
          <TabsContent value="statistics">
            <SubjectAreaStatistics subjectArea={area} />
          </TabsContent>
        </Tabs>
      )}
    />
  );
};

const SubjectAreaCard = ({ area, onSelect, onEdit, onDelete, onToggleActive, onMove, selected }: {
  area: SubjectArea;
  onSelect: (area: SubjectArea) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onToggleActive: () => void;
  onMove: (area: SubjectArea, direction: 'up' | 'down') => void;
  selected: boolean;
}) => {
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
              onClick={() => onMove(area, 'up')}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={() => onMove(area, 'down')}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={onToggleActive}
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

const SubjectAreaForm = ({ area, onSubmit, colorOptions, iconOptions }: { 
  area?: SubjectArea | null; 
  onSubmit: (data: any) => void; 
  colorOptions: any; 
  iconOptions: any 
}) => {
  const [formData, setFormData] = useState({
    name: area?.name || '',
    display_name: area?.display_name || '',
    description: area?.description || '',
    icon: area?.icon || '📋',
    color: area?.color || '#10B981',
    sort_order: area?.sort_order || 0,
    is_active: area?.is_active !== undefined ? area.is_active : true
  });

  const handleSubmit = (e: React.FormEvent) => {
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
              {iconOptions.map((icon: string) => (
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
              {colorOptions.map((color: any) => (
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

const SubjectAreaDetails = ({ area }: { area: SubjectArea }) => {
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

const SubjectAreaConnections = ({ subjectArea }: { subjectArea: SubjectArea }) => {
  return (
    <div className="space-y-4">
      <div className="text-center text-muted-foreground py-8">
        <Link className="h-8 w-8 mx-auto mb-2" />
        <h3 className="font-medium">Tilkoblede elementer</h3>
        <p className="text-sm">
          Her vil du se alle artikler, handlinger og dokumenter koblet til dette emneområdet.
        </p>
      </div>
    </div>
  );
};

const SubjectAreaStatistics = ({ subjectArea }: { subjectArea: SubjectArea }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Artikler</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Handlinger</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Dokumenter</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedSubjectAreaManager;
