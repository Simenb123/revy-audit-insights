import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  ListChecks, 
  Wand2,
  Filter,
  Search,
  Download,
  Upload,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

const AuditActionGenerator = () => {
  const [selectedPhase, setSelectedPhase] = useState('execution');
  const [selectedSubjectArea, setSelectedSubjectArea] = useState('sales');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [generatorDialogOpen, setGeneratorDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual data from hooks
  const phases = [
    { value: 'engagement', label: 'Oppdragsaksept' },
    { value: 'planning', label: 'Planlegging' },
    { value: 'execution', label: 'Gjennomføring' },
    { value: 'conclusion', label: 'Avslutning' }
  ];

  const subjectAreas = [
    { value: 'sales', label: 'Inntekter/Salg' },
    { value: 'inventory', label: 'Varelager' },
    { value: 'payroll', label: 'Lønn' },
    { value: 'banking', label: 'Bank' },
    { value: 'fixed_assets', label: 'Anleggsmidler' },
    { value: 'accounts_payable', label: 'Leverandørgjeld' },
    { value: 'accounts_receivable', label: 'Kundefordringer' }
  ];

  const actionTypes = [
    { value: 'substantive', label: 'Substanshandling' },
    { value: 'control_test', label: 'Kontrolltest' },
    { value: 'analytical', label: 'Analytisk handling' },
    { value: 'inquiry', label: 'Forespørsel' },
    { value: 'observation', label: 'Observasjon' },
    { value: 'inspection', label: 'Inspeksjon' },
    { value: 'recalculation', label: 'Omberegning' }
  ];

  const riskLevels = [
    { value: 'low', label: 'Lav risiko' },
    { value: 'medium', label: 'Middels risiko' },
    { value: 'high', label: 'Høy risiko' }
  ];

  const actions = [
    {
      id: '1',
      name: 'Salgsinntekter - Utvalgstest',
      subject_area: 'sales',
      action_type: 'substantive',
      phase: 'execution',
      risk_level: 'high',
      estimated_hours: 4,
      description: 'Utføre utvalgstest av salgstransaksjoner',
      procedures: 'Velg utvalg, test mot bilag, kontroller bokføring',
      is_system_template: true
    },
    {
      id: '2',
      name: 'Varelager - Fysisk opptelling',
      subject_area: 'inventory',
      action_type: 'substantive',
      phase: 'execution',
      risk_level: 'high',
      estimated_hours: 6,
      description: 'Fysisk opptelling av varelager',
      procedures: 'Delta på opptelling, test tellinger, kontroller verdisetting',
      is_system_template: false
    }
  ];

  const filteredActions = actions.filter(action => 
    action.phase === selectedPhase &&
    action.subject_area === selectedSubjectArea &&
    (searchTerm === '' || action.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateAction = (formData) => {
    console.log('Creating action:', formData);
    toast.success('Revisjonshandling opprettet');
    setCreateDialogOpen(false);
  };

  const handleGenerateActions = (generatorData) => {
    console.log('Generating actions:', generatorData);
    toast.success('AI-genererte handlinger opprettet');
    setGeneratorDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Revisjonshandlinger Generator
            </span>
            <div className="flex gap-2">
              <Dialog open={generatorDialogOpen} onOpenChange={setGeneratorDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Wand2 className="h-4 w-4" />
                    AI Generator
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>AI Handlings-Generator</DialogTitle>
                  </DialogHeader>
                  <ActionGeneratorForm onSubmit={handleGenerateActions} />
                </DialogContent>
              </Dialog>
              
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ny Handling
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Opprett Revisjonshandling</DialogTitle>
                  </DialogHeader>
                  <ActionForm onSubmit={handleCreateAction} />
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manage" className="w-full">
            <TabsList>
              <TabsTrigger value="manage">Administrer</TabsTrigger>
              <TabsTrigger value="templates">Maler</TabsTrigger>
              <TabsTrigger value="phase-config">Fase-konfigurasjon</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Operasjoner</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manage" className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Velg fase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((phase) => (
                      <SelectItem key={phase.value} value={phase.value}>
                        {phase.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSubjectArea} onValueChange={setSelectedSubjectArea}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Velg fagområde" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectAreas.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk handlinger..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Actions List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {phases.find(p => p.value === selectedPhase)?.label} - {subjectAreas.find(s => s.value === selectedSubjectArea)?.label}
                  </h3>
                  <Badge variant="outline">
                    {filteredActions.length} handlinger
                  </Badge>
                </div>

                <div className="grid gap-4">
                  {filteredActions.map((action) => (
                    <ActionCard key={action.id} action={action} />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <TemplatesPanel />
            </TabsContent>

            <TabsContent value="phase-config" className="space-y-4">
              <PhaseConfigPanel />
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <BulkOperationsPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const ActionCard = ({ action }) => {
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{action.name}</h4>
              <Badge className={getRiskColor(action.risk_level)}>
                {action.risk_level}
              </Badge>
              {action.is_system_template && (
                <Badge variant="outline">System</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {action.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Estimerte timer: {action.estimated_hours}</span>
              <span>Type: {action.action_type}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost">
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ActionForm = ({ action, onSubmit }: { action?: any; onSubmit: any }) => {
  const [formData, setFormData] = useState({
    name: action?.name || '',
    description: action?.description || '',
    objective: action?.objective || '',
    procedures: action?.procedures || '',
    documentation_requirements: action?.documentation_requirements || '',
    subject_area: action?.subject_area || 'sales',
    action_type: action?.action_type || 'substantive',
    phase: action?.phase || 'execution',
    risk_level: action?.risk_level || 'medium',
    estimated_hours: action?.estimated_hours || 2,
    applicable_phases: action?.applicable_phases || ['execution']
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="estimated_hours">Estimerte timer</Label>
          <Input
            id="estimated_hours"
            type="number"
            step="0.5"
            value={formData.estimated_hours}
            onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 0 }))}
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
        <Label htmlFor="objective">Mål</Label>
        <Textarea
          id="objective"
          value={formData.objective}
          onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="procedures">Prosedyrer</Label>
        <Textarea
          id="procedures"
          value={formData.procedures}
          onChange={(e) => setFormData(prev => ({ ...prev, procedures: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="subject_area">Fagområde</Label>
          <Select 
            value={formData.subject_area} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, subject_area: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Inntekter/Salg</SelectItem>
              <SelectItem value="inventory">Varelager</SelectItem>
              <SelectItem value="payroll">Lønn</SelectItem>
              <SelectItem value="banking">Bank</SelectItem>
              <SelectItem value="fixed_assets">Anleggsmidler</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="action_type">Handlingstype</Label>
          <Select 
            value={formData.action_type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, action_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="substantive">Substanshandling</SelectItem>
              <SelectItem value="control_test">Kontrolltest</SelectItem>
              <SelectItem value="analytical">Analytisk handling</SelectItem>
              <SelectItem value="inquiry">Forespørsel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="risk_level">Risikonivå</Label>
          <Select 
            value={formData.risk_level} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, risk_level: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Lav risiko</SelectItem>
              <SelectItem value="medium">Middels risiko</SelectItem>
              <SelectItem value="high">Høy risiko</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {action ? 'Oppdater' : 'Opprett'}
        </Button>
        <Button type="button" variant="outline">
          Avbryt
        </Button>
      </div>
    </form>
  );
};

const ActionGeneratorForm = ({ onSubmit }: { onSubmit: any }) => {
  const [generatorData, setGeneratorData] = useState({
    client_type: '',
    industry: '',
    risk_assessment: 'medium',
    phases: ['execution'],
    subject_areas: ['sales'],
    include_controls: true,
    include_substantive: true,
    custom_requirements: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(generatorData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_type">Klienttype</Label>
          <Select 
            value={generatorData.client_type} 
            onValueChange={(value) => setGeneratorData(prev => ({ ...prev, client_type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg klienttype" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Liten bedrift</SelectItem>
              <SelectItem value="medium">Mellomstore bedrift</SelectItem>
              <SelectItem value="large">Stor bedrift</SelectItem>
              <SelectItem value="listed">Børsnotert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="industry">Bransje</Label>
          <Select 
            value={generatorData.industry} 
            onValueChange={(value) => setGeneratorData(prev => ({ ...prev, industry: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg bransje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Detaljhandel</SelectItem>
              <SelectItem value="manufacturing">Produksjon</SelectItem>
              <SelectItem value="services">Tjenester</SelectItem>
              <SelectItem value="finance">Finans</SelectItem>
              <SelectItem value="technology">Teknologi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="risk_assessment">Risikovurdering</Label>
        <Select 
          value={generatorData.risk_assessment} 
          onValueChange={(value) => setGeneratorData(prev => ({ ...prev, risk_assessment: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Lav risiko</SelectItem>
            <SelectItem value="medium">Middels risiko</SelectItem>
            <SelectItem value="high">Høy risiko</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Inkluder handlingstyper</Label>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="include_controls"
            checked={generatorData.include_controls}
            onCheckedChange={(checked) => setGeneratorData(prev => ({ ...prev, include_controls: Boolean(checked) }))}
          />
          <Label htmlFor="include_controls">Kontrolltester</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="include_substantive"
            checked={generatorData.include_substantive}
            onCheckedChange={(checked) => setGeneratorData(prev => ({ ...prev, include_substantive: Boolean(checked) }))}
          />
          <Label htmlFor="include_substantive">Substanshandlinger</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="custom_requirements">Spesielle krav</Label>
        <Textarea
          id="custom_requirements"
          value={generatorData.custom_requirements}
          onChange={(e) => setGeneratorData(prev => ({ ...prev, custom_requirements: e.target.value }))}
          placeholder="Beskriva spesielle krav eller forhold som skal vektlegges..."
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="gap-2">
          <Wand2 className="h-4 w-4" />
          Generer Handlinger
        </Button>
        <Button type="button" variant="outline">
          Avbryt
        </Button>
      </div>
    </form>
  );
};

const TemplatesPanel = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Handlingsmaler</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Maler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              ISA Standard Handlinger
            </Button>
            <Button variant="outline" className="w-full">
              Bransjespesifikke Maler
            </Button>
            <Button variant="outline" className="w-full">
              Risiko-baserte Maler
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Egendefinerte Maler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Mine Maler
            </Button>
            <Button variant="outline" className="w-full">
              Firma Maler
            </Button>
            <Button className="w-full">
              Opprett Ny Mal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const PhaseConfigPanel = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Fase-konfigurasjon</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['engagement', 'planning', 'execution', 'conclusion'].map((phase) => (
          <Card key={phase}>
            <CardHeader>
              <CardTitle className="text-base capitalize">{phase}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" variant="outline" className="w-full">
                Konfigurer Handlinger
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                Standard Prosedyrer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const BulkOperationsPanel = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Bulk Operasjoner</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import/Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full gap-2">
              <Upload className="h-4 w-4" />
              Importer Excel
            </Button>
            <Button variant="outline" className="w-full gap-2">
              <Download className="h-4 w-4" />
              Eksporter Excel
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bulk Redigering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Oppdater Timer
            </Button>
            <Button variant="outline" className="w-full">
              Endre Risikonivå
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organisering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Sorter Handlinger
            </Button>
            <Button variant="outline" className="w-full">
              Gruppert Handlinger
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditActionGenerator;
