import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Edit2, Plus, Trash2, Move } from 'lucide-react';
import { 
  useSubjectAreasHierarchical, 
  useCreateSubjectArea, 
  useUpdateSubjectArea, 
  useDeleteSubjectArea 
} from '@/hooks/knowledge/useSubjectAreas';
import { SubjectArea } from '@/types/classification';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SubjectAreaFormData {
  name: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  parent_subject_area_id?: string;
}

const SubjectAreaForm: React.FC<{
  area?: SubjectArea;
  parentOptions: SubjectArea[];
  onSubmit: (data: SubjectAreaFormData) => void;
  onCancel: () => void;
}> = ({ area, parentOptions, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<SubjectAreaFormData>({
    name: area?.name || '',
    display_name: area?.display_name || '',
    description: area?.description || '',
    icon: area?.icon || '',
    color: area?.color || '#10B981',
    parent_subject_area_id: area?.parent_subject_area_id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Navn (systemidentifikator)</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="revisjon, regnskap, etc."
          required
        />
      </div>
      
      <div>
        <Label htmlFor="display_name">Visningsnavn</Label>
        <Input
          id="display_name"
          value={formData.display_name}
          onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
          placeholder="Revisjon, Regnskap, etc."
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Kort beskrivelse av emneområdet"
        />
      </div>
      
      <div>
        <Label htmlFor="parent">Overordnet emne</Label>
        <Select 
          value={formData.parent_subject_area_id || "none"} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, parent_subject_area_id: value === "none" ? undefined : value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg overordnet emne (valgfritt)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Ingen (hovedemne)</SelectItem>
            {parentOptions.map(option => (
              <SelectItem key={option.id} value={option.id}>
                {option.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="icon">Ikon (emoji)</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
            placeholder="🔍"
          />
        </div>
        
        <div>
          <Label htmlFor="color">Farge</Label>
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button type="submit">
          {area ? 'Oppdater' : 'Opprett'}
        </Button>
      </div>
    </form>
  );
};

const SubjectAreaTreeItem: React.FC<{
  area: SubjectArea;
  level: number;
  onEdit: (area: SubjectArea) => void;
  onDelete: (area: SubjectArea) => void;
}> = ({ area, level, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = area.children && area.children.length > 0;
  const indent = level * 24;

  return (
    <div className="border border-border rounded-lg">
      <div 
        className="flex items-center justify-between p-3 hover:bg-muted/50"
        style={{ paddingLeft: `${12 + indent}px` }}
      >
        <div className="flex items-center space-x-3">
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 p-1 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6" />
          )}
          
          <div className="flex items-center space-x-2">
            {area.icon && <span className="text-lg">{area.icon}</span>}
            <div>
              <div className="font-medium">{area.display_name}</div>
              <div className="text-sm text-muted-foreground">{area.description}</div>
            </div>
          </div>
          
          <Badge variant="secondary" className="ml-2">
            Nivå {level + 1}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(area)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(area)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="border-t border-border">
          {area.children!.map(child => (
            <SubjectAreaTreeItem
              key={child.id}
              area={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SubjectAreaManager: React.FC = () => {
  const { data: hierarchicalAreas, isLoading } = useSubjectAreasHierarchical();
  const createMutation = useCreateSubjectArea();
  const updateMutation = useUpdateSubjectArea();
  const deleteMutation = useDeleteSubjectArea();
  
  const [editingArea, setEditingArea] = useState<SubjectArea | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Hent alle hovedemner som kan være foreldre
  const getParentOptions = (excludeId?: string): SubjectArea[] => {
    if (!hierarchicalAreas) return [];
    return hierarchicalAreas.filter(area => area.id !== excludeId);
  };

  const handleCreate = async (data: SubjectAreaFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        sort_order: 0,
        is_active: true
      });
      setIsCreateDialogOpen(false);
      toast.success('Emneområde opprettet');
    } catch (error) {
      toast.error('Feil ved opprettelse');
    }
  };

  const handleUpdate = async (data: SubjectAreaFormData) => {
    if (!editingArea) return;
    
    try {
      await updateMutation.mutateAsync({
        id: editingArea.id,
        ...data
      });
      setEditingArea(null);
      toast.success('Emneområde oppdatert');
    } catch (error) {
      toast.error('Feil ved oppdatering');
    }
  };

  const handleDelete = async (area: SubjectArea) => {
    if (!confirm(`Er du sikker på at du vil slette "${area.display_name}"?`)) return;
    
    try {
      await deleteMutation.mutateAsync(area.id);
      toast.success('Emneområde slettet');
    } catch (error) {
      toast.error('Feil ved sletting');
    }
  };

  if (isLoading) {
    return <div className="p-6">Laster emneområder...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Emnestruktur</h2>
          <p className="text-muted-foreground">
            Administrer hierarkisk struktur for emneområder
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nytt emneområde
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Opprett nytt emneområde</DialogTitle>
            </DialogHeader>
            <SubjectAreaForm
              parentOptions={getParentOptions()}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {hierarchicalAreas?.map(area => (
          <SubjectAreaTreeItem
            key={area.id}
            area={area}
            level={0}
            onEdit={setEditingArea}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Dialog open={!!editingArea} onOpenChange={() => setEditingArea(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rediger emneområde</DialogTitle>
          </DialogHeader>
          {editingArea && (
            <SubjectAreaForm
              area={editingArea}
              parentOptions={getParentOptions(editingArea.id)}
              onSubmit={handleUpdate}
              onCancel={() => setEditingArea(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};