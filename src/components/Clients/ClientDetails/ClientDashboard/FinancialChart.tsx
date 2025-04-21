
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from "@/lib/formatters";

interface FinancialChartProps {
  financialData: Array<{
    year: number;
    revenue: number;
    result: number;
  }>;
}

const FinancialChart = ({ financialData }: FinancialChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Økonomisk utvikling</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={financialData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `År ${label}`}
              />
              <Bar name="Omsetning" dataKey="revenue" fill="#8884d8" />
              <Bar name="Resultat" dataKey="result" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialChart;
