import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface ClientContextHeaderProps {
  clientName: string;
  orgNumber?: string;
  pageTitle: string;
  showBackButton?: boolean;
}

const ClientContextHeader: React.FC<ClientContextHeaderProps> = ({ 
  clientName, 
  orgNumber,
  pageTitle,
  showBackButton = true 
}) => {
  const { selectedFiscalYear } = useFiscalYear();

  return (
    <div className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/clients" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Tilbake til klientliste
                </Link>
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">{clientName}</h1>
                {orgNumber && (
                  <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                    {orgNumber}
                  </span>
                )}
              </div>
              
              <div className="text-muted-foreground">•</div>
              
              <h2 className="text-lg text-muted-foreground">{pageTitle}</h2>
            </div>
          </div>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {selectedFiscalYear}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ClientContextHeader;