
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const riskAreas = [
  { 
    area: 'Inntektsføring', 
    risk: 'medium', 
    description: 'Uvanlig høy vekst i Q4, bør undersøkes nærmere' 
  },
  { 
    area: 'Kundefordringer', 
    risk: 'high', 
    description: 'Flere fordringer er eldre enn 90 dager' 
  },
  { 
    area: 'Varelager', 
    risk: 'low', 
    description: 'Innenfor normale verdier, god omløpshastighet' 
  },
  { 
    area: 'Anleggsmidler', 
    risk: 'none', 
    description: 'Avskrivninger følger forventet mønster' 
  },
  { 
    area: 'Leverandørgjeld', 
    risk: 'medium', 
    description: 'Økning mot slutten av året' 
  },
];

type RiskAssessmentProps = {
  className?: string;
};

const RiskAssessment = ({ className }: RiskAssessmentProps) => {
  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high':
        return <AlertTriangle size={18} className="text-red-500" />;
      case 'medium':
        return <HelpCircle size={18} className="text-yellow-500" />;
      case 'low':
        return <HelpCircle size={18} className="text-brand-primary/50" />;
      case 'none':
        return <CheckCircle size={18} className="text-green-500" />;
      default:
        return <HelpCircle size={18} className="text-gray-500" />;
    }
  };
  
  const getRiskClass = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-brand-surface-hover/50 bg-brand-surface/30';
      case 'none':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };
  
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>Risikovurdering</CardTitle>
        <CardDescription>Områder med potensiell risiko</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {riskAreas.map((item, index) => (
            <div 
              key={index} 
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                getRiskClass(item.risk)
              )}
            >
              <div className="flex items-start gap-2">
                {getRiskIcon(item.risk)}
                <div>
                  <h4 className="font-medium text-sm">{item.area}</h4>
                  <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskAssessment;
