import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MappingStats {
  totalAccounts: number;
  mappedAccounts: number;
  unmappedAccounts: number;
}

interface MappingStatusWidgetProps {
  clientId: string;
  mappingStats: MappingStats;
  className?: string;
}

const MappingStatusWidget = ({ clientId, mappingStats, className }: MappingStatusWidgetProps) => {
  const navigate = useNavigate();
  const mappingPercentage = Math.round((mappingStats.mappedAccounts / Math.max(mappingStats.totalAccounts, 1)) * 100);
  const isComplete = mappingStats.unmappedAccounts === 0;

  const handleNavigateToMapping = () => {
    navigate(`/clients/${clientId}/accounting?tab=mapping`);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4" />
          Kontomapping Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Mappede kontoer</span>
            <span className="font-medium">{mappingStats.mappedAccounts} av {mappingStats.totalAccounts}</span>
          </div>
          <Progress value={mappingPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>{mappingStats.mappedAccounts} mappet</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-orange-500" />
            <span>{mappingStats.unmappedAccounts} umappet</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isComplete ? "default" : "secondary"}>
            {mappingPercentage}% ferdig
          </Badge>
          {!isComplete && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleNavigateToMapping}
              className="ml-auto"
            >
              Fullfør mapping
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>

        {!isComplete && (
          <div className="text-xs text-muted-foreground">
            ⚠️ Regnskapsoppstillingen vil være ufullstendig uten fullført mapping
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MappingStatusWidget;