import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Calculator, 
  Book, 
  Users, 
  Database,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { UploadTypeConfig } from '@/types/upload';
import { getAllUploadConfigs } from '@/config/uploadTypes';
import { cn } from '@/lib/utils';

interface UploadTypeSelectorProps {
  onSelect: (config: UploadTypeConfig) => void;
  selectedType?: string;
  className?: string;
}

const getIconForType = (icon?: string) => {
  switch (icon) {
    case 'Balance':
      return Calculator;
    case 'Book':
      return Book;
    case 'Users':
      return Users;
    case 'FileText':
      return FileText;
    case 'Database':
      return Database;
    default:
      return Upload;
  }
};

const UploadTypeSelector: React.FC<UploadTypeSelectorProps> = ({
  onSelect,
  selectedType,
  className
}) => {
  const configs = getAllUploadConfigs();

  const formatFileTypes = (acceptedFileTypes: Record<string, string[]>) => {
    return Object.keys(acceptedFileTypes).join(', ');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Velg opplastningstype</h2>
        <p className="text-muted-foreground">
          Velg hvilken type data du ønsker å laste opp
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config) => {
          const IconComponent = getIconForType(config.icon);
          const isSelected = selectedType === config.id;
          
          return (
            <Card 
              key={config.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md border-2',
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => onSelect(config)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-md',
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  )}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {config.name}
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {formatFileTypes(config.acceptedFileTypes)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Max {formatFileSize(config.maxFileSize)}
                    </Badge>
                    {config.maxFiles > 1 && (
                      <Badge variant="outline" className="text-xs">
                        {config.maxFiles} filer
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {config.enableAISuggestions && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        AI-forslag
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    variant={isSelected ? "default" : "outline"} 
                    size="sm" 
                    className="w-full"
                  >
                    {isSelected ? 'Valgt' : 'Velg'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default UploadTypeSelector;