
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

const ratios = [
  { 
    name: 'Likviditetsgrad', 
    value: 1.8, 
    target: 2.0, 
    info: 'Sammenligner kortsiktige eiendeler med kortsiktig gjeld' 
  },
  { 
    name: 'Egenkapitalandel', 
    value: 0.35, 
    target: 0.3, 
    info: 'Andel av totalkapitalen som er finansiert med egenkapital' 
  },
  { 
    name: 'Resultatgrad', 
    value: 0.12, 
    target: 0.15, 
    info: 'Resultat før skatt i prosent av driftsinntekter' 
  },
];

type FinancialRatiosProps = {
  className?: string;
};

const FinancialRatios = ({ className }: FinancialRatiosProps) => {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle>Nøkkeltall</CardTitle>
        <CardDescription>Finansielle forholdstall</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ratios.map((ratio, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{ratio.name}</span>
                  <span className="relative group">
                    <Info size={14} className="text-muted-foreground cursor-help" />
                    <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-black bg-opacity-80 text-white text-xs p-2 rounded w-48 z-10">
                      {ratio.info}
                    </span>
                  </span>
                </div>
                <span className="text-sm font-bold" style={{ 
                  color: ratio.value >= ratio.target ? '#2A9D8F' : 
                  ratio.value >= ratio.target * 0.8 ? '#E9C46A' : '#E76F51' 
                }}>
                  {ratio.value.toFixed(2)}
                </span>
              </div>
              <Progress 
                value={(ratio.value / ratio.target) * 100} 
                className={cn(
                  "h-2",
                  ratio.value >= ratio.target ? "bg-muted" : 
                  ratio.value >= ratio.target * 0.8 ? "bg-muted" : "bg-muted"
                )}
                indicatorClassName={
                  ratio.value >= ratio.target ? "bg-revio-500" : 
                  ratio.value >= ratio.target * 0.8 ? "bg-yellow-500" : "bg-red-500"
                }
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>Mål: {ratio.target.toFixed(2)}</span>
                <span>{(ratio.target * 2).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialRatios;
