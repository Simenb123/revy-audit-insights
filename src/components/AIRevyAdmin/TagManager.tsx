
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tags, 
  Search,
  Filter,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

const TagManager = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock data - replace with actual data from hooks
  const tags = [
    {
      id: '1',
      name: 'ISA-200',
      category: 'isa_standards',
      usage_count: 45,
      description: 'Generelle mål og prinsipper',
      color: '#3B82F6',
      is_system_tag: true
    },
    {
      id: '2',
      name: 'risikovurdering',
      category: 'risk_assessment',
      usage_count: 32,
      description: 'Relatert til risikovurdering',
      color: '#EF4444',
      is_system_tag: false
    },
    {
      id: '3',
      name: 'intern-kontroll',
      category: 'internal_controls',
      usage_count: 28,
      description: 'Intern kontroll og kontrollmiljø',
      color: '#10B981',
      is_system_tag: false
    },
    {
      id: '4',
      name: 'årsregnskap',
      category: 'financial_reporting',
      usage_count: 67,
      description: 'Årsregnskap og regnskapsføring',
      color: '#F59E0B',
      is_system_tag: false
    }
  ];

  const tagCategories = [
    { value: 'all', label: 'Alle kategorier' },
    { value: 'isa_standards', label: 'ISA Standarder' },
    { value: 'risk_assessment', label: 'Risikovurdering' },
    { value: 'internal_controls', label: 'Intern kontroll' },
    { value: 'financial_reporting', label: 'Regnskapsføring' },
    { value: 'audit_procedures', label: 'Revisjonsprosedyrer' }
  ];

  const filteredTags = tags.filter(tag => {
    const matchesSearch = searchTerm === '' || tag.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || tag.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTag = (formData) => {
    console.log('Creating tag:', formData);
    toast.success('Tag opprettet');
    setCreateDialogOpen(false);
  };

  const handleEditTag = (formData) => {
    console.log('Editing tag:', formData);
    toast.success('Tag oppdatert');
    setEditDialogOpen(false);
  };

  const handleDeleteTag = (tagId) => {
    console.log('Deleting tag:', tagId);
    toast.success('Tag slettet');
  };

  const handleBulkMerge = (sourceTagIds, targetTagId) => {
    console.log('Merging tags:', sourceTagIds, 'into', targetTagId);
    toast.success('Tags sammenslått');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Tag Administrasjon
            </span>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ny Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opprett Tag</DialogTitle>
                </DialogHeader>
                <TagForm onSubmit={handleCreateTag} categories={tagCategories} />
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manage" className="w-full">
            <TabsList>
              <TabsTrigger value="manage">Administrer</TabsTrigger>
              <TabsTrigger value="analytics">Analyser</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Operasjoner</TabsTrigger>
              <TabsTrigger value="auto-tagging">Auto-tagging</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manage" className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tagCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Badge variant="outline">
                  {filteredTags.length} tags
                </Badge>
              </div>

              {/* Tags Grid */}
              <div className="grid gap-4">
                {filteredTags.map((tag) => (
                  <TagCard 
                    key={tag.id} 
                    tag={tag} 
                    onSelect={setSelectedTag}
                    onEdit={() => {
                      setSelectedTag(tag);
                      setEditDialogOpen(true);
                    }}
                    onDelete={() => handleDeleteTag(tag.id)}
                    selected={selectedTag?.id === tag.id}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <TagAnalytics tags={tags} />
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <BulkOperations tags={tags} onBulkMerge={handleBulkMerge} />
            </TabsContent>

            <TabsContent value="auto-tagging" className="space-y-4">
              <AutoTaggingConfig />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger Tag</DialogTitle>
          </DialogHeader>
          <TagForm 
            tag={selectedTag} 
            onSubmit={handleEditTag} 
            categories={tagCategories}
          />
        </DialogContent>
      </Dialog>

      {/* Tag Details */}
      {selectedTag && (
        <Card>
          <CardHeader>
            <CardTitle>Tag Detaljer</CardTitle>
          </CardHeader>
          <CardContent>
            <TagDetails tag={selectedTag} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const TagCard = ({ tag, onSelect, onEdit, onDelete, selected }) => {
  return (
    <Card className={`cursor-pointer transition-colors hover:bg-accent/50 ${selected ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1" onClick={() => onSelect(tag)}>
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{tag.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {tag.usage_count} bruk
                </Badge>
                {tag.is_system_tag && (
                  <Badge variant="secondary" className="text-xs">
                    System
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {tag.description}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(tag.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TagForm = ({ tag, onSubmit, categories }) => {
  const [formData, setFormData] = useState({
    name: tag?.name || '',
    description: tag?.description || '',
    category: tag?.category || 'audit_procedures',
    color: tag?.color || '#3B82F6',
    is_system_tag: tag?.is_system_tag || false
  });

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Tag navn</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Kategori</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.filter(c => c.value !== 'all').map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
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
                <SelectItem key={color} value={color}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {color}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {tag ? 'Oppdater' : 'Opprett'}
        </Button>
        <Button type="button" variant="outline">
          Avbryt
        </Button>
      </div>
    </form>
  );
};

const TagDetails = ({ tag }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div 
          className="w-6 h-6 rounded-full"
          style={{ backgroundColor: tag.color }}
        />
        <div>
          <h3 className="text-lg font-semibold">{tag.name}</h3>
          <p className="text-sm text-muted-foreground">{tag.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="font-semibold">Kategori</Label>
          <p className="text-sm">{tag.category}</p>
        </div>
        <div>
          <Label className="font-semibold">Bruksfrekvens</Label>
          <p className="text-sm">{tag.usage_count} ganger</p>
        </div>
        <div>
          <Label className="font-semibold">Type</Label>
          <p className="text-sm">
            {tag.is_system_tag ? 'System tag' : 'Bruker tag'}
          </p>
        </div>
      </div>
    </div>
  );
};

const TagAnalytics = ({ tags }) => {
  const totalUsage = tags.reduce((sum, tag) => sum + tag.usage_count, 0);
  const mostUsedTags = tags.sort((a, b) => b.usage_count - a.usage_count).slice(0, 5);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tag Analyser</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistikk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Totalt tags:</span>
                <Badge variant="outline">{tags.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total bruk:</span>
                <Badge variant="outline">{totalUsage}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Gjennomsnitt:</span>
                <Badge variant="outline">{Math.round(totalUsage / tags.length)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mest brukte tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mostUsedTags.map((tag, index) => (
                <div key={tag.id} className="flex justify-between items-center">
                  <span className="text-sm">{index + 1}. {tag.name}</span>
                  <Badge variant="outline">{tag.usage_count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kategorier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Category breakdown would go here */}
              <div className="flex justify-between">
                <span className="text-sm">ISA Standarder:</span>
                <Badge variant="outline">12</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Prosedyrer:</span>
                <Badge variant="outline">8</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Risikovurdering:</span>
                <Badge variant="outline">6</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const BulkOperations = ({ tags, onBulkMerge }) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [targetTag, setTargetTag] = useState('');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Bulk Operasjoner</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Slå sammen tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Velg tags å slå sammen</Label>
              {/* Tag selection would go here */}
            </div>
            <div>
              <Label>Mål-tag</Label>
              <Select value={targetTag} onValueChange={setTargetTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg mål-tag" />
                </SelectTrigger>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => onBulkMerge(selectedTags, targetTag)}>
              Slå sammen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bulk redigering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Endre kategori for valgte
            </Button>
            <Button variant="outline" className="w-full">
              Oppdater farger
            </Button>
            <Button variant="destructive" className="w-full">
              Slett ubrukte tags
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AutoTaggingConfig = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Auto-tagging Konfigurasjon</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI-basert tagging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Konfidensterskel</Label>
              <Input type="number" min="0" max="1" step="0.1" defaultValue="0.8" />
            </div>
            <div className="space-y-2">
              <Label>Maksimalt tags per dokument</Label>
              <Input type="number" min="1" max="10" defaultValue="5" />
            </div>
            <Button>Oppdater innstillinger</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Regelbasert tagging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Konfigurer tekstmønstre
            </Button>
            <Button variant="outline" className="w-full">
              Filnavn-regler
            </Button>
            <Button variant="outline" className="w-full">
              Metadata-baserte regler
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TagManager;
