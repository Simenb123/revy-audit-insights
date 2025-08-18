import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Users, Building, Calendar, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useClientShareholders } from '@/hooks/useExtendedClientData';
import type { ClientShareholder } from '@/types/client-extended';

interface ClientShareholdersTabProps {
  clientId: string;
}

interface ShareholderFormData {
  shareholder_name: string;
  shareholder_org_number: string;
  shareholder_type: 'person' | 'company' | 'trust' | 'other';
  ownership_percentage: number;
  number_of_shares: number;
  share_class: string;
  voting_rights_percentage: number;
  registered_date: string;
  address_line1: string;
  address_line2: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string;
  email: string;
}

const defaultFormData: ShareholderFormData = {
  shareholder_name: '',
  shareholder_org_number: '',
  shareholder_type: 'person',
  ownership_percentage: 0,
  number_of_shares: 0,
  share_class: 'ordinary',
  voting_rights_percentage: 0,
  registered_date: '',
  address_line1: '',
  address_line2: '',
  postal_code: '',
  city: '',
  country: 'Norge',
  phone: '',
  email: '',
};

const ClientShareholdersTab: React.FC<ClientShareholdersTabProps> = ({ clientId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShareholder, setEditingShareholder] = useState<ClientShareholder | null>(null);
  const [formData, setFormData] = useState<ShareholderFormData>(defaultFormData);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: shareholders = [], isLoading } = useClientShareholders(clientId);

  const createShareholderMutation = useMutation({
    mutationFn: async (data: ShareholderFormData) => {
      const { data: result, error } = await supabase
        .from('client_shareholders')
        .insert({
          client_id: clientId,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-shareholders', clientId] });
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      toast({
        title: "Aksjonær lagt til",
        description: "Aksjonæren ble lagt til successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved opprettelse",
        description: `Kunne ikke legge til aksjonær: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateShareholderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShareholderFormData> }) => {
      const { data: result, error } = await supabase
        .from('client_shareholders')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-shareholders', clientId] });
      setIsDialogOpen(false);
      setEditingShareholder(null);
      setFormData(defaultFormData);
      toast({
        title: "Aksjonær oppdatert",
        description: "Aksjonærinformasjonen ble oppdatert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved oppdatering",
        description: `Kunne ikke oppdatere aksjonær: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteShareholderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_shareholders')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-shareholders', clientId] });
      toast({
        title: "Aksjonær fjernet",
        description: "Aksjonæren ble fjernet fra listen.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingShareholder) {
      updateShareholderMutation.mutate({
        id: editingShareholder.id,
        data: formData,
      });
    } else {
      createShareholderMutation.mutate(formData);
    }
  };

  const openEditDialog = (shareholder: ClientShareholder) => {
    setEditingShareholder(shareholder);
    setFormData({
      shareholder_name: shareholder.shareholder_name,
      shareholder_org_number: shareholder.shareholder_org_number || '',
      shareholder_type: shareholder.shareholder_type,
      ownership_percentage: shareholder.ownership_percentage || 0,
      number_of_shares: shareholder.number_of_shares || 0,
      share_class: shareholder.share_class,
      voting_rights_percentage: shareholder.voting_rights_percentage || 0,
      registered_date: shareholder.registered_date || '',
      address_line1: shareholder.address_line1 || '',
      address_line2: shareholder.address_line2 || '',
      postal_code: shareholder.postal_code || '',
      city: shareholder.city || '',
      country: shareholder.country,
      phone: shareholder.phone || '',
      email: shareholder.email || '',
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingShareholder(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const totalOwnership = shareholders.reduce((sum, sh) => sum + (sh.ownership_percentage || 0), 0);
  const totalShares = shareholders.reduce((sum, sh) => sum + (sh.number_of_shares || 0), 0);

  const getShareholderTypeIcon = (type: string) => {
    switch (type) {
      case 'company':
        return <Building className="h-4 w-4" />;
      case 'person':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div>Laster aksjonærer...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totalt eierskap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOwnership.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {totalOwnership > 100 ? 'Over 100% - kontroller data' : 
               totalOwnership < 100 ? `${(100 - totalOwnership).toFixed(1)}% mangler` : 
               'Komplett eierskap'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Antall aksjonærer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shareholders.length}</div>
            <p className="text-xs text-muted-foreground">
              {shareholders.filter(s => s.shareholder_type === 'person').length} personer, {' '}
              {shareholders.filter(s => s.shareholder_type === 'company').length} selskaper
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totalt antall aksjer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShares.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Fordelt på {shareholders.filter(s => s.number_of_shares && s.number_of_shares > 0).length} aksjonærer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Aksjonærliste</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Oppdater fra Brønnøysund
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Legg til aksjonær
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingShareholder ? 'Rediger aksjonær' : 'Legg til aksjonær'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shareholder_name">Navn *</Label>
                    <Input
                      id="shareholder_name"
                      value={formData.shareholder_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, shareholder_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="shareholder_type">Type</Label>
                    <Select
                      value={formData.shareholder_type}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, shareholder_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="person">Person</SelectItem>
                        <SelectItem value="company">Selskap</SelectItem>
                        <SelectItem value="trust">Trust/Fond</SelectItem>
                        <SelectItem value="other">Annet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="shareholder_org_number">Organisasjonsnummer</Label>
                    <Input
                      id="shareholder_org_number"
                      value={formData.shareholder_org_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, shareholder_org_number: e.target.value }))}
                      placeholder="For juridiske personer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownership_percentage">Eierandel (%)</Label>
                    <Input
                      id="ownership_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.ownership_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownership_percentage: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="number_of_shares">Antall aksjer</Label>
                    <Input
                      id="number_of_shares"
                      type="number"
                      min="0"
                      value={formData.number_of_shares}
                      onChange={(e) => setFormData(prev => ({ ...prev, number_of_shares: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="share_class">Aksjeklasse</Label>
                    <Input
                      id="share_class"
                      value={formData.share_class}
                      onChange={(e) => setFormData(prev => ({ ...prev, share_class: e.target.value }))}
                      placeholder="ordinary"
                    />
                  </div>

                  <div>
                    <Label htmlFor="voting_rights_percentage">Stemmerett (%)</Label>
                    <Input
                      id="voting_rights_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.voting_rights_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, voting_rights_percentage: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="registered_date">Registreringsdato</Label>
                    <Input
                      id="registered_date"
                      type="date"
                      value={formData.registered_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, registered_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-post</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address_line1">Adresse</Label>
                  <Input
                    id="address_line1"
                    value={formData.address_line1}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                    placeholder="Gate og nummer"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="postal_code">Postnummer</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Sted</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Land</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Avbryt
                  </Button>
                  <Button type="submit">
                    {editingShareholder ? 'Oppdater' : 'Legg til'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Shareholders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Org.nr</TableHead>
                <TableHead className="text-right">Eierandel</TableHead>
                <TableHead className="text-right">Aksjer</TableHead>
                <TableHead className="text-right">Stemmerett</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead className="text-center">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shareholders.map((shareholder) => (
                <TableRow key={shareholder.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getShareholderTypeIcon(shareholder.shareholder_type)}
                      {shareholder.shareholder_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {shareholder.shareholder_type === 'person' ? 'Person' :
                       shareholder.shareholder_type === 'company' ? 'Selskap' :
                       shareholder.shareholder_type === 'trust' ? 'Trust' : 'Annet'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {shareholder.shareholder_org_number || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {shareholder.ownership_percentage ? `${shareholder.ownership_percentage}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {shareholder.number_of_shares ? shareholder.number_of_shares.toLocaleString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {shareholder.voting_rights_percentage ? `${shareholder.voting_rights_percentage}%` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {shareholder.email && <div>{shareholder.email}</div>}
                      {shareholder.phone && <div className="text-muted-foreground">{shareholder.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(shareholder)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteShareholderMutation.mutate(shareholder.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {shareholders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Ingen aksjonærer registrert
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientShareholdersTab;