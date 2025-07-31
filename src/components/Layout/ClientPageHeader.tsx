import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FiscalYearSelector from './FiscalYearSelector';

interface ClientPageHeaderProps {
  clientName: string;
  orgNumber?: string;
  showBackButton?: boolean;
}

const ClientPageHeader: React.FC<ClientPageHeaderProps> = ({ 
  clientName, 
  orgNumber,
  showBackButton = true 
}) => {
  return (
    <div className="sticky top-0 z-50 bg-background border-b border-border">
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
              <h1 className="text-xl font-semibold text-foreground">{clientName}</h1>
              {orgNumber && (
                <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                  {orgNumber}
                </span>
              )}
            </div>
          </div>
          
          <FiscalYearSelector clientName={clientName} showClientName={false} />
        </div>
      </div>
    </div>
  );
};

export default ClientPageHeader;