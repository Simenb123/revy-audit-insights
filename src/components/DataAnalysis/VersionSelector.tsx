
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ChevronDown } from 'lucide-react';
import { DocumentVersion } from '@/types/revio';
import { formatDistance } from 'date-fns';
import { nb } from 'date-fns/locale';

interface VersionSelectorProps {
  versions: DocumentVersion[];
  selectedVersion: DocumentVersion;
  onVersionChange: (version: DocumentVersion) => void;
}

const VersionSelector: React.FC<VersionSelectorProps> = ({ 
  versions, 
  selectedVersion, 
  onVersionChange 
}) => {
  const handleVersionChange = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      onVersionChange(version);
    }
  };
  
  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistance(date, new Date(), { addSuffix: true, locale: nb });
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Calendar size={16} className="text-muted-foreground" />
      <Select
        value={selectedVersion.id}
        onValueChange={handleVersionChange}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Velg versjon" />
        </SelectTrigger>
        <SelectContent>
          {versions.map(version => (
            <SelectItem key={version.id} value={version.id}>
              <div className="flex flex-col">
                <span>{version.name}</span>
                <span className="text-xs text-muted-foreground">
                  {version.date} ({getTimeAgo(version.date)})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedVersion.status === 'active' && (
        <Button variant="outline" size="sm" className="gap-1">
          <span>Sammenlikn</span>
          <ChevronDown size={14} />
        </Button>
      )}
    </div>
  );
};

export default VersionSelector;
