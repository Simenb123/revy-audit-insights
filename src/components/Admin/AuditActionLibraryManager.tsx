import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  useAuditActionAreaMappings, 
  useCreateAuditActionAreaMapping,
  useAuditActionRiskMappings,
  useCreateAuditActionRiskMapping
} from '@/hooks/useAuditActionLibrary';
import { useAuditActionTemplates } from '@/hooks/useAuditActions';
import { Plus, Link, Target, BookOpen, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuditActionLibraryManager = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedRisk, setSelectedRisk] = useState<string>('');
  const [newMappingDialog, setNewMappingDialog] = useState(false);
  const [mappingType, setMappingType] = useState<'area' | 'risk'>('area');

  const { data: actionTemplates } = useAuditActionTemplates();
  const { data: areaMappings } = useAuditActionAreaMappings();
  const { data: riskMappings } = useAuditActionRiskMappings();
  const createAreaMapping = useCreateAuditActionAreaMapping();
  const createRiskMapping = useCreateAuditActionRiskMapping();
  const { toast } = useToast();

  // Mock data for areas and risks (replace with actual hooks)
  const auditAreas = [
    { id: '1', name: 'Kundefordringer', audit_number: 1500 },
    { id: '2', name: 'Varelager', audit_number: 1200 },
    { id: '3', name: 'Salgsinntekter', audit_number: 1400 },
    { id: '4', name: 'Lønn', audit_number: 2600 },
  ];

  const riskFactors = [
    { id: '1', name: 'Høy kundekonsentrasjon', category: 'operational' },
    { id: '2', name: 'Svak internkontroll', category: 'control' },
    { id: '3', name: 'Komplekse transaksjoner', category: 'transaction' },
  ];

  const handleCreateMapping = () => {
    // Placeholder for creating new mappings
    toast({
      title: 'Funksjonalitet kommer',
      description: 'Kartlegging av handlinger vil bli implementert.',
    });
    setNewMappingDialog(false);
  };

  const getRelevanceBadgeColor = (level: string) => {
    switch (level) {
      case 'primary': return 'bg-primary text-primary-foreground';
      case 'secondary': return 'bg-secondary text-secondary-foreground';
      case 'optional': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEffectivenessBadgeColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-red-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revisjonshandlinger Bibliotek</h1>
          <p className="text-muted-foreground">
            Administrer og organiser revisjonshandlinger knyttet til områder og risikofaktorer
          </p>
        </div>
        <Dialog open={newMappingDialog} onOpenChange={setNewMappingDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny kartlegging
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Opprett ny kartlegging</DialogTitle>
              <DialogDescription>
                Koble en revisjonshandling til et område eller risikofaktor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type kartlegging</Label>
                <Select value={mappingType} onValueChange={(value: 'area' | 'risk') => setMappingType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area">Område</SelectItem>
                    <SelectItem value="risk">Risikofaktor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateMapping} className="flex-1">
                  Opprett
                </Button>
                <Button variant="outline" onClick={() => setNewMappingDialog(false)} className="flex-1">
                  Avbryt
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{actionTemplates?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Handlingsmaler</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{areaMappings?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Område-kartlegginger</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{riskMappings?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Risiko-kartlegginger</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-muted-foreground">Dekning</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="area-mappings">Område-kartlegginger</TabsTrigger>
          <TabsTrigger value="risk-mappings">Risiko-kartlegginger</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Areas Coverage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Områdedekning
                </CardTitle>
                <CardDescription>
                  Revisjonshandlinger per revisjonsområde
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditAreas.map((area) => {
                    const areaActionCount = areaMappings?.filter(m => m.audit_area_id === area.id).length || 0;
                    return (
                      <div key={area.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{area.name}</p>
                          <p className="text-sm text-muted-foreground">#{area.audit_number}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{areaActionCount} handlinger</Badge>
                          {areaActionCount > 0 && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Risk Coverage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risikodekning
                </CardTitle>
                <CardDescription>
                  Revisjonshandlinger per risikofaktor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskFactors.map((risk) => {
                    const riskActionCount = riskMappings?.filter(m => m.risk_factor_id === risk.id).length || 0;
                    return (
                      <div key={risk.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{risk.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{risk.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{riskActionCount} handlinger</Badge>
                          {riskActionCount > 0 && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="area-mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Område-kartlegginger</CardTitle>
              <CardDescription>
                Revisjonshandlinger knyttet til spesifikke revisjonsområder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <Select value={selectedArea} onValueChange={setSelectedArea}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Velg område" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle områder</SelectItem>
                      {auditAreas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Area Mappings List */}
                <div className="space-y-2">
                  {areaMappings?.map((mapping) => (
                    <div key={mapping.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Link className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {mapping.audit_action_templates?.name || 'Ukjent handling'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {mapping.audit_areas?.name || 'Ukjent område'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRelevanceBadgeColor(mapping.relevance_level)}>
                          {mapping.relevance_level}
                        </Badge>
                        <Badge variant="outline">
                          Posisjon {mapping.sort_order}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-8">
                      Ingen område-kartlegginger funnet
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk-mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risiko-kartlegginger</CardTitle>
              <CardDescription>
                Revisjonshandlinger knyttet til risikofaktorer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <Select value={selectedRisk} onValueChange={setSelectedRisk}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Velg risikofaktor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle risikofaktorer</SelectItem>
                      {riskFactors.map((risk) => (
                        <SelectItem key={risk.id} value={risk.id}>
                          {risk.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Risk Mappings List */}
                <div className="space-y-2">
                  {riskMappings?.map((mapping) => (
                    <div key={mapping.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {mapping.audit_action_templates?.name || 'Ukjent handling'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {mapping.risk_factors?.name || 'Ukjent risikofaktor'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getEffectivenessBadgeColor(mapping.effectiveness_level)}>
                          {mapping.effectiveness_level} effektivitet
                        </Badge>
                        <Badge variant="outline">
                          {mapping.response_type}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-8">
                      Ingen risiko-kartlegginger funnet
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditActionLibraryManager;