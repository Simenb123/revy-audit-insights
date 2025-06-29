import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Brain, 
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useDocumentTypes, DocumentType } from '@/hooks/useDocumentTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DocumentTypeManager = () => {
  const { data: documentTypes = [], refetch } = useDocumentTypes();
  const [isEditing, setIsEditing] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    file_pattern_hints: '',
    expected_structure: ''
  });

  const handleEdit = (type: DocumentType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      display_name: type.display_name,
      description: type.description || '',
      file_pattern_hints: type.file_pattern_hints.join(', '),
      expected_structure: JSON.stringify(type.expected_structure, null, 2)
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description,
        file_pattern_hints: formData.file_pattern_hints.split(',').map(s => s.trim()),
        expected_structure: JSON.parse(formData.expected_structure)
      };

      if (editingType) {
        const { error } = await supabase
          .from('document_types')
          .update(data)
          .eq('id', editingType.id);
        
        if (error) throw error;
        toast.success('Dokumenttype oppdatert');
      } else {
        const { error } = await supabase
          .from('document_types')
          .insert(data);
        
        if (error) throw error;
        toast.success('Ny dokumenttype opprettet');
      }

      setIsEditing(false);
      setEditingType(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        file_pattern_hints: '',
        expected_structure: ''
      });
      refetch();
    } catch (error) {
      logger.error('Error saving document type:', error);
      toast.error('Feil ved lagring');
    }
  };

  const handleDelete = async (type: DocumentType) => {
    if (!confirm(`Er du sikker på at du vil slette "${type.display_name}"?`)) return;

    try {
      const { error } = await supabase
        .from('document_types')
        .delete()
        .eq('id', type.id);
      
      if (error) throw error;
      toast.success('Dokumenttype slettet');
      refetch();
    } catch (error) {
      logger.error('Error deleting document type:', error);
      toast.error('Feil ved sletting');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Dokumenttype-administrasjon
            </CardTitle>
            <Button onClick={() => setIsEditing(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ny dokumenttype
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Document Types List */}
          <div className="space-y-4">
            {documentTypes.map((type) => (
              <Card key={type.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">{type.display_name}</h3>
                      {type.is_standard && (
                        <Badge variant="secondary">Standard</Badge>
                      )}
                    </div>
                    
                    {type.description && (
                      <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {type.file_pattern_hints.map((hint, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {hint}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Teknisk navn: {type.name}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(type)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!type.is_standard && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(type)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingType ? 'Rediger dokumenttype' : 'Opprett ny dokumenttype'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Teknisk navn</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="hovedbok"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Visningsnavn</label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Hovedbok / General Ledger"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Beskrivelse</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kort beskrivelse av dokumenttypen..."
                rows={2}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Filnavn-hints (kommaseparert)</label>
              <Input
                value={formData.file_pattern_hints}
                onChange={(e) => setFormData(prev => ({ ...prev, file_pattern_hints: e.target.value }))}
                placeholder="hovedbok, general_ledger, gl, transactions"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nøkkelord som AI bruker for å gjenkjenne denne dokumenttypen
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Forventet struktur (JSON)</label>
              <Textarea
                value={formData.expected_structure}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_structure: e.target.value }))}
                placeholder='{"required_columns": ["account", "date", "amount"]}'
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                JSON-struktur som beskriver forventede kolonner og felter
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Lagre
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setEditingType(null);
                }}
              >
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentTypeManager;
