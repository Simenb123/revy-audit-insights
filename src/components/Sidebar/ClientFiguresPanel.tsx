import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAccountingYear } from '@/hooks/useAccountingYear';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';

interface ClientFiguresPanelProps {
  clientId?: string;
}

const LabelRow = ({ label, current, previous }: { label: string; current: string; previous?: string }) => (
  <div className="flex items-baseline justify-between py-1.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <div className="text-right">
      <div className="text-sm font-medium">{current}</div>
      {previous !== undefined && (
        <div className="text-[10px] text-muted-foreground">Fjorår: {previous}</div>
      )}
    </div>
  </div>
);

export default function ClientFiguresPanel({ clientId }: ClientFiguresPanelProps) {
  const { accountingYear, isLoading: yearLoading } = useAccountingYear(clientId || '');
  const prevYear = accountingYear - 1;
  const hasClient = !!clientId;

  // Income statement lines
  const sales = useFormulaCalculation({ clientId, fiscalYear: accountingYear, formulaId: 'sales_revenue', enabled: hasClient && !yearLoading });
  const salesPrev = useFormulaCalculation({ clientId, fiscalYear: prevYear, formulaId: 'sales_revenue', enabled: hasClient && !yearLoading });

  const operatingProfit = useFormulaCalculation({ clientId, fiscalYear: accountingYear, formulaId: 'operating_profit', enabled: hasClient && !yearLoading });
  const operatingProfitPrev = useFormulaCalculation({ clientId, fiscalYear: prevYear, formulaId: 'operating_profit', enabled: hasClient && !yearLoading });

  const profitBeforeTax = useFormulaCalculation({ clientId, fiscalYear: accountingYear, formulaId: 'profit_before_tax', enabled: hasClient && !yearLoading });
  const profitBeforeTaxPrev = useFormulaCalculation({ clientId, fiscalYear: prevYear, formulaId: 'profit_before_tax', enabled: hasClient && !yearLoading });

  // Balance sheet totals
  const totalAssets = useFormulaCalculation({ clientId, fiscalYear: accountingYear, formulaId: 'total_assets', enabled: hasClient && !yearLoading });
  const totalAssetsPrev = useFormulaCalculation({ clientId, fiscalYear: prevYear, formulaId: 'total_assets', enabled: hasClient && !yearLoading });

  const equityTotal = useFormulaCalculation({ clientId, fiscalYear: accountingYear, formulaId: 'equity_total', enabled: hasClient && !yearLoading });
  const equityTotalPrev = useFormulaCalculation({ clientId, fiscalYear: prevYear, formulaId: 'equity_total', enabled: hasClient && !yearLoading });

  const liabilitiesTotal = useFormulaCalculation({ clientId, fiscalYear: accountingYear, formulaId: 'liabilities_total', enabled: hasClient && !yearLoading });
  const liabilitiesTotalPrev = useFormulaCalculation({ clientId, fiscalYear: prevYear, formulaId: 'liabilities_total', enabled: hasClient && !yearLoading });

  // Ratios
  const grossMargin = useFormulaCalculation({ clientId, fiscalYear: accountingYear, formulaId: 'gross_margin_pct', enabled: hasClient && !yearLoading });
  const liquidityRatio = useFormulaCalculation({ clientId, fiscalYear: accountingYear, formulaId: 'liquidity_ratio', enabled: hasClient && !yearLoading });
  const equityRatio = useFormulaCalculation({ clientId, fiscalYear: accountingYear, formulaId: 'equity_ratio', enabled: hasClient && !yearLoading });

  const anyLoading = yearLoading ||
    sales.isLoading || operatingProfit.isLoading || profitBeforeTax.isLoading ||
    totalAssets.isLoading || equityTotal.isLoading || liabilitiesTotal.isLoading ||
    grossMargin.isLoading || liquidityRatio.isLoading || equityRatio.isLoading;

  if (!hasClient) {
    return (
      <div className="p-4 text-sm text-muted-foreground">Velg en klient for å se regnskapstall.</div>
    );
  }

  if (anyLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const safe = (r: any) => (r.data?.isValid ? r.data.formattedValue : 'N/A');
  const safePrev = (r: any) => (r.data?.isValid ? r.data.formattedValue : undefined);

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-3">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Resultat ({accountingYear})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <LabelRow label="Salgsinntekter" current={safe(sales)} previous={safePrev(salesPrev)} />
            <LabelRow label="Driftsresultat" current={safe(operatingProfit)} previous={safePrev(operatingProfitPrev)} />
            <LabelRow label="Resultat før skatt" current={safe(profitBeforeTax)} previous={safePrev(profitBeforeTaxPrev)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Balanse ({accountingYear})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <LabelRow label="Sum eiendeler" current={safe(totalAssets)} previous={safePrev(totalAssetsPrev)} />
            <LabelRow label="Sum egenkapital" current={safe(equityTotal)} previous={safePrev(equityTotalPrev)} />
            <LabelRow label="Sum gjeld" current={safe(liabilitiesTotal)} previous={safePrev(liabilitiesTotalPrev)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Nøkkeltall</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <LabelRow label="Bruttofortjeneste" current={safe(grossMargin)} />
            <LabelRow label="Likviditetsgrad" current={safe(liquidityRatio)} />
            <LabelRow label="Egenkapitalandel" current={safe(equityRatio)} />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
