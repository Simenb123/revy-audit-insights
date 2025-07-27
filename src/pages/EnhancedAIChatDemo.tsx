import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EnhancedAIChat from '@/components/AI/EnhancedAIChat';

const EnhancedAIChatDemo = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Revy Enhanced Demo</h1>
        <p className="text-muted-foreground">
          Test den intelligente AI-chatten med bildeanalyse og handlingsforslag
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Intelligente Funksjoner</CardTitle>
            <CardDescription>
              Den nye AI-chatten kan:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>🖼️ <strong>Bildeanalyse:</strong> Last opp bilder og få intelligente forslag</li>
              <li>📋 <strong>Inventar:</strong> Foreslår å legge til objekter i inventarlisten</li>
              <li>📄 <strong>Dokumenter:</strong> Gjenkjenner dokumenter og foreslår arkivering</li>
              <li>🍷 <strong>Vinlager:</strong> Identifiserer vinflasker for lagerlisten</li>
              <li>📖 <strong>Hyttebok:</strong> Foreslår å lagre opplevelser som utkast</li>
              <li>☑️ <strong>Sjekklister:</strong> Oppdager når noe bør legges til i sjekklister</li>
            </ul>
          </CardContent>
        </Card>

        <div className="h-[600px]">
          <EnhancedAIChat 
            enableImageUpload={true}
            showMetrics={true}
            onResponseReceived={(response) => {
              console.log('AI Response received:', response);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIChatDemo;