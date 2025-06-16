
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Loader2, CheckCircle } from 'lucide-react';
import { createTestArticles } from '@/services/testArticleSeeder';
import { toast } from 'sonner';

const TestDataCreator = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleCreateTestData = async () => {
    setIsCreating(true);
    try {
      await createTestArticles();
      setIsCompleted(true);
      toast.success('Test-artikler opprettet! AI-Revy kan nå søke i kunnskapsdatabasen.');
    } catch (error) {
      console.error('Failed to create test articles:', error);
      toast.error('Feil ved opprettelse av test-artikler');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Kunnskapsbase Test-data
        </CardTitle>
        <CardDescription>
          Opprett test-artikler så AI-Revy har noe å søke i
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleCreateTestData}
          disabled={isCreating || isCompleted}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Oppretter artikler...
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Artikler opprettet!
            </>
          ) : (
            'Opprett test-artikler'
          )}
        </Button>
        
        {isCompleted && (
          <p className="text-sm text-muted-foreground mt-2">
            Test-artiklene er nå tilgjengelige for AI-Revy å søke i.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TestDataCreator;
