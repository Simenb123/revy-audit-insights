import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Clock, CheckCircle, FileText, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamMeetingFormProps {
  sessionId: string;
  onComplete?: (meetingData: TeamMeetingData) => void;
}

interface TeamMeetingData {
  meetingType: 'planning' | 'progress' | 'conclusion';
  participants: string[];
  chairman: string;
  agenda: AgendaItem[];
  minutes: string;
  actionItems: ActionItem[];
  isaReferences: string[];
  assertions: string[];
  duration: number;
}

interface AgendaItem {
  id: string;
  title: string;
  description: string;
  responsible: string;
  completed: boolean;
  isaStandard?: string;
  assertions?: string[];
}

interface ActionItem {
  id: string;
  description: string;
  responsible: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

const STANDARD_AGENDA_ITEMS = {
  planning: [
    {
      id: 'risk-assessment',
      title: 'Risikovurdering',
      description: 'Gjennomgå og vurdere identifiserte risikoer',
      isaStandard: 'ISA 315',
      assertions: ['Gyldighet', 'Fullstendighet', 'Nøyaktighet']
    },
    {
      id: 'materiality',
      title: 'Vesentlighet',
      description: 'Fastsette vesentlighetsgrenser og arbeidsvesentlighet',
      isaStandard: 'ISA 320',
      assertions: ['Nøyaktighet', 'Klassifisering']
    },
    {
      id: 'audit-strategy',
      title: 'Revisjonsstrategi',
      description: 'Planlegge revisjonsstrategi og tilnærming',
      isaStandard: 'ISA 300',
      assertions: ['Gyldighet', 'Fullstendighet', 'Periodisering']
    },
    {
      id: 'sampling-approach',
      title: 'Utvalgsmetoder',
      description: 'Bestemme utvalgsmetoder og størrelser',
      isaStandard: 'ISA 530',
      assertions: ['Gyldighet', 'Fullstendighet']
    }
  ],
  progress: [
    {
      id: 'progress-review',
      title: 'Fremdrift',
      description: 'Status på gjennomførte revisjonshandlinger',
      isaStandard: 'ISA 220',
      assertions: []
    },
    {
      id: 'findings-review',
      title: 'Gjennomgang av funn',
      description: 'Diskutere identifiserte avvik og feil',
      isaStandard: 'ISA 450',
      assertions: ['Gyldighet', 'Nøyaktighet']
    }
  ],
  conclusion: [
    {
      id: 'evaluation',
      title: 'Evaluering av bevis',
      description: 'Vurdere tilstrekkelig og hensiktsmessig revisjonsbevis',
      isaStandard: 'ISA 500',
      assertions: ['Gyldighet', 'Fullstendighet', 'Nøyaktighet']
    },
    {
      id: 'conclusion',
      title: 'Konklusjon',
      description: 'Formulere revisjonsmessig konklusjon',
      isaStandard: 'ISA 700',
      assertions: []
    }
  ]
};

const ISA_STANDARDS = [
  'ISA 200', 'ISA 220', 'ISA 230', 'ISA 300', 'ISA 315', 'ISA 320', 
  'ISA 330', 'ISA 450', 'ISA 500', 'ISA 530', 'ISA 540', 'ISA 700'
];

const ASSERTIONS = [
  'Gyldighet', 'Fullstendighet', 'Nøyaktighet', 'Periodisering', 'Klassifisering'
];

export const TeamMeetingForm: React.FC<TeamMeetingFormProps> = ({ 
  sessionId, 
  onComplete 
}) => {
  const [step, setStep] = useState(1);
  const [meetingData, setMeetingData] = useState<TeamMeetingData>({
    meetingType: 'planning',
    participants: [''],
    chairman: '',
    agenda: [],
    minutes: '',
    actionItems: [],
    isaReferences: [],
    assertions: [],
    duration: 0
  });
  
  const [startTime] = useState(Date.now());
  const { toast } = useToast();

  // Initialize agenda based on meeting type
  React.useEffect(() => {
    const standardItems = STANDARD_AGENDA_ITEMS[meetingData.meetingType].map(item => ({
      ...item,
      responsible: '',
      completed: false
    }));
    
    setMeetingData(prev => ({
      ...prev,
      agenda: standardItems
    }));
  }, [meetingData.meetingType]);

  // Update duration continuously
  React.useEffect(() => {
    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - startTime) / 1000 / 60);
      setMeetingData(prev => ({ ...prev, duration }));
    }, 60000);

    return () => clearInterval(interval);
  }, [startTime]);

  const handleAgendaItemChange = (itemId: string, field: keyof AgendaItem, value: any) => {
    setMeetingData(prev => ({
      ...prev,
      agenda: prev.agenda.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  };

  const addActionItem = () => {
    const newItem: ActionItem = {
      id: `action-${Date.now()}`,
      description: '',
      responsible: '',
      dueDate: '',
      priority: 'medium',
      completed: false
    };
    
    setMeetingData(prev => ({
      ...prev,
      actionItems: [...prev.actionItems, newItem]
    }));
  };

  const handleActionItemChange = (itemId: string, field: keyof ActionItem, value: any) => {
    setMeetingData(prev => ({
      ...prev,
      actionItems: prev.actionItems.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  };

  const addParticipant = () => {
    setMeetingData(prev => ({
      ...prev,
      participants: [...prev.participants, '']
    }));
  };

  const handleParticipantChange = (index: number, value: string) => {
    setMeetingData(prev => ({
      ...prev,
      participants: prev.participants.map((p, i) => i === index ? value : p)
    }));
  };

  const handleComplete = () => {
    // Validate required fields
    if (!meetingData.chairman || meetingData.participants.filter(p => p.trim()).length === 0) {
      toast({
        title: "Manglende informasjon",
        description: "Møteleder og deltakere må fylles inn.",
        variant: "destructive",
      });
      return;
    }

    if (meetingData.agenda.filter(item => item.completed).length === 0) {
      toast({
        title: "Agenda ikke fullført",
        description: "Minst ett agendapunkt må markeres som fullført.",
        variant: "destructive",
      });
      return;
    }

    const completedAssertions = new Set<string>();
    meetingData.agenda.forEach(item => {
      if (item.completed && item.assertions) {
        item.assertions.forEach(assertion => completedAssertions.add(assertion));
      }
    });

    const finalData = {
      ...meetingData,
      assertions: Array.from(completedAssertions),
      isaReferences: Array.from(new Set(
        meetingData.agenda
          .filter(item => item.completed && item.isaStandard)
          .map(item => item.isaStandard!)
      ))
    };

    onComplete?.(finalData);
    
    toast({
      title: "Teammøte fullført",
      description: `Møtet ble gjennomført på ${meetingData.duration} minutter med ${completedAssertions.size} påstander dekket.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teammøte - Nordic Varehandel AS
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {meetingData.duration} min
              </Badge>
              
              <Badge variant="secondary">
                {meetingData.meetingType === 'planning' && 'Planlegging'}
                {meetingData.meetingType === 'progress' && 'Fremdrift'}
                {meetingData.meetingType === 'conclusion' && 'Konklusjon'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Møteoppsett</CardTitle>
            <CardDescription>
              Konfigurer møtetype, deltakere og møteleder
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Meeting Type */}
            <div>
              <Label className="text-base font-medium">Møtetype</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {[
                  { value: 'planning', label: 'Planlegging', desc: 'Planlegge revisjonsstrategi' },
                  { value: 'progress', label: 'Fremdrift', desc: 'Gjennomgå status og funn' },
                  { value: 'conclusion', label: 'Konklusjon', desc: 'Evaluere og konkludere' }
                ].map(type => (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      meetingData.meetingType === type.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setMeetingData(prev => ({ 
                      ...prev, 
                      meetingType: type.value as any 
                    }))}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chairman */}
            <div>
              <Label htmlFor="chairman">Møteleder</Label>
              <Input
                id="chairman"
                value={meetingData.chairman}
                onChange={(e) => setMeetingData(prev => ({ 
                  ...prev, 
                  chairman: e.target.value 
                }))}
                placeholder="Navn på møteleder"
              />
            </div>

            {/* Participants */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Deltakere</Label>
                <Button variant="outline" size="sm" onClick={addParticipant}>
                  Legg til deltaker
                </Button>
              </div>
              
              <div className="space-y-2 mt-2">
                {meetingData.participants.map((participant, index) => (
                  <Input
                    key={index}
                    value={participant}
                    onChange={(e) => handleParticipantChange(index, e.target.value)}
                    placeholder={`Deltaker ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>
                Fortsett til agenda
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Agenda og gjennomføring</CardTitle>
            <CardDescription>
              Gå gjennom agendapunktene og merk dem som fullført
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {meetingData.agenda.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) => 
                          handleAgendaItemChange(item.id, 'completed', checked)
                        }
                      />
                      
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 ml-6">
                      <div className="flex items-center gap-4 text-sm">
                        {item.isaStandard && (
                          <Badge variant="outline" className="text-xs">
                            {item.isaStandard}
                          </Badge>
                        )}
                        
                        {item.assertions && item.assertions.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>Påstander: {item.assertions.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2">
                        <Input
                          placeholder="Ansvarlig person"
                          value={item.responsible}
                          onChange={(e) => 
                            handleAgendaItemChange(item.id, 'responsible', e.target.value)
                          }
                          className="max-w-xs"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {item.completed && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Tilbake
              </Button>
              <Button onClick={() => setStep(3)}>
                Fortsett til referat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Referat og oppfølging</CardTitle>
            <CardDescription>
              Skriv referat og definer oppfølgingsoppgaver
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Minutes */}
            <div>
              <Label htmlFor="minutes">Referat</Label>
              <Textarea
                id="minutes"
                value={meetingData.minutes}
                onChange={(e) => setMeetingData(prev => ({ 
                  ...prev, 
                  minutes: e.target.value 
                }))}
                placeholder="Sammendrag av diskusjoner, beslutninger og konklusjoner..."
                rows={6}
              />
            </div>

            {/* Action Items */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Oppfølgingsoppgaver</Label>
                <Button variant="outline" size="sm" onClick={addActionItem}>
                  Legg til oppgave
                </Button>
              </div>
              
              <div className="space-y-3 mt-4">
                {meetingData.actionItems.map((action) => (
                  <div key={action.id} className="border rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Beskrivelse av oppgave"
                        value={action.description}
                        onChange={(e) => 
                          handleActionItemChange(action.id, 'description', e.target.value)
                        }
                      />
                      
                      <Input
                        placeholder="Ansvarlig person"
                        value={action.responsible}
                        onChange={(e) => 
                          handleActionItemChange(action.id, 'responsible', e.target.value)
                        }
                      />
                      
                      <Input
                        type="date"
                        value={action.dueDate}
                        onChange={(e) => 
                          handleActionItemChange(action.id, 'dueDate', e.target.value)
                        }
                      />
                      
                      <select
                        value={action.priority}
                        onChange={(e) => 
                          handleActionItemChange(action.id, 'priority', e.target.value)
                        }
                        className="p-2 border rounded"
                      >
                        <option value="low">Lav prioritet</option>
                        <option value="medium">Middels prioritet</option>
                        <option value="high">Høy prioritet</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <Separator />
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Møtesammendrag</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Varighet</div>
                  <div>{meetingData.duration} minutter</div>
                </div>
                
                <div>
                  <div className="font-medium">Fullførte agendapunkter</div>
                  <div>{meetingData.agenda.filter(item => item.completed).length} av {meetingData.agenda.length}</div>
                </div>
                
                <div>
                  <div className="font-medium">Oppfølgingsoppgaver</div>
                  <div>{meetingData.actionItems.length} oppgaver</div>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="font-medium">Dekkede påstander:</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.from(new Set(
                    meetingData.agenda
                      .filter(item => item.completed)
                      .flatMap(item => item.assertions || [])
                  )).map(assertion => (
                    <Badge key={assertion} variant="secondary" className="text-xs">
                      {assertion}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Tilbake
              </Button>
              <Button onClick={handleComplete}>
                <FileText className="h-4 w-4 mr-2" />
                Fullfør teammøte
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};