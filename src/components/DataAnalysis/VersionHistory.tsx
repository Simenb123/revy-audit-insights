
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentVersion } from '@/types/revio';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

interface VersionHistoryProps {
  versions: DocumentVersion[];
  selectedVersion: DocumentVersion;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ versions, selectedVersion }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Versjonshistorikk</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-6 pb-4">
          <ul className="space-y-3">
            {versions.map((version) => (
              <li 
                key={version.id} 
                className={`flex items-start gap-3 p-2 rounded-md ${
                  version.id === selectedVersion.id ? 'bg-primary/10' : ''
                }`}
              >
                <Clock 
                  size={16} 
                  className={version.id === selectedVersion.id ? 'text-primary' : 'text-muted-foreground'} 
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    version.id === selectedVersion.id ? 'text-primary' : ''
                  }`}>
                    {version.version_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(version.created_at), 'dd.MM.yyyy HH:mm')}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    version.id === selectedVersion.id 
                      ? 'bg-primary' 
                      : version.change_source === 'import'
                        ? 'bg-muted-foreground' 
                        : 'bg-green-500'
                  }`} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VersionHistory;
