
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrialBalanceWithMappings } from "@/hooks/useTrialBalanceWithMappings";

import { useFormulaCalculator } from "@/hooks/useFormulaCalculator";
import { useFiscalYear } from "@/contexts/FiscalYearContext";

interface KeyFiguresProps {
  clientId: string;
}

const KeyFigures = ({ clientId }: KeyFiguresProps) => {
  const { selectedFiscalYear } = useFiscalYear();
  const { data: trialBalanceData, isLoading: isLoadingTrialBalance } = useTrialBalanceWithMappings(clientId, selectedFiscalYear);
  const calculator = useFormulaCalculator(trialBalanceData?.standardAccountBalances || []);

  if (isLoadingTrialBalance) {
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

  const liquidityResult = calculator.calculateFormula('liquidity_ratio');
  const equityResult = calculator.calculateFormula('equity_ratio');
  const profitResult = calculator.calculateFormula('profit_margin');
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nøkkeltall</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Likviditetsgrad</h3>
            <p className={`text-2xl font-bold ${liquidityResult.isValid ? '' : 'text-destructive'}`}>
              {liquidityResult.isValid ? liquidityResult.formattedValue : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Omløpsmidler / Kortsiktig gjeld</p>
            {!liquidityResult.isValid && liquidityResult.error && (
              <p className="text-xs text-destructive mt-1">{liquidityResult.error}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Egenkapitalandel</h3>
            <p className={`text-2xl font-bold ${equityResult.isValid ? '' : 'text-destructive'}`}>
              {equityResult.isValid ? equityResult.formattedValue : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Egenkapital / Sum eiendeler</p>
            {!equityResult.isValid && equityResult.error && (
              <p className="text-xs text-destructive mt-1">{equityResult.error}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Resultatgrad</h3>
            <p className={`text-2xl font-bold ${profitResult.isValid ? '' : 'text-destructive'}`}>
              {profitResult.isValid ? profitResult.formattedValue : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Driftsresultat / Driftsinntekter</p>
            {!profitResult.isValid && profitResult.error && (
              <p className="text-xs text-destructive mt-1">{profitResult.error}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyFigures;
