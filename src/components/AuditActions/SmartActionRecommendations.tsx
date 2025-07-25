import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  useAuditActionRecommendations, 
  useUpdateRecommendationStatus,
  useClientRiskAssessments 
} from '@/hooks/useAuditActionLibrary';
import { useCopyActionsFromTemplate } from '@/hooks/useAuditActions';
import { Lightbulb, CheckCircle, XCircle, Edit, Clock, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SmartActionRecommendationsProps {
  clientId: string;
  phase?: string;
}

const SmartActionRecommendations = ({ clientId, phase = 'execution' }: SmartActionRecommendationsProps) => {
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [customNotes, setCustomNotes] = useState('');

  const { data: recommendations, isLoading } = useAuditActionRecommendations(clientId);
  const { data: riskAssessments } = useClientRiskAssessments(clientId);
  const updateRecommendationStatus = useUpdateRecommendationStatus();
  const copyActionsFromTemplate = useCopyActionsFromTemplate();
  const { toast } = useToast();

  const handleAcceptRecommendation = async (recommendation: any) => {
    try {
      // Copy the action template to client actions
      await copyActionsFromTemplate.mutateAsync({
        clientId,
        templateIds: [recommendation.action_template_id],
        phase
      });

      // Update recommendation status
      await updateRecommendationStatus.mutateAsync({
        id: recommendation.id,
        status: 'accepted'
      });

      toast({
        title: 'Anbefaling akseptert',
        description: 'Revisjonshandlingen ble lagt til klienten.',
      });
    } catch (error: any) {
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRejectRecommendation = async (recommendationId: string) => {
    try {
      await updateRecommendationStatus.mutateAsync({
        id: recommendationId,
        status: 'rejected'
      });

      toast({
        title: 'Anbefaling avvist',
        description: 'Anbefalingen ble markert som avvist.',
      });
    } catch (error: any) {
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getRecommendationScoreBadge = (score: number) => {
    if (score >= 0.8) return { color: 'bg-green-500 text-white', label: 'Høy relevans' };
    if (score >= 0.6) return { color: 'bg-yellow-500 text-white', label: 'Middels relevans' };
    return { color: 'bg-red-500 text-white', label: 'Lav relevans' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'modified': return <Edit className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingRecommendations = recommendations?.filter(r => r.status === 'pending') || [];
  const processedRecommendations = recommendations?.filter(r => r.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Handlingsforslag
          </CardTitle>
          <CardDescription>
            Intelligente forslag til revisjonshandlinger basert på risikovurdering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingRecommendations.length}</p>
              <p className="text-sm text-muted-foreground">Ventende forslag</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {processedRecommendations.filter(r => r.status === 'accepted').length}
              </p>
              <p className="text-sm text-muted-foreground">Akseptert</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {riskAssessments?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Risikovurderinger</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Recommendations */}
      {pendingRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nye forslag</CardTitle>
            <CardDescription>
              Handlinger foreslått basert på identifiserte risikoer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRecommendations.map((recommendation) => {
                const scoreBadge = getRecommendationScoreBadge(recommendation.recommendation_score);
                return (
                  <div
                    key={recommendation.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">
                            {recommendation.audit_action_templates?.name}
                          </h4>
                          <Badge className={scoreBadge.color}>
                            {scoreBadge.label}
                          </Badge>
                          <Badge variant="outline">
                            {recommendation.audit_action_templates?.subject_area}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {recommendation.audit_action_templates?.description}
                        </p>
                        
                        {recommendation.reasoning && (
                          <div className="bg-blue-50 p-3 rounded-md mb-3">
                            <p className="text-sm text-blue-700">
                              <strong>AI Begrunnelse:</strong> {recommendation.reasoning}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span>
                            Relatert til: {recommendation.client_risk_assessments?.audit_areas?.name}
                          </span>
                          <span>•</span>
                          <span>
                            Risiko: {recommendation.client_risk_assessments?.risk_level}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRecommendation(recommendation);
                            setShowDetailsDialog(true);
                          }}
                        >
                          Detaljer
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRecommendation(recommendation)}
                          disabled={copyActionsFromTemplate.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aksepter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRecommendation(recommendation.id)}
                          disabled={updateRecommendationStatus.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Avvis
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Recommendations */}
      {processedRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Behandlede forslag</CardTitle>
            <CardDescription>
              Tidligere forslag som er akseptert, avvist eller modifisert
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processedRecommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(recommendation.status)}
                    <div>
                      <p className="font-medium text-sm">
                        {recommendation.audit_action_templates?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Behandlet: {new Date(recommendation.updated_at).toLocaleDateString('nb-NO')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {recommendation.status === 'accepted' ? 'Akseptert' :
                     recommendation.status === 'rejected' ? 'Avvist' : 'Modifisert'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No recommendations */}
      {recommendations && recommendations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen forslag tilgjengelig</h3>
            <p className="text-muted-foreground mb-4">
              Det er ingen AI-genererte handlingsforslag for denne klienten ennå.
            </p>
            <Button variant="outline">
              Generer nye forslag
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Handlingsdetaljer</DialogTitle>
            <DialogDescription>
              Detaljert informasjon om den foreslåtte revisjonshandlingen
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecommendation && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Handlingsnavn</Label>
                <p className="text-sm mt-1">{selectedRecommendation.audit_action_templates?.name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Prosedyrer</Label>
                <div className="text-sm mt-1 p-3 bg-muted rounded-md">
                  {selectedRecommendation.audit_action_templates?.procedures || 'Ingen prosedyrer definert'}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Estimert tid</Label>
                <p className="text-sm mt-1">
                  {selectedRecommendation.audit_action_templates?.estimated_hours || 'Ikke spesifisert'} timer
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">AI Metadata</Label>
                <div className="text-sm mt-1 p-3 bg-muted rounded-md">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(selectedRecommendation.ai_metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartActionRecommendations;