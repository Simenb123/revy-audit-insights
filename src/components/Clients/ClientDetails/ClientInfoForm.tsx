
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, Edit, X } from 'lucide-react';
import { Client } from '@/types/revio';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ClientInfoFormProps {
  client: Client;
}

interface ClientContact {
  id?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  is_primary: boolean;
}

// Populære norske regnskapssystemer
const accountingSystems = [
  'Visma Business',
  'PowerOffice',
  'Fiken',
  'Tripletex',
  'Visma eAccounting',
  'Visma.net',
  'Mamut',
  'Xledger',
  'Unit4 Business World',
  'SAP',
  'Annet'
];

const ClientInfoForm = ({ client }: ClientInfoFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [showCustomAccountingSystem, setShowCustomAccountingSystem] = useState(false);
  const [formData, setFormData] = useState({
    accounting_system: '',
    previous_auditor: '',
    audit_fee: '',
    year_end_date: '',
    board_meetings_per_year: '',
    internal_controls: '',
    risk_assessment: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    // Initialize form data with client data
    setFormData({
      accounting_system: client.accountingSystem || '',
      previous_auditor: client.previousAuditor || '',
      audit_fee: client.auditFee?.toString() || '',
      year_end_date: client.yearEndDate || '',
      board_meetings_per_year: client.boardMeetingsPerYear?.toString() || '',
      internal_controls: client.internalControls || '',
      risk_assessment: client.riskAssessment || '',
    });

    // Check if current accounting system is in predefined list
    const isCustomSystem = client.accountingSystem && 
      !accountingSystems.includes(client.accountingSystem) && 
      client.accountingSystem !== '';
    setShowCustomAccountingSystem(isCustomSystem);
  }, [client]);

  const handleAccountingSystemChange = (value: string) => {
    if (value === 'Annet') {
      setShowCustomAccountingSystem(true);
      setFormData({...formData, accounting_system: ''});
    } else {
      setShowCustomAccountingSystem(false);
      setFormData({...formData, accounting_system: value});
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Update client extended information
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          accounting_system: formData.accounting_system || null,
          previous_auditor: formData.previous_auditor || null,
          audit_fee: formData.audit_fee ? parseFloat(formData.audit_fee) : null,
          year_end_date: formData.year_end_date || null,
          board_meetings_per_year: formData.board_meetings_per_year ? parseInt(formData.board_meetings_per_year) : null,
          internal_controls: formData.internal_controls || null,
          risk_assessment: formData.risk_assessment || null,
        })
        .eq('id', client.id);

      if (clientError) throw clientError;

      // Save contacts
      for (const contact of contacts) {
        if (contact.id) {
          // Update existing contact
          const { error } = await supabase
            .from('client_contacts')
            .update({
              name: contact.name,
              role: contact.role,
              email: contact.email,
              phone: contact.phone,
              is_primary: contact.is_primary,
            })
            .eq('id', contact.id);
          
          if (error) throw error;
        } else {
          // Create new contact
          const { error } = await supabase
            .from('client_contacts')
            .insert({
              client_id: client.id,
              name: contact.name,
              role: contact.role,
              email: contact.email,
              phone: contact.phone,
              is_primary: contact.is_primary,
            });
          
          if (error) throw error;
        }
      }

      toast({
        title: "Lagret",
        description: "Klientinformasjon er oppdatert",
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving client info:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke lagre endringer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addContact = () => {
    setContacts([...contacts, {
      name: '',
      role: '',
      email: '',
      phone: '',
      is_primary: false,
    }]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: string, value: string | boolean) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setContacts(updatedContacts);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Klientinformasjon</h2>
          <p className="text-gray-600">Administrer utvidet informasjon om klienten</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Avbryt
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Lagrer...' : 'Lagre'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Rediger
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounting Information */}
        <Card>
          <CardHeader>
            <CardTitle>Regnskapsinformasjon</CardTitle>
            <CardDescription>Detaljer om regnskapsføring og systemer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="accounting_system">Regnskapssystem</Label>
              {isEditing ? (
                <div className="space-y-2">
                  <Select 
                    value={showCustomAccountingSystem ? 'Annet' : formData.accounting_system} 
                    onValueChange={handleAccountingSystemChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg regnskapssystem" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountingSystems.map((system) => (
                        <SelectItem key={system} value={system}>
                          {system}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showCustomAccountingSystem && (
                    <Input
                      placeholder="Skriv inn regnskapssystem"
                      value={formData.accounting_system}
                      onChange={(e) => setFormData({...formData, accounting_system: e.target.value})}
                    />
                  )}
                </div>
              ) : (
                <Input
                  value={formData.accounting_system}
                  disabled
                  placeholder="Ikke angitt"
                />
              )}
            </div>
            <div>
              <Label htmlFor="previous_auditor">Tidligere revisor</Label>
              <Input
                id="previous_auditor"
                value={formData.previous_auditor}
                onChange={(e) => setFormData({...formData, previous_auditor: e.target.value})}
                disabled={!isEditing}
                placeholder="Navn på tidligere revisor"
              />
            </div>
            <div>
              <Label htmlFor="year_end_date">Regnskapsårets slutt</Label>
              <Input
                id="year_end_date"
                type="date"
                value={formData.year_end_date}
                onChange={(e) => setFormData({...formData, year_end_date: e.target.value})}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Audit Information */}
        <Card>
          <CardHeader>
            <CardTitle>Revisjonsinformasjon</CardTitle>
            <CardDescription>Honorar og styringsdetaljer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="audit_fee">Revisjonshonorar (NOK)</Label>
              <Input
                id="audit_fee"
                type="number"
                value={formData.audit_fee}
                onChange={(e) => setFormData({...formData, audit_fee: e.target.value})}
                disabled={!isEditing}
                placeholder="Årlig revisjonshonorar"
              />
            </div>
            <div>
              <Label htmlFor="board_meetings_per_year">Styremøter per år</Label>
              <Input
                id="board_meetings_per_year"
                type="number"
                value={formData.board_meetings_per_year}
                onChange={(e) => setFormData({...formData, board_meetings_per_year: e.target.value})}
                disabled={!isEditing}
                placeholder="Antall møter"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment and Internal Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Intern kontroll</CardTitle>
            <CardDescription>Vurdering av selskapets interne kontrollsystemer</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.internal_controls}
              onChange={(e) => setFormData({...formData, internal_controls: e.target.value})}
              disabled={!isEditing}
              placeholder="Beskriv intern kontroll, systemer, prosedyrer..."
              rows={6}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risikovurdering</CardTitle>
            <CardDescription>Identifiserte risikoområder og vurderinger</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.risk_assessment}
              onChange={(e) => setFormData({...formData, risk_assessment: e.target.value})}
              disabled={!isEditing}
              placeholder="Beskriv identifiserte risikoer, vesentlighet, kontroller..."
              rows={6}
            />
          </CardContent>
        </Card>
      </div>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Nøkkelpersoner
            {isEditing && (
              <Button size="sm" onClick={addContact}>
                <Plus className="w-4 h-4 mr-2" />
                Legg til person
              </Button>
            )}
          </CardTitle>
          <CardDescription>Viktige kontaktpersoner i selskapet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contacts.map((contact, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor={`name-${index}`}>Navn</Label>
                  <Input
                    id={`name-${index}`}
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Fullt navn"
                  />
                </div>
                <div>
                  <Label htmlFor={`role-${index}`}>Rolle</Label>
                  <Input
                    id={`role-${index}`}
                    value={contact.role}
                    onChange={(e) => updateContact(index, 'role', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Stilling/rolle"
                  />
                </div>
                <div>
                  <Label htmlFor={`email-${index}`}>E-post</Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                    disabled={!isEditing}
                    placeholder="E-postadresse"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`phone-${index}`}>Telefon</Label>
                    <Input
                      id={`phone-${index}`}
                      value={contact.phone}
                      onChange={(e) => updateContact(index, 'phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Telefonnummer"
                    />
                  </div>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeContact(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {contacts.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                {isEditing ? 'Klikk "Legg til person" for å legge til en kontaktperson' : 'Ingen kontaktpersoner registrert'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientInfoForm;
