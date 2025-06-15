
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import VersionDiffViewer from './VersionDiffViewer';
import { DocumentVersion } from '@/hooks/useDocumentVersions';
import { format } from 'date-fns';

interface VersionDiffDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  olderVersion: DocumentVersion | null;
  newerVersion: DocumentVersion | null;
}

const VersionDiffDialog: React.FC<VersionDiffDialogProps> = ({ isOpen, onOpenChange, olderVersion, newerVersion }) => {
  if (!olderVersion || !newerVersion) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Sammenligning av versjoner</DialogTitle>
          <DialogDescription>
            Viser endringer mellom versjon '{newerVersion.version_name}' (nyere) og '{olderVersion.version_name}' (eldre).
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div><strong>Eldre versjon:</strong> {olderVersion.version_name} ({format(new Date(olderVersion.created_at), 'dd.MM.yy HH:mm')})</div>
            <div><strong>Nyere versjon:</strong> {newerVersion.version_name} ({format(new Date(newerVersion.created_at), 'dd.MM.yy HH:mm')})</div>
        </div>
        <VersionDiffViewer oldContent={olderVersion.content} newContent={newerVersion.content} />
      </DialogContent>
    </Dialog>
  );
};

export default VersionDiffDialog;
