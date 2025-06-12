
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MessageSquare, Headphones, DollarSign, Clock } from 'lucide-react';

interface Mode {
  id: 'audio' | 'chat';
  title: string;
  description: string;
  icon: React.ReactNode;
  costLevel: 'low' | 'medium' | 'high';
  benefits: string[];
  estimatedCost: string;
}

interface ModeSelectorProps {
  onModeSelect: (mode: 'audio' | 'chat') => void;
}

const ModeSelector = ({ onModeSelect }: ModeSelectorProps) => {
  const modes: Mode[] = [
    {
      id: 'chat',
      title: 'Chat-modus',
      description: 'Skriv og les samtalen med AI-karakteren',
      icon: <MessageSquare className="h-8 w-8" />,
      costLevel: 'low',
      benefits: [
        'Lavere kostnad (kun tekstgenerering)',
        'Kan brukes i støyende miljøer',
        'Lett å gå tilbake og lese samtalen',
        'Raskere respons'
      ],
      estimatedCost: '~0,50-1 kr per sesjon'
    },
    {
      id: 'audio',
      title: 'Audio-modus',
      description: 'Snakk direkte med AI-karakteren (stemme-til-stemme)',
      icon: <Headphones className="h-8 w-8" />,
      costLevel: 'medium',
      benefits: [
        'Mest realistisk treningsopplevelse',
        'Trener muntlig kommunikasjon',
        'Naturlige samtaleflyt',
        'Bedre følelse av møtesituasjon'
      ],
      estimatedCost: '~3-5 kr per sesjon'
    }
  ];

  const getCostBadgeColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Velg treningstype</h3>
        <p className="text-gray-600">
          Begge modusene gir god trening, men med ulike fordeler og kostnader
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modes.map((mode) => (
          <Card key={mode.id} className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {mode.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{mode.title}</CardTitle>
                  </div>
                </div>
                <Badge className={getCostBadgeColor(mode.costLevel)}>
                  {mode.costLevel === 'low' ? 'Lav kostnad' : 
                   mode.costLevel === 'medium' ? 'Middels kostnad' : 'Høy kostnad'}
                </Badge>
              </div>
              <p className="text-gray-600 text-sm">{mode.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Fordeler:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {mode.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <DollarSign className="h-4 w-4" />
                <span>Estimert kostnad: {mode.estimatedCost}</span>
              </div>
              
              <Button 
                onClick={() => onModeSelect(mode.id)}
                className="w-full"
                variant={mode.id === 'chat' ? 'outline' : 'default'}
              >
                <Clock className="h-4 w-4 mr-2" />
                Start {mode.title.toLowerCase()}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <div className="text-blue-600 mt-0.5">💡</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Tips for beste treningsopplevelse:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Start med chat-modus for å bli kjent med karakterene</li>
              <li>• Bruk audio-modus når du vil trene på muntlig kommunikasjon</li>
              <li>• Begge modusene gir samme læringsmål og feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
