import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, Star, StarOff, Edit, Trash2, Save, X } from 'lucide-react';
import { usePDFCompanies, PDFCompany } from '@/hooks/pdf/usePDFCompanies';

interface CompanySelectorProps {
  selskapInfo: {
    navn: string;
    orgnr: string;
    mvaRegistrert: boolean;
    adresse: string;
  };
  setSelskapInfo: (info: any) => void;
}

interface CompanyFormData {
  name: string;
  org_number: string;
  address: string;
  is_vat_registered: boolean;
  is_favorite: boolean;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  selskapInfo,
  setSelskapInfo
}) => {
  const { companies, createCompany, updateCompany, deleteCompany, toggleFavorite } = usePDFCompanies();
  const [showNewCompanyDialog, setShowNewCompanyDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<PDFCompany | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    org_number: '',
    address: '',
    is_vat_registered: true,
    is_favorite: false
  });

  const handleSelectCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setSelskapInfo({
        navn: company.name,
        orgnr: company.org_number || '',
        mvaRegistrert: company.is_vat_registered,
        adresse: company.address || ''
      });
    }
  };

  const handleSaveCurrentAsNew = () => {
    if (!selskapInfo.navn.trim()) {
      return;
    }

    createCompany.mutate({
      name: selskapInfo.navn,
      org_number: selskapInfo.orgnr,
      address: selskapInfo.adresse,
      is_vat_registered: selskapInfo.mvaRegistrert,
      is_favorite: false
    });
  };

  const handleCreateCompany = () => {
    createCompany.mutate(formData, {
      onSuccess: () => {
        setShowNewCompanyDialog(false);
        setFormData({
          name: '',
          org_number: '',
          address: '',
          is_vat_registered: true,
          is_favorite: false
        });
      }
    });
  };

  const handleUpdateCompany = () => {
    if (!editingCompany) return;
    
    updateCompany.mutate({
      id: editingCompany.id,
      name: formData.name,
      org_number: formData.org_number,
      address: formData.address,
      is_vat_registered: formData.is_vat_registered,
      is_favorite: formData.is_favorite
    }, {
      onSuccess: () => {
        setEditingCompany(null);
      }
    });
  };

  const startEditing = (company: PDFCompany) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      org_number: company.org_number || '',
      address: company.address || '',
      is_vat_registered: company.is_vat_registered,
      is_favorite: company.is_favorite
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Selskapsinfo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Select from Saved Companies */}
        {companies.length > 0 && (
          <div>
            <Label>Velg lagret selskap</Label>
            <Select onValueChange={handleSelectCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Velg et selskap..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center gap-2">
                      {company.is_favorite && <Star className="h-3 w-3 text-yellow-500" />}
                      <span>{company.name}</span>
                      {company.org_number && (
                        <span className="text-xs text-muted-foreground">
                          ({company.org_number})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Current Company Info Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="navn">Selskapsnavn</Label>
            <Input
              id="navn"
              value={selskapInfo.navn}
              onChange={(e) => setSelskapInfo((prev: any) => ({ ...prev, navn: e.target.value }))}
              placeholder="Navn på selskap"
            />
          </div>
          <div>
            <Label htmlFor="orgnr">Organisasjonsnummer</Label>
            <Input
              id="orgnr"
              value={selskapInfo.orgnr}
              onChange={(e) => setSelskapInfo((prev: any) => ({ ...prev, orgnr: e.target.value }))}
              placeholder="999 999 999"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Textarea
              id="adresse"
              value={selskapInfo.adresse}
              onChange={(e) => setSelskapInfo((prev: any) => ({ ...prev, adresse: e.target.value }))}
              placeholder="Gateadresse, postnummer og sted"
              rows={2}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mvaRegistrert"
              checked={selskapInfo.mvaRegistrert}
              onCheckedChange={(checked) => 
                setSelskapInfo((prev: any) => ({ ...prev, mvaRegistrert: !!checked }))
              }
            />
            <Label htmlFor="mvaRegistrert">MVA-registrert</Label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveCurrentAsNew}
            disabled={!selskapInfo.navn.trim() || createCompany.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Lagre dette selskapet
          </Button>

          <Dialog open={showNewCompanyDialog} onOpenChange={setShowNewCompanyDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nytt selskap
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Legg til nytt selskap</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-name">Selskapsnavn</Label>
                  <Input
                    id="new-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Navn på selskap"
                  />
                </div>
                <div>
                  <Label htmlFor="new-orgnr">Organisasjonsnummer</Label>
                  <Input
                    id="new-orgnr"
                    value={formData.org_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, org_number: e.target.value }))}
                    placeholder="999 999 999"
                  />
                </div>
                <div>
                  <Label htmlFor="new-address">Adresse</Label>
                  <Textarea
                    id="new-address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Gateadresse, postnummer og sted"
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="new-vat"
                    checked={formData.is_vat_registered}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_vat_registered: !!checked }))
                    }
                  />
                  <Label htmlFor="new-vat">MVA-registrert</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="new-favorite"
                    checked={formData.is_favorite}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_favorite: !!checked }))
                    }
                  />
                  <Label htmlFor="new-favorite">Merk som favoritt</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewCompanyDialog(false)}
                  >
                    Avbryt
                  </Button>
                  <Button
                    onClick={handleCreateCompany}
                    disabled={!formData.name.trim() || createCompany.isPending}
                  >
                    Lagre
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Saved Companies Management */}
        {companies.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Lagrede selskap</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {companies.map(company => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  {editingCompany?.id === company.id ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Selskapsnavn"
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdateCompany}>
                          <Save className="h-3 w-3 mr-1" />
                          Lagre
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditingCompany(null)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Avbryt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {company.is_favorite && <Star className="h-3 w-3 text-yellow-500" />}
                          <span className="font-medium">{company.name}</span>
                        </div>
                        {company.org_number && (
                          <div className="text-xs text-muted-foreground">
                            {company.org_number}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleFavorite.mutate(company.id)}
                        >
                          {company.is_favorite ? 
                            <StarOff className="h-3 w-3" /> : 
                            <Star className="h-3 w-3" />
                          }
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(company)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCompany.mutate(company.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};