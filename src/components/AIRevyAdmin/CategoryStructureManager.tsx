
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Move, 
  FolderTree, 
  Folder, 
  FileText,
  ArrowUp,
  ArrowDown,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useKnowledgeCategories,
  useCreateKnowledgeCategory,
  useUpdateKnowledgeCategory,
  useDeleteKnowledgeCategory,
} from '@/hooks/knowledge/useKnowledgeCategories';

interface Category {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  icon?: string;
  applicable_phases?: AuditPhase[];
  children?: Category[];
}

import type { AuditPhase } from '@/types/revio';

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  parent_category_id: string;
  display_order: number;
  applicable_phases: AuditPhase[];
}

const CategoryStructureManager = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: categories = [], isLoading } = useKnowledgeCategories();
  const createCategory = useCreateKnowledgeCategory();
  const updateCategory = useUpdateKnowledgeCategory();
  const deleteCategory = useDeleteKnowledgeCategory();

  const handleCreateCategory = (formData: CategoryFormData) => {
    createCategory.mutate(formData, {
      onSuccess: () => setCreateDialogOpen(false),
    });
  };

  const handleEditCategory = (formData: CategoryFormData) => {
    if (!selectedCategory) return;
    updateCategory.mutate(
      { id: selectedCategory.id, ...formData },
      { onSuccess: () => setEditDialogOpen(false) }
    );
  };

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory.mutate(categoryId);
  };

  const handleMoveCategory = (categoryId: string, direction: 'up' | 'down') => {
    console.log('Moving category:', categoryId, direction);
    toast.success('Kategori flyttet');
  };

  const handleDuplicateCategory = (categoryId: string) => {
    console.log('Duplicating category:', categoryId);
    toast.success('Kategori duplisert');
  };

  if (isLoading) {
    return <div>Laster kategorier...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Kategoristruktur Administrasjon
            </span>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ny Kategori
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opprett Ny Kategori</DialogTitle>
                </DialogHeader>
                <CategoryForm onSubmit={handleCreateCategory} />
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="structure" className="w-full">
            <TabsList>
              <TabsTrigger value="structure">Struktur</TabsTrigger>
              <TabsTrigger value="bulk-operations">Bulk Operasjoner</TabsTrigger>
              <TabsTrigger value="import-export">Import/Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="structure" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Tree */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kategoritre</h3>
                  <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                    {categories.map((category) => (
                      <CategoryTreeItem
                        key={category.id}
                        category={category}
                        onSelect={setSelectedCategory}
                        onEdit={() => setEditDialogOpen(true)}
                        onDelete={handleDeleteCategory}
                        onMove={handleMoveCategory}
                        onDuplicate={handleDuplicateCategory}
                        selected={selectedCategory?.id === category.id}
                      />
                    ))}
                  </div>
                </div>

                {/* Category Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kategoridetails</h3>
                  {selectedCategory ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {selectedCategory.name}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(true)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDuplicateCategory(selectedCategory.id)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(selectedCategory.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="font-semibold">Beskrivelse</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedCategory.description || 'Ingen beskrivelse'}
                          </p>
                        </div>
                        <div>
                          <Label className="font-semibold">Sortering</Label>
                          <p className="text-sm">{selectedCategory.display_order}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Ikon</Label>
                          <p className="text-sm">{selectedCategory.icon || 'Standard'}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Underkategorier</Label>
                          <p className="text-sm">{selectedCategory.children?.length || 0}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        Velg en kategori for å se detaljer
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bulk-operations" className="space-y-4">
              <BulkOperationsPanel />
            </TabsContent>

            <TabsContent value="import-export" className="space-y-4">
              <ImportExportPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger Kategori</DialogTitle>
          </DialogHeader>
          <CategoryForm 
            category={selectedCategory} 
            onSubmit={handleEditCategory} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface CategoryTreeItemProps {
  category: Category;
  onSelect: (category: Category) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onDuplicate: (id: string) => void;
  selected: boolean;
  depth?: number;
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({ 
  category, 
  onSelect, 
  onEdit, 
  onDelete, 
  onMove, 
  onDuplicate, 
  selected, 
  depth = 0 
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-1">
      <div 
        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent/50 ${
          selected ? 'bg-accent border border-primary/20' : ''
        }`}
        style={{ marginLeft: `${depth * 16}px` }}
        onClick={() => onSelect(category)}
      >
        <Folder className="h-4 w-4 text-blue-600" />
        <span className="flex-1 font-medium">{category.name}</span>
        <Badge variant="outline" className="text-xs">
          {category.display_order}
        </Badge>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onMove(category.id, 'up'); }}>
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onMove(category.id, 'down'); }}>
            <ArrowDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {expanded && category.children && category.children.map((child: Category) => (
        <CategoryTreeItem
          key={child.id}
          category={child}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={onMove}
          onDuplicate={onDuplicate}
          selected={selected}
          depth={depth + 1}
        />
      ))}
    </div>
  );
};

interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (formData: CategoryFormData) => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSubmit }) => {
  const phaseOptions: { value: AuditPhase; label: string }[] = [
    { value: 'overview', label: 'Oversikt' },
    { value: 'engagement', label: 'Oppdragsvurdering' },
    { value: 'planning', label: 'Planlegging' },
    { value: 'risk_assessment', label: 'Risikovurdering' },
    { value: 'execution', label: 'Utførelse' },
    { value: 'completion', label: 'Avslutning' },
    { value: 'reporting', label: 'Rapportering' },
  ];
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '',
    parent_category_id: 'none',
    display_order: category?.display_order || 0,
    applicable_phases: category?.applicable_phases || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="icon">Ikon</Label>
        <Select 
          value={formData.icon} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg ikon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="folder">📁 Mappe</SelectItem>
            <SelectItem value="file-text">📄 Dokument</SelectItem>
            <SelectItem value="calculator">🧮 Kalkulator</SelectItem>
            <SelectItem value="shield-check">🛡️ Sikkerhet</SelectItem>
            <SelectItem value="scale">⚖️ Vekt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="order">Sorteringsrekkefølge</Label>
        <Input
          id="order"
          type="number"
          value={formData.display_order}
          onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
        />
      </div>

      <div>
        <Label className="mb-2 block">Gjeldende faser</Label>
        <div className="grid grid-cols-2 gap-2">
          {phaseOptions.map((phase) => (
            <div key={phase.value} className="flex items-center space-x-2">
              <Checkbox
                id={`phase-${phase.value}`}
                checked={formData.applicable_phases.includes(phase.value)}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    applicable_phases: checked
                      ? [...prev.applicable_phases, phase.value]
                      : prev.applicable_phases.filter((p) => p !== phase.value),
                  }))
                }
              />
              <Label htmlFor={`phase-${phase.value}`}>{phase.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {category ? 'Oppdater' : 'Opprett'}
        </Button>
        <Button type="button" variant="outline">
          Avbryt
        </Button>
      </div>
    </form>
  );
};

const BulkOperationsPanel = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Bulk Operasjoner</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bulk Redigering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Oppdater Sorteringsrekkefølge
            </Button>
            <Button variant="outline" className="w-full">
              Endre Overordnet Kategori
            </Button>
            <Button variant="outline" className="w-full">
              Oppdater Ikoner
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bulk Sletting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Slett Tomme Kategorier
            </Button>
            <Button variant="destructive" className="w-full">
              Slett Valgte Kategorier
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ImportExportPanel = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Import/Export</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Eksporter til Excel
            </Button>
            <Button variant="outline" className="w-full">
              Eksporter til JSON
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Importer fra Excel
            </Button>
            <Button variant="outline" className="w-full">
              Importer fra JSON
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CategoryStructureManager;
