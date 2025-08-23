
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MaterialityThresholds {
  materiality: number;
  workingMateriality: number;
  clearlyTrivial: number;
}

interface MaterialityBannerProps {
  thresholds?: MaterialityThresholds;
}

const MaterialityBanner = ({ thresholds = { 
  materiality: 2000000, 
  workingMateriality: 1500000, 
  clearlyTrivial: 150000 
} }: MaterialityBannerProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', { 
      style: 'currency', 
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="flex gap-3 items-center text-sm py-2 px-4 bg-muted/50 rounded-md mb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <InfoIcon size={14} className="text-muted-foreground" />
              <span className="font-medium">V:</span>
              <Badge variant="outline" className="font-mono">
                {formatCurrency(thresholds.materiality)}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Vesentlighetsgrense</p>
          </TooltipContent>
        </Tooltip>
      
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">AV:</span>
              <Badge variant="outline" className="font-mono">
                {formatCurrency(thresholds.workingMateriality)}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Arbeidsvesentlighetsgrense</p>
          </TooltipContent>
        </Tooltip>
      
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">UF:</span>
              <Badge variant="outline" className="font-mono">
                {formatCurrency(thresholds.clearlyTrivial)}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Ubetydelig feil</p>
          </TooltipContent>
        </Tooltip>
    </div>
  );
};

export default MaterialityBanner;
