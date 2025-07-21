import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type TableType = 'subject_areas' | 'content_types' | 'tags';

interface BulkEditItem {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  selected: boolean;
}

export function BulkEditManager() {
  const [selectedTable, setSelectedTable] = useState<TableType>('subject_areas');
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<BulkEditItem[]>([]);
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['bulkEditItems', selectedTable],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(selectedTable)
        .select('id, name, display_name, description, color')
        .order('name');
      
      if (error) throw error;
      
      return data?.map(item => ({
        ...item,
        selected: false
      })) as BulkEditItem[];
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: BulkEditItem[]) => {
      const selectedUpdates = updates.filter(item => item.selected);
      
      for (const item of selectedUpdates) {
        const { selected, ...updateData } = item;
        await supabase
          .from(selectedTable)
          .update(updateData)
          .eq('id', item.id);
      }

      // Log admin action (skip for now until types are updated)
      console.log(`Admin action: Bulk updated ${selectedUpdates.length} items in ${selectedTable}`);

      return selectedUpdates.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} elementer oppdatert`);
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['bulkEditItems'] });
    },
    onError: (error) => {
      toast.error(`Feil ved oppdatering: ${error.message}`);
    }
  });

  const startBulkEdit = () => {
    if (items) {
      setEditData([...items]);
      setEditMode(true);
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditData([]);
  };

  const saveBulkEdit = () => {
    bulkUpdateMutation.mutate(editData);
  };

  const toggleSelectAll = (checked: boolean) => {
    setEditData(prev => prev.map(item => ({ ...item, selected: checked })));
  };

  const toggleSelectItem = (id: string, checked: boolean) => {
    setEditData(prev => prev.map(item => 
      item.id === id ? { ...item, selected: checked } : item
    ));
  };

  const updateItem = (id: string, field: keyof BulkEditItem, value: string) => {
    setEditData(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const filteredItems = (editMode ? editData : items || [])
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const selectedCount = editData.filter(item => item.selected).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bulk-redigering</h2>
        <p className="text-muted-foreground">
          Rediger flere elementer samtidig for effektiv vedlikehold
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Bulk-redigering
          </CardTitle>
          <CardDescription>
            Velg tabell og rediger flere elementer samtidig
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="table-select">Tabell</Label>
                <Select 
                  value={selectedTable} 
                  onValueChange={(value: TableType) => setSelectedTable(value)}
                  disabled={editMode}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subject_areas">Fagområder</SelectItem>
                    <SelectItem value="content_types">Innholdstyper</SelectItem>
                    <SelectItem value="tags">Tagger</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label htmlFor="search">Søk</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Søk etter navn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-6">
                {!editMode ? (
                  <Button onClick={startBulkEdit} disabled={isLoading}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Start redigering
                  </Button>
                ) : (
                  <>
                    <Button onClick={saveBulkEdit} disabled={bulkUpdateMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      Lagre ({selectedCount})
                    </Button>
                    <Button variant="outline" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Avbryt
                    </Button>
                  </>
                )}
              </div>
            </div>

            {editMode && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Checkbox
                  checked={editData.length > 0 && editData.every(item => item.selected)}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm">
                  Velg alle ({selectedCount} av {editData.length} valgt)
                </span>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {editMode && (
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={(checked) => toggleSelectItem(item.id, checked as boolean)}
                      />
                    )}

                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Navn</Label>
                        {editMode ? (
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm font-medium">{item.name}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs">Visningsnavn</Label>
                        {editMode ? (
                          <Input
                            value={item.display_name}
                            onChange={(e) => updateItem(item.id, 'display_name', e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm">{item.display_name}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs">Beskrivelse</Label>
                        {editMode ? (
                          <Input
                            value={item.description || ''}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {item.description || 'Ingen beskrivelse'}
                          </p>
                        )}
                      </div>
                    </div>

                    {item.color && (
                      <Badge 
                        style={{ backgroundColor: item.color }} 
                        className="text-white"
                      >
                        Farge
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Ingen elementer matcher søket' : 'Ingen elementer funnet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}