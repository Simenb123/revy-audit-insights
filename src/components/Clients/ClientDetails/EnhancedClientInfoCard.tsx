import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Calendar, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatOrgNumber } from '@/utils/formatOrgNumber';
import EditableClientField from './EditableClientField';
import EmployeeCountField from './EmployeeCountField';
import { useClientTeamMembers } from '@/hooks/useClientTeamMembers';
import { useFinancialFrameworkValidation } from '@/hooks/useFinancialFrameworkValidation';
import { useClientAnnualData } from '@/hooks/useClientAnnualData';
import { FinancialFrameworkType } from '@/types/client-extended';
import { Client } from '@/types/revio';

interface EnhancedClientInfoCardProps {
  client: Client;
  roles: any[];
}

const EnhancedClientInfoCard: React.FC<EnhancedClientInfoCardProps> = ({ 
  client, 
  roles 
}) => {
  const fiscalYear = new Date().getFullYear(); // Default to current year
  const { data: teamMembers, isLoading: isLoadingTeam } = useClientTeamMembers(client.id);
  const { data: annualData } = useClientAnnualData(client.id, fiscalYear);
  
  const { data: frameworkValidation, isLoading: isValidating } = useFinancialFrameworkValidation(
    client.id,
    fiscalYear,
    (client as any).financial_framework as FinancialFrameworkType,
    annualData?.employee_count || null
  );

  const hasFinancialFrameworkWarning = frameworkValidation && !frameworkValidation.isValid;
  const isEmpty = (value: any) => !value || value === '';

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Klientinformasjon
          </CardTitle>
          {hasFinancialFrameworkWarning && (
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Krever oppmerksomhet</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-medium mb-2">{client.name}</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Org.nr: {formatOrgNumber(client.org_number)}</p>
                {client.company_name && <p>{client.company_name}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Del av konsern
              </label>
              <EditableClientField
                clientId={client.id}
                field="is_part_of_group"
                value={(client as any).is_part_of_group}
                type="boolean"
                className="w-full"
              />
            </div>

            {(client as any).is_part_of_group && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Konsernnavn
                </label>
                <EditableClientField
                  clientId={client.id}
                  field="group_name"
                  value={(client as any).group_name}
                  type="text"
                  placeholder="Angi konsernnavn"
                  isEmpty={isEmpty((client as any).group_name)}
                  className="w-full"
                />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Finansielt rammeverk
                </label>
                <EditableClientField
                  clientId={client.id}
                  field="financial_framework"
                  value={(client as any).financial_framework}
                  type="select"
                  isEmpty={isEmpty((client as any).financial_framework)}
                  hasWarning={hasFinancialFrameworkWarning}
                  warningMessage={frameworkValidation?.message}
                  className="w-full"
                />
                {frameworkValidation?.recommendedFramework && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Anbefalt: {frameworkValidation.recommendedFramework.replace('ngaap_', '').replace('_', ' ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <EmployeeCountField
              clientId={client.id}
              fiscalYear={fiscalYear}
              className="w-full"
            />

            {/* Team Information */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                <Users className="h-4 w-4" />
                Teammedlemmer
              </label>
              <div className="min-h-[60px] p-3 rounded-lg border bg-muted/10">
                {isLoadingTeam ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ) : teamMembers && teamMembers.length > 0 ? (
                  <div className="space-y-2">
                    {teamMembers.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {member.profile?.firstName} {member.profile?.lastName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                    {teamMembers.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{teamMembers.length - 3} flere medlemmer
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen teammedlemmer tildelt</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Framework Validation Status */}
        {frameworkValidation && (
          <div className={`p-4 rounded-lg border ${
            frameworkValidation.isValid 
              ? 'bg-success/5 border-success/20' 
              : 'bg-warning/5 border-warning/20'
          }`}>
            <div className="flex items-start gap-3">
              {frameworkValidation.isValid ? (
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-3">
                  {frameworkValidation.isValid ? 'Rammeverk validert' : 'Rammeverk krever gjennomgang'}
                </h4>
                <p className="text-sm mb-4">
                  {frameworkValidation.message}
                </p>
                
                {/* Detailed Criteria Analysis */}
                {frameworkValidation.detailedCriteria && (
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Regnskapstall viser at:</h5>
                      <div className="space-y-2">
                        {frameworkValidation.detailedCriteria.small.map((criteria, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                criteria.exceedsThreshold ? 'bg-warning' : 'bg-success'
                              }`} />
                              <span>{criteria.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono">
                                {criteria.formattedActual} {criteria.exceedsThreshold ? '>' : '<'} {criteria.formattedThreshold}
                              </span>
                              <span className={`ml-2 text-xs ${
                                criteria.exceedsThreshold ? 'text-warning' : 'text-success'
                              }`}>
                                {criteria.exceedsThreshold ? 'overstiger terskel' : 'under terskel'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-sm font-medium">
                        {frameworkValidation.conclusion}
                      </p>
                      {!frameworkValidation.isValid && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Vurder om finansielt rammeverk bør endres.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedClientInfoCard;