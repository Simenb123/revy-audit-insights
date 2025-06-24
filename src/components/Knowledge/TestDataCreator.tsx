
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Plus, RefreshCw } from 'lucide-react';
import { useTestDataCreation } from './hooks/useTestDataCreation';
import { testArticles } from './data/testArticlesData';

const TestDataCreator = () => {
  const { isCreating, createTestData } = useTestDataCreation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Opprett testdata for kunnskapsbase
        </CardTitle>
        <CardDescription>
          Legg til eksempel fagartikler og generer embeddings for AI-Revi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Oppretter {testArticles.length} fagartikler:
            <ul className="list-disc list-inside mt-2 space-y-1">
              {testArticles.map((article) => (
                <li key={article.slug}>{article.title}</li>
              ))}
            </ul>
          </div>
          
          <Button 
            onClick={createTestData} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Oppretter testdata...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Opprett testdata
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestDataCreator;
