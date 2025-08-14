import React, { useState } from 'react';
import { useCollaboration, DashboardVersion } from '@/hooks/useCollaboration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { History, Save, Download, Eye, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface VersionHistoryProps {
  dashboardId: string;
  clientId: string;
  fiscalYear: number;
  currentWidgets: any;
  currentLayouts: any;
  currentSettings: any;
  onRestoreVersion?: (version: DashboardVersion) => void;
  className?: string;
}

interface CreateVersionDialogProps {
  onCreateVersion: (name: string, description: string) => Promise<void>;
  trigger: React.ReactNode;
}

function CreateVersionDialog({ onCreateVersion, trigger }: CreateVersionDialogProps) {
  const [open, setOpen] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionName.trim()) return;

    setLoading(true);
    try {
      await onCreateVersion(versionName, description);
      setVersionName('');
      setDescription('');
      setOpen(false);
    } catch (error) {
      console.error('Failed to create version:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Version</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="version-name">Version Name *</Label>
            <Input
              id="version-name"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g., Q4 Dashboard Updates"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what changed in this version..."
              className="min-h-[80px]"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !versionName.trim()}>
              {loading ? 'Saving...' : 'Save Version'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface VersionItemProps {
  version: DashboardVersion;
  onRestore?: (version: DashboardVersion) => void;
  isLatest?: boolean;
}

function VersionItem({ version, onRestore, isLatest }: VersionItemProps) {
  const getUserInitials = (displayName: string | null) => {
    if (!displayName) return '?';
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getVersionLabel = () => {
    if (version.version_name) {
      return version.version_name;
    }
    return `Version ${version.version_number}`;
  };

  return (
    <Card className={cn(isLatest && 'ring-2 ring-primary')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={version.created_by_user?.avatar_url || ''} />
              <AvatarFallback className="text-xs">
                {getUserInitials(version.created_by_user?.display_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">{getVersionLabel()}</CardTitle>
                {isLatest && (
                  <Badge variant="default" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                by {version.created_by_user?.display_name || 'Unknown User'} •{' '}
                {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" title="Preview Version">
              <Eye className="w-4 h-4" />
            </Button>
            {!isLatest && onRestore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestore(version)}
                title="Restore This Version"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {version.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {version.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export function VersionHistory({
  dashboardId,
  clientId,
  fiscalYear,
  currentWidgets,
  currentLayouts,
  currentSettings,
  onRestoreVersion,
  className
}: VersionHistoryProps) {
  const { versions, createVersion, currentUser } = useCollaboration(dashboardId, clientId, fiscalYear);

  const handleCreateVersion = async (name: string, description: string) => {
    await createVersion(currentWidgets, currentLayouts, currentSettings, name, description);
  };

  const handleRestoreVersion = (version: DashboardVersion) => {
    if (onRestoreVersion) {
      onRestoreVersion(version);
    }
  };

  if (!currentUser) {
    return (
      <div className={cn('text-center py-4', className)}>
        <p className="text-sm text-muted-foreground">
          Please sign in to view version history
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5" />
          <h3 className="font-medium">Version History</h3>
          <Badge variant="secondary" className="text-xs">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <CreateVersionDialog
          onCreateVersion={handleCreateVersion}
          trigger={
            <Button size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save Version
            </Button>
          }
        />
      </div>

      <div className="space-y-3">
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No versions saved yet
            </p>
            <CreateVersionDialog
              onCreateVersion={handleCreateVersion}
              trigger={
                <Button variant="outline">
                  <Save className="w-4 h-4 mr-2" />
                  Save First Version
                </Button>
              }
            />
          </div>
        ) : (
          versions.map((version, index) => (
            <VersionItem
              key={version.id}
              version={version}
              onRestore={handleRestoreVersion}
              isLatest={index === 0}
            />
          ))
        )}
      </div>
    </div>
  );
}