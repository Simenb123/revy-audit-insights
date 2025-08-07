
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormulaCalculation } from "@/hooks/useFormulaCalculation";
import { useFiscalYear } from "@/contexts/FiscalYearContext";

interface KeyFiguresProps {
  clientId: string;
}

const KeyFigures = ({ clientId }: KeyFiguresProps) => {
  const { selectedFiscalYear } = useFiscalYear();
  
  // Use new formula calculation for all key figures
  const liquidityResult = useFormulaCalculation({
    clientId,
    fiscalYear: selectedFiscalYear,
    formulaId: 'liquidity_ratio',
    enabled: !!clientId && !!selectedFiscalYear
  });
  
  const equityResult = useFormulaCalculation({
    clientId,
    fiscalYear: selectedFiscalYear,
    formulaId: 'equity_ratio',
    enabled: !!clientId && !!selectedFiscalYear
  });
  
  const profitResult = useFormulaCalculation({
    clientId,
    fiscalYear: selectedFiscalYear,
    formulaId: 'profit_margin',
    enabled: !!clientId && !!selectedFiscalYear
  });

  const isLoading = liquidityResult.isLoading || equityResult.isLoading || profitResult.isLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nøkkeltall</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nøkkeltall</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Likviditetsgrad</h3>
            <p className={`text-2xl font-bold ${liquidityResult.data?.isValid ? '' : 'text-destructive'}`}>
              {liquidityResult.data?.isValid ? liquidityResult.data.formattedValue : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Omløpsmidler / Kortsiktig gjeld</p>
            {(!liquidityResult.data?.isValid || liquidityResult.error) && (
              <p className="text-xs text-destructive mt-1">{liquidityResult.data?.error || liquidityResult.error?.message}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Egenkapitalandel</h3>
            <p className={`text-2xl font-bold ${equityResult.data?.isValid ? '' : 'text-destructive'}`}>
              {equityResult.data?.isValid ? equityResult.data.formattedValue : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Egenkapital / Sum eiendeler</p>
            {(!equityResult.data?.isValid || equityResult.error) && (
              <p className="text-xs text-destructive mt-1">{equityResult.data?.error || equityResult.error?.message}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Resultatgrad</h3>
            <p className={`text-2xl font-bold ${profitResult.data?.isValid ? '' : 'text-destructive'}`}>
              {profitResult.data?.isValid ? profitResult.data.formattedValue : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Driftsresultat / Driftsinntekter</p>
            {(!profitResult.data?.isValid || profitResult.error) && (
              <p className="text-xs text-destructive mt-1">{profitResult.data?.error || profitResult.error?.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyFigures;
