
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KeyFiguresProps {
  liquidityRatio: number;
  equityRatio: number;
  profitMargin: number;
}

const KeyFigures = ({ liquidityRatio, equityRatio, profitMargin }: KeyFiguresProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nøkkeltall</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Likviditetsgrad</h3>
            <p className="text-2xl font-bold">{liquidityRatio.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Omløpsmidler / Kortsiktig gjeld</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Egenkapitalandel</h3>
            <p className="text-2xl font-bold">{equityRatio.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Egenkapital / Sum eiendeler</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Resultatgrad</h3>
            <p className="text-2xl font-bold">{profitMargin.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Driftsresultat / Driftsinntekter</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyFigures;
