import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Upload, Database, BookOpen, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ReactNode;
  isComplete: boolean;
  isActive: boolean;
}

interface ProgressiveUploadLayoutProps {
  clientId: string;
  clientName: string;
  steps: UploadStep[];
  currentStep: number;
  onStepChange: (stepIndex: number) => void;
}

const ProgressiveUploadLayout = ({ 
  clientId, 
  clientName, 
  steps, 
  currentStep, 
  onStepChange 
}: ProgressiveUploadLayoutProps) => {
  const completedSteps = steps.filter(step => step.isComplete).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grunnlagsdata opplasting</h1>
          <p className="text-muted-foreground">
            {clientName} - Last opp kontoplan, saldobalanse og hovedbok
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Fremdrift</div>
          <div className="text-2xl font-bold">{completedSteps}/{steps.length}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fullført</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Opplastingssteg</CardTitle>
          <CardDescription>
            Følg stegene i rekkefølge for optimal databehandling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = step.isComplete;
              const canAccess = index <= currentStep || isComplete;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center space-x-4 p-4 rounded-lg border transition-colors",
                    isActive && "border-primary bg-primary/5",
                    isComplete && "border-emerald-200 bg-emerald-50",
                    !canAccess && "opacity-50"
                  )}
                >
                  <div className="flex-shrink-0">
                    {isComplete ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Circle className={cn(
                        "w-6 h-6",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Icon className={cn(
                      "w-8 h-8",
                      isActive ? "text-primary" : 
                      isComplete ? "text-emerald-600" : "text-muted-foreground"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-medium",
                      isActive && "text-primary",
                      isComplete && "text-emerald-800"
                    )}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Button
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => onStepChange(index)}
                      disabled={!canAccess}
                    >
                      {isComplete ? "Fullført" : isActive ? "Aktiv" : "Start"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="space-y-6">
        {steps[currentStep]?.component}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Forrige steg
        </Button>
        
        <Button
          onClick={() => onStepChange(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1 || !steps[currentStep].isComplete}
        >
          Neste steg
        </Button>
      </div>
    </div>
  );
};

export default ProgressiveUploadLayout;