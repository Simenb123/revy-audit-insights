
import React from 'react';
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
import { Edit, Trash2 } from 'lucide-react';
import createTaxonomyHooks from '@/hooks/knowledge/useTaxonomy';
import { type ContentType } from '@/hooks/knowledge/useContentTypes';
import { useSubjectAreas } from '@/hooks/knowledge/useSubjectAreas';

import EntityManager from '../EntityManager';

const ContentTypeEntityManager = EntityManager<ContentType>;

const EnhancedContentTypeManager = () => {
  const {
    useTaxonomies: useContentTypes,
    useCreateTaxonomy: useCreateContentType,
    useUpdateTaxonomy: useUpdateContentType,
    useDeleteTaxonomy: useDeleteContentType,
  } = createTaxonomyHooks<ContentType>('content_types', 'Innholdstype');

  const { data: subjectAreas = [] } = useSubjectAreas();

  return (
    <ContentTypeEntityManager
      title="Innholdstype Administrasjon"
      useEntities={useContentTypes}
      useCreate={useCreateContentType}
      useUpdate={useUpdateContentType}
      useDelete={useDeleteContentType}
      createButtonLabel="Ny Innholdstype"
      renderCard={(type, handlers) => (
        <ContentTypeCard
          type={type}
          onSelect={handlers.onSelect}
          onEdit={handlers.onEdit}
          onDelete={() => handlers.onDelete(type.id)}
          selected={handlers.selected}
        />
      )}
      renderForm={(type, onSubmit) => (
        <ContentTypeForm type={type} onSubmit={onSubmit} />
      )}
      renderDetails={(type) => (
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Detaljer</TabsTrigger>
            <TabsTrigger value="connections">Koblinger</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <ContentTypeDetails type={type} />
          </TabsContent>
          <TabsContent value="connections">
            <ContentTypeConnections
              contentType={type}
              subjectAreas={subjectAreas}
            />
          </TabsContent>
        </Tabs>
      )}
    />
  );
};

const ContentTypeCard = ({ type, onSelect, onEdit, onDelete, selected }: {
  type: ContentType;
  onSelect: (type: ContentType) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  selected: boolean;
}) => {
  return (
    <Card className={`cursor-pointer transition-colors hover:bg-accent/50 ${selected ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => onSelect(type)}>
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: type.color }}
              />
              <h4 className="font-semibold">{type.display_name}</h4>
              <Badge variant="outline" className="text-xs">
                {type.sort_order}
              </Badge>
              {!type.is_active && (
                <Badge variant="secondary" className="text-xs">
                  Inaktiv
                </Badge>
              )}
            </div>
            {type.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {type.description}
              </p>
            )}
            <p className="text-xs font-mono text-muted-foreground">
              {type.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(type.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ContentTypeForm = ({ type, onSubmit }: { type?: ContentType | null; onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: type?.name || '',
    display_name: type?.display_name || '',
    description: type?.description || '',
    icon: type?.icon || '',
    color: type?.color || '#10B981',
    sort_order: type?.sort_order || 0,
    is_active: type?.is_active !== undefined ? type.is_active : true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const colorOptions = [
    { value: '#10B981', label: 'Grønn', color: '#10B981' },
    { value: '#3B82F6', label: 'Blå', color: '#3B82F6' },
    { value: '#8B5CF6', label: 'Lilla', color: '#8B5CF6' },
    { value: '#F59E0B', label: 'Gul', color: '#F59E0B' },
    { value: '#EF4444', label: 'Rød', color: '#EF4444' },
    { value: '#6B7280', label: 'Grå', color: '#6B7280' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">System navn</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="f.eks. fagartikkel"
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
          <Label htmlFor="icon">Ikon navn (Lucide)</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
            placeholder="f.eks. book-open"
          />
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
          {type ? 'Oppdater' : 'Opprett'}
        </Button>
        <Button type="button" variant="outline">
          Avbryt
        </Button>
      </div>
    </form>
  );
};

const ContentTypeDetails = ({ type }: { type: ContentType }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="font-semibold">System navn</Label>
          <p className="text-sm font-mono bg-muted p-2 rounded">{type.name}</p>
        </div>
        <div>
          <Label className="font-semibold">Visningsnavn</Label>
          <p className="text-sm">{type.display_name}</p>
        </div>
      </div>

      <div>
        <Label className="font-semibold">Beskrivelse</Label>
        <p className="text-sm">{type.description || 'Ingen beskrivelse'}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="font-semibold">Ikon</Label>
          <p className="text-sm">{type.icon || 'Ikke spesifisert'}</p>
        </div>
        <div>
          <Label className="font-semibold">Farge</Label>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: type.color }}
            />
            <span className="text-sm font-mono">{type.color}</span>
          </div>
        </div>
        <div>
          <Label className="font-semibold">Status</Label>
          <p className="text-sm">
            {type.is_active ? 'Aktiv' : 'Inaktiv'}
          </p>
        </div>
      </div>
    </div>
  );
};

const ContentTypeConnections = ({ contentType, subjectAreas }: { 
  contentType: ContentType; 
  subjectAreas: any[] 
}) => {
  // Note: Content types don't currently have direct subject area connections
  // This is a placeholder for future functionality
  return (
    <div className="space-y-4">
      <div className="text-center text-muted-foreground py-8">
        <Link className="h-8 w-8 mx-auto mb-2" />
        <h3 className="font-medium">Emneområde-koblinger</h3>
        <p className="text-sm">
          Innholdstyper kobles til emneområder gjennom artikler og dokumenter.
        </p>
      </div>
    </div>
  );
};

export default EnhancedContentTypeManager;
