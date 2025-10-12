import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line } from 'recharts';
import { cn } from '@/lib/utils';

const mockData = [
  { name: 'Eiendeler', verdi: 5200000, forrigeÅr: 4800000 },
  { name: 'Gjeld', verdi: 3100000, forrigeÅr: 3000000 },
  { name: 'Egenkapital', verdi: 2100000, forrigeÅr: 1800000 },
  { name: 'Omsetning', verdi: 7500000, forrigeÅr: 6900000 },
  { name: 'Driftskostnader', verdi: 6200000, forrigeÅr: 5900000 },
  { name: 'Resultat', verdi: 1300000, forrigeÅr: 1000000 },
];

const monthlyData = [
  { month: 'Jan', inntekt: 600000, kostnad: 520000 },
  { month: 'Feb', inntekt: 580000, kostnad: 510000 },
  { month: 'Mar', inntekt: 620000, kostnad: 530000 },
  { month: 'Apr', inntekt: 650000, kostnad: 540000 },
  { month: 'Mai', inntekt: 610000, kostnad: 520000 },
  { month: 'Jun', inntekt: 630000, kostnad: 510000 },
  { month: 'Jul', inntekt: 590000, kostnad: 500000 },
  { month: 'Aug', inntekt: 640000, kostnad: 520000 },
  { month: 'Sep', inntekt: 670000, kostnad: 540000 },
  { month: 'Okt', inntekt: 680000, kostnad: 550000 },
  { month: 'Nov', inntekt: 660000, kostnad: 530000 },
  { month: 'Des', inntekt: 700000, kostnad: 580000 },
];

type AccountingOverviewProps = {
  className?: string;
};

const AccountingOverview = ({ className }: AccountingOverviewProps) => {
  const [activeLineType, setActiveLineType] = useState<'inntekt' | 'kostnad'>('inntekt');
  
  const handleClick = (name: string) => {
    logger.log("Drill down into:", name);
    // This would navigate to a detailed view in a real application
  };
  
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>Regnskapsoversikt</CardTitle>
        <CardDescription>En oversikt over de viktigste regnskapstallene</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sammenligning" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sammenligning">Balanse/Resultat</TabsTrigger>
            <TabsTrigger value="tidsutvikling">Tidsutvikling</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sammenligning" className="pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={mockData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${(Number(value)/1000000).toFixed(2)} mill. kr`, '']}
                  labelFormatter={(name) => `${name}`}
                />
                <Legend />
                <Bar 
                  dataKey="verdi" 
                  name="Inneværende år" 
                  fill="#2A9D8F" 
                  onClick={(data) => handleClick(data.name)}
                  className="cursor-pointer"
                />
                <Bar 
                  dataKey="forrigeÅr" 
                  name="Forrige år" 
                  fill="#9ACECC" 
                  onClick={(data) => handleClick(data.name)}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 text-xs text-center text-muted-foreground">
              Klikk på søylene for å se detaljene bak tallene
            </div>
          </TabsContent>
          
          <TabsContent value="tidsutvikling" className="pt-4">
            <div className="mb-4 flex justify-center space-x-4">
              <button
                className={`px-3 py-1 rounded-full text-sm ${
                  activeLineType === 'inntekt' ? 'bg-brand-primary text-white' : 'bg-gray-200'
                }`}
                onClick={() => setActiveLineType('inntekt')}
              >
                Inntekter
              </button>
              <button
                className={`px-3 py-1 rounded-full text-sm ${
                  activeLineType === 'kostnad' ? 'bg-brand-primary text-white' : 'bg-gray-200'
                }`}
                onClick={() => setActiveLineType('kostnad')}
              >
                Kostnader
              </button>
            </div>
            
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={monthlyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${(Number(value)/1000).toFixed(0)} 000 kr`, '']}
                />
                <Legend />
                {activeLineType === 'inntekt' ? (
                  <Line 
                    type="monotone" 
                    dataKey="inntekt" 
                    name="Inntekter" 
                    stroke="#2A9D8F" 
                    activeDot={{ r: 8 }} 
                  />
                ) : (
                  <Line 
                    type="monotone" 
                    dataKey="kostnad" 
                    name="Kostnader" 
                    stroke="#E76F51" 
                    activeDot={{ r: 8 }} 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 text-xs text-center text-muted-foreground">
              Månedlig utvikling av {activeLineType === 'inntekt' ? 'inntekter' : 'kostnader'} gjennom året
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AccountingOverview;
