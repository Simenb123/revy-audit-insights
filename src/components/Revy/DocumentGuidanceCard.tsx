import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  FileText, 
  Search, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  HelpCircle
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DocumentGuidanceCardProps {
  documentCount: number;
  readableDocuments: number;
  className?: string;
}

export const DocumentGuidanceCard: React.FC<DocumentGuidanceCardProps> = ({
  documentCount,
  readableDocuments,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const exampleQuestions = [
    {
      category: "Dokumentoversikt",
      questions: [
        "Hva inneholder kontoutskriften fra skatteetaten?",
        "Finn alle lønnsrelaterte dokumenter",
        "Vis meg alle avstemmingsdokumenter",
        "Hvilke dokumenter mangler for revisjonen?"
      ]
    },
    {
      category: "Regnskapsanalyse",
      questions: [
        "Sammendrag av årsoppgjøret",
        "Er det noen avvik i lønnslistene?",
        "Kontroller feriepengeberegningene",
        "Analyser skattetrekkene"
      ]
    },
    {
      category: "Revisjonsfokus",
      questions: [
        "Hvilke risikoområder ser du i dokumentene?",
        "Er det noen manglende avstemminger?",
        "Sjekk om alle a-meldings data stemmer",
        "Finn dokumenter som krever oppfølging"
      ]
    }
  ];

  return (
    <Card className={`border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Brain className="h-5 w-5" />
          Spør AI-Revy om dokumentene
          <Badge variant="secondary" className="ml-auto">
            {readableDocuments}/{documentCount} dokumenter AI kan lese
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-blue-200">
          <MessageCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">AI-Revy kan hjelpe deg med:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Analysere og sammendrage dokumentinnhold</li>
              <li>• Finne spesifikke opplysninger på tvers av filer</li>
              <li>• Identifisere mangler og avvik i regnskapsdata</li>
              <li>• Gi revisjonsrelevante anbefalinger</li>
            </ul>
          </div>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between bg-white/70 hover:bg-white">
              <span className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Se eksempler på spørsmål
              </span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 mt-3">
            {exampleQuestions.map((category, idx) => (
              <div key={idx} className="bg-white/70 rounded-lg p-3 border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  {category.category}
                </h4>
                <div className="space-y-1">
                  {category.questions.map((question, qIdx) => (
                    <div key={qIdx} className="text-sm text-blue-700 bg-blue-50 rounded px-2 py-1 border border-blue-100">
                      "{question}"
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {readableDocuments < documentCount && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded border border-yellow-200">
            <FileText className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-2">⚠️ {documentCount - readableDocuments} dokumenter kan ikke leses av AI</p>
              <div className="space-y-1">
                <p className="text-xs"><strong>Vanlige årsaker:</strong></p>
                <ul className="text-xs space-y-0.5 ml-3">
                  <li>• Skannede PDF-er (bilder, ikke tekst)</li>
                  <li>• Passordbeskyttede filer</li>
                  <li>• Korrupte eller tomme dokumenter</li>
                </ul>
                <p className="text-xs mt-2"><strong>Løsning:</strong> Last opp som tekstbaserte PDF-er, Word- eller Excel-filer.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};