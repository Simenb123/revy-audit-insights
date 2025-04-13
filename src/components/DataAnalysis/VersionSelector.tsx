
import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentVersion } from '@/types/revio';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';

interface VersionSelectorProps {
  selectedVersion: DocumentVersion;
  onVersionChange: (version: DocumentVersion) => void;
}

const VersionSelector = ({ selectedVersion, onVersionChange }: VersionSelectorProps) => {
  const handleValueChange = (value: string) => {
    onVersionChange(value as DocumentVersion);
  };
  
  return (
    <div className="flex items-center gap-2">
      <History size={16} className="text-muted-foreground" />
      <span className="text-sm text-muted-foreground mr-1">Versjon:</span>
      <Select value={selectedVersion} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Velg versjon" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Tilgjengelige versjoner</SelectLabel>
            <SelectItem value="interim1">
              <div className="flex items-center justify-between w-full">
                <span>Interim 1</span>
                <Badge variant="outline" className="ml-2 text-xs">15.01.2024</Badge>
              </div>
            </SelectItem>
            <SelectItem value="interim2">
              <div className="flex items-center justify-between w-full">
                <span>Interim 2</span>
                <Badge variant="outline" className="ml-2 text-xs">15.03.2024</Badge>
              </div>
            </SelectItem>
            <SelectItem value="final">
              <div className="flex items-center justify-between w-full">
                <span>Endelig</span>
                <Badge variant="outline" className="ml-2 text-xs">01.04.2024</Badge>
              </div>
            </SelectItem>
            <SelectItem value="revised">
              <div className="flex items-center justify-between w-full">
                <span>Revidert</span>
                <Badge variant="outline" className="ml-2 text-xs">15.04.2024</Badge>
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default VersionSelector;
