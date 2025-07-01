import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { 
  useSubjectAreas as useSubjectAreasHook,
  useCreateSubjectArea,
  useUpdateSubjectArea,
  useDeleteSubjectArea
} from '@/hooks/knowledge/useSubjectAreas';
import { SubjectArea } from '@/types/classification';
import { toast } from 'sonner';

interface SubjectAreaFormData {
  name: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  parent_subject_area_id: string;
}

const SubjectAreaManager = () => {
  const { data: subjectAreas = [], isLoading } = useSubjectAreasHook();
  const createMutation = useCreateSubjectArea();
  const updateMutation = useUpdateSubjectArea();
  const deleteMutation = useDeleteSubjectArea();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SubjectAreaFormData>({
    name: '',
    display_name: '',
    description: '',
    icon: '',
    color: '#10B981',
    parent_subject_area_id: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      icon: '',
      color: '#10B981',
      parent_subject_area_id: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      parent_subject_area_id: formData.parent_subject_area_id || null,
      sort_order: subjectAreas.length
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
      setEditingId(null);
    } else {
      createMutation.mutate(data);
      setIsCreating(false);
    }
    
    resetForm();
  };

  const handleEdit = (subjectArea: SubjectArea) => {
    setFormData({
      name: subjectArea.name,
      display_name: subjectArea.display_name,
      description: subjectArea.description || '',
      icon: subjectArea.icon || '',
      color: subjectArea.color,
      parent_subject_area_id: subjectArea.parent_subject_area_id || ''
    });
    setEditingId(subjectArea.id);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Er du sikker på at du vil slette dette fagområdet?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
  };

  if (isLoading) {
    return <div>Laster fagområder...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fagområder</CardTitle>
            <Button onClick={() => setIsCreating(true)} disabled={isCreating || editingId !== null}>
              <Plus className="h-4 w-4 mr-2" />
              Nytt fagområde
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(isCreating || editingId) && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Navn</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                <div>
                  <Label htmlFor="icon">Ikon</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="📊"
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
                <div className="md:col-span-2">
                  <Label htmlFor="parent_subject_area_id">Overordnet fagområde</Label>
                  <select
                    id="parent_subject_area_id"
                    value={formData.parent_subject_area_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_subject_area_id: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Ingen</option>
                    {subjectAreas
                      .filter(sa => sa.id !== editingId)
                      .map(subjectArea => (
                        <option key={subjectArea.id} value={subjectArea.id}>
                          {subjectArea.display_name}
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Oppdater' : 'Opprett'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Avbryt
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {subjectAreas.map((subjectArea) => (
              <Card key={subjectArea.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: subjectArea.color }}
                      />
                      {subjectArea.icon && (
                        <span className="text-lg">{subjectArea.icon}</span>
                      )}
                      <h3 className="font-medium">{subjectArea.display_name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {subjectArea.name}
                      </Badge>
                    </div>
                    {subjectArea.description && (
                      <p className="text-sm text-gray-600 mb-2">{subjectArea.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      ID: {subjectArea.id}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(subjectArea)}
                      disabled={isCreating || editingId !== null}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(subjectArea.id)}
                      disabled={isCreating || editingId !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubjectAreaManager;
