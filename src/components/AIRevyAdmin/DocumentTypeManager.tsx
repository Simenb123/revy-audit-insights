import { logger } from '@/utils/logger';

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
  FileText, 
  Settings,
  Tag,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentTypeFormData {
  name: string;
  display_name: string;
  description: string;
  file_pattern_hints: string;
  is_standard: boolean;
  sort_order: number;
  validation_rules: string;
  expected_structure: string;
}

interface DocumentType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  file_pattern_hints: string[];
  is_standard: boolean;
  sort_order: number;
  validation_rules: Record<string, any>;
  expected_structure?: Record<string, any>;
}

interface DocumentTypeCardProps {
  type: DocumentType;
  onSelect: (type: DocumentType | null) => void;
  onEdit: () => void;
  onDelete: (typeId: string) => void;
  selected: boolean;
}

interface DocumentTypeFormProps {
  type?: DocumentType | null;
  onSubmit: (formData: DocumentTypeFormData) => void;
}

interface DocumentTypeDetailsProps {
  type: DocumentType;
}

const DocumentTypeManager = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock data - replace with actual data from hooks
  const documentTypes: DocumentType[] = [
    {
      id: '1',
      name: 'isa_standard',
      display_name: 'ISA Standard',
      description: 'International Standard on Auditing dokumenter',
      file_pattern_hints: ['ISA', 'standard', 'audit'],
      is_standard: true,
      sort_order: 1,
      validation_rules: { required_sections: ['introduction', 'requirements'] }
    },
    {
      id: '2',
      name: 'client_document',
      display_name: 'Klientdokument',
      description: 'Generelt klientdokument',
      file_pattern_hints: ['årsrapport', 'regnskaper', 'noter'],
      is_standard: false,
      sort_order: 2,
      validation_rules: { max_size_mb: 50 }
    },
    {
      id: '3',
      name: 'working_paper',
      display_name: 'Arbeidsnotat',
      description: 'Revisjonsarbeidsnotater og dokumentasjon',
      file_pattern_hints: ['arbeidsnotat', 'dokumentasjon', 'revisjon'],
      is_standard: false,
      sort_order: 3,
      validation_rules: { required_fields: ['author', 'date'] }
    }
  ];

  const categories = ['all', 'standard', 'client', 'internal'];

  const filteredTypes = documentTypes.filter(type => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'standard') return type.is_standard;
    if (filterCategory === 'client') return type.name.includes('client');
    if (filterCategory === 'internal') return type.name.includes('working');
    return true;
  });

  const handleCreateType = (formData: DocumentTypeFormData) => {
    logger.log('Creating document type:', formData);
    toast.success('Dokumenttype opprettet');
    setCreateDialogOpen(false);
  };

  const handleEditType = (formData: DocumentTypeFormData) => {
    logger.log('Editing document type:', formData);
    toast.success('Dokumenttype oppdatert');
    setEditDialogOpen(false);
  };

  const handleDeleteType = (typeId: string) => {
    logger.log('Deleting document type:', typeId);
    toast.success('Dokumenttype slettet');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dokumenttype Administrasjon
            </span>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ny Dokumenttype
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Opprett Dokumenttype</DialogTitle>
                </DialogHeader>
                <DocumentTypeForm onSubmit={handleCreateType} />
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="flex gap-4 items-center mb-6">
            <Label htmlFor="filter">Filter:</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle typer</SelectItem>
                <SelectItem value="standard">Standard typer</SelectItem>
                <SelectItem value="client">Klient dokumenter</SelectItem>
                <SelectItem value="internal">Interne dokumenter</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline">
              {filteredTypes.length} typer
            </Badge>
          </div>

          {/* Document Types Grid */}
          <div className="grid gap-4">
            {filteredTypes.map((type) => (
              <DocumentTypeCard 
                key={type.id} 
                type={type} 
                onSelect={setSelectedType}
                onEdit={() => {
                  setSelectedType(type);
                  setEditDialogOpen(true);
                }}
                onDelete={() => handleDeleteType(type.id)}
                selected={selectedType?.id === type.id}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rediger Dokumenttype</DialogTitle>
          </DialogHeader>
          <DocumentTypeForm 
            type={selectedType} 
            onSubmit={handleEditType} 
          />
        </DialogContent>
      </Dialog>

      {/* Type Details */}
      {selectedType && (
        <Card>
          <CardHeader>
            <CardTitle>Dokumenttype Detaljer</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentTypeDetails type={selectedType} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const DocumentTypeCard: React.FC<DocumentTypeCardProps> = ({ type, onSelect, onEdit, onDelete, selected }) => {
  return (
    <Card className={`cursor-pointer transition-colors hover:bg-accent/50 ${selected ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => onSelect(type)}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold">{type.display_name}</h4>
              {type.is_standard && (
                <Badge variant="outline">Standard</Badge>
              )}
              <Badge variant="secondary">
                {type.sort_order}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {type.description}
            </p>
            {type.file_pattern_hints && type.file_pattern_hints.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {type.file_pattern_hints.map((hint: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {hint}
                  </Badge>
                ))}
              </div>
            )}
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

const DocumentTypeForm: React.FC<DocumentTypeFormProps> = ({ type, onSubmit }) => {
  const [formData, setFormData] = useState<DocumentTypeFormData>({
    name: type?.name || '',
    display_name: type?.display_name || '',
    description: type?.description || '',
    file_pattern_hints: type?.file_pattern_hints?.join(', ') || '',
    is_standard: type?.is_standard || false,
    sort_order: type?.sort_order || 0,
    validation_rules: JSON.stringify(type?.validation_rules || {}, null, 2),
    expected_structure: JSON.stringify(type?.expected_structure || {}, null, 2)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData: DocumentTypeFormData = {
        ...formData,
        file_pattern_hints: formData.file_pattern_hints.split(',').map((s: string) => s.trim()).filter(Boolean).join(', '),
      };
      onSubmit(submitData);
    } catch (error) {
      toast.error('Ugyldig JSON format i validering eller struktur');
    }
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
            placeholder="f.eks. isa_standard"
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

      <div>
        <Label htmlFor="file_pattern_hints">Fil mønstre (kommaseparert)</Label>
        <Input
          id="file_pattern_hints"
          value={formData.file_pattern_hints}
          onChange={(e) => setFormData(prev => ({ ...prev, file_pattern_hints: e.target.value }))}
          placeholder="ISA, standard, audit"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="is_standard"
            checked={formData.is_standard}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_standard: Boolean(checked) }))}
          />
          <Label htmlFor="is_standard">Standard type</Label>
        </div>

        <div>
          <Label htmlFor="sort_order">Sorteringsrekkefølge</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="validation_rules">Valideringsregler (JSON)</Label>
        <Textarea
          id="validation_rules"
          value={formData.validation_rules}
          onChange={(e) => setFormData(prev => ({ ...prev, validation_rules: e.target.value }))}
          placeholder='{"max_size_mb": 50, "required_fields": ["author"]}'
          className="font-mono text-sm"
        />
      </div>

      <div>
        <Label htmlFor="expected_structure">Forventet struktur (JSON)</Label>
        <Textarea
          id="expected_structure"
          value={formData.expected_structure}
          onChange={(e) => setFormData(prev => ({ ...prev, expected_structure: e.target.value }))}
          placeholder='{"sections": ["introduction", "requirements", "examples"]}'
          className="font-mono text-sm"
        />
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

const DocumentTypeDetails: React.FC<DocumentTypeDetailsProps> = ({ type }) => {
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
        <p className="text-sm">{type.description}</p>
      </div>

      {type.file_pattern_hints && type.file_pattern_hints.length > 0 && (
        <div>
          <Label className="font-semibold">Fil mønstre</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {type.file_pattern_hints.map((hint: string, index: number) => (
              <Badge key={index} variant="outline">
                {hint}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="font-semibold">Type</Label>
          <p className="text-sm">
            {type.is_standard ? 'Standard type' : 'Egendefinert type'}
          </p>
        </div>
        <div>
          <Label className="font-semibold">Sortering</Label>
          <p className="text-sm">{type.sort_order}</p>
        </div>
      </div>

      {type.validation_rules && Object.keys(type.validation_rules).length > 0 && (
        <div>
          <Label className="font-semibold">Valideringsregler</Label>
          <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-x-auto">
            {JSON.stringify(type.validation_rules, null, 2)}
          </pre>
        </div>
      )}

      {type.expected_structure && Object.keys(type.expected_structure).length > 0 && (
        <div>
          <Label className="font-semibold">Forventet struktur</Label>
          <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-x-auto">
            {JSON.stringify(type.expected_structure, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DocumentTypeManager;
