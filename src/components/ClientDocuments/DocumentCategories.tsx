
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Target } from 'lucide-react';
import { DocumentCategory, ClientDocument } from '@/hooks/useClientDocuments';

interface DocumentCategoriesProps {
  categories: (DocumentCategory & { documentCount: number })[];
  documents: ClientDocument[];
}

const DocumentCategories = ({ categories, documents }: DocumentCategoriesProps) => {
  const subjectAreas = [...new Set(categories.map(c => c.subject_area))];
  
  const getSubjectAreaStats = (subjectArea: string) => {
    const areaCategories = categories.filter(c => c.subject_area === subjectArea);
    const totalCategories = areaCategories.length;
    const categoriesWithDocuments = areaCategories.filter(c => c.documentCount > 0).length;
    const completionRate = totalCategories > 0 ? (categoriesWithDocuments / totalCategories) * 100 : 0;
    
    return { totalCategories, categoriesWithDocuments, completionRate };
  };

  return (
    <div className="space-y-6">
      {subjectAreas.map(subjectArea => {
        const stats = getSubjectAreaStats(subjectArea);
        const areaCategories = categories.filter(c => c.subject_area === subjectArea);
        
        return (
          <Card key={subjectArea}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {subjectArea === 'lnn' ? 'Lønn' : subjectArea}
                </CardTitle>
                <Badge variant="outline">
                  {stats.categoriesWithDocuments}/{stats.totalCategories} kategorier
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Fullføring</span>
                  <span>{Math.round(stats.completionRate)}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {areaCategories.map(category => (
                  <div
                    key={category.id}
                    className={`p-4 rounded-lg border ${
                      category.documentCount > 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{category.category_name}</h4>
                      <Badge 
                        variant={category.documentCount > 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {category.documentCount} fil{category.documentCount === 1 ? '' : 'er'}
                      </Badge>
                    </div>
                    
                    {category.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {category.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {category.expected_file_patterns.slice(0, 3).map(pattern => (
                        <span 
                          key={pattern}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {pattern}
                        </span>
                      ))}
                      {category.expected_file_patterns.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{category.expected_file_patterns.length - 3} mer
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dokumentoversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{documents.length}</div>
              <div className="text-sm text-muted-foreground">Totale dokumenter</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.category).length}
              </div>
              <div className="text-sm text-muted-foreground">Kategoriserte</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {documents.filter(d => d.ai_suggested_category).length}
              </div>
              <div className="text-sm text-muted-foreground">AI-forslag</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {documents.filter(d => !d.category).length}
              </div>
              <div className="text-sm text-muted-foreground">Ukategoriserte</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentCategories;
