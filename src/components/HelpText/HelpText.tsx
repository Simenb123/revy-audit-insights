
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Info, Lightbulb } from 'lucide-react';

interface HelpTextProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'tip';
  className?: string;
}

const HelpText = ({ title, children, variant = 'info', className = '' }: HelpTextProps) => {
  const Icon = variant === 'tip' ? Lightbulb : Info;
  const iconColor = variant === 'tip' ? 'text-yellow-600' : 'text-blue-600';
  const borderColor = variant === 'tip' ? 'border-yellow-200' : 'border-blue-200';

  return (
    <Card className={`${borderColor} bg-opacity-50 ${className}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
          <div className="flex-1">
            {title && <h4 className="font-medium mb-1">{title}</h4>}
            <div className="text-sm text-muted-foreground">{children}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HelpText;
