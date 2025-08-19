import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { useFixNorwegianEncoding } from '@/hooks/useNorwegianChars';

interface NorwegianCharFixerProps {
  className?: string;
}

/**
 * Component to fix Norwegian character encoding issues across the database
 */
export function NorwegianCharFixer({ className }: NorwegianCharFixerProps) {
  const fixEncoding = useFixNorwegianEncoding();

  const handleFix = () => {
    fixEncoding.mutate();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Norske tegn (æ, ø, å)
        </CardTitle>
        <CardDescription>
          Reparer korrupte norske tegn i databasen. Dette vil erstatte feilaktige 
          kodinger som "Ã¦" med "æ", "Ã¸" med "ø", osv.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleFix}
          disabled={fixEncoding.isPending}
          className="w-full"
        >
          {fixEncoding.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Reparerer...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Reparer norske tegn
            </>
          )}
        </Button>
        
        {fixEncoding.isSuccess && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✅ Reparasjon fullført! Refresh siden for å se endringene.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}