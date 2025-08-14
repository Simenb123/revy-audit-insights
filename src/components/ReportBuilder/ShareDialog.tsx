import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Share2, Mail, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { exportFullReportAsImage } from '@/utils/imageExport';
import { exportReportToPDF, exportReportToExcel } from '@/utils/exportReport';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const { widgets, layouts } = useWidgetManager();

  const shareUrl = window.location.href;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Lenke kopiert",
        description: "Rapportlenken er kopiert til utklippstavlen.",
      });
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke kopiere lenken.",
        variant: "destructive"
      });
    }
  };

  const handleEmailShare = () => {
    const subject = 'Rapport deling';
    const body = `Hei,\n\nJeg deler denne rapporten med deg:\n${shareUrl}\n\nMed vennlig hilsen`;
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const handleQuickExport = async (format: 'pdf' | 'excel' | 'image') => {
    setIsSharing(true);
    try {
      switch (format) {
        case 'pdf':
          await exportReportToPDF(widgets, layouts);
          break;
        case 'excel':
          await exportReportToExcel(widgets, layouts);
          break;
        case 'image':
          await exportFullReportAsImage();
          break;
      }
      toast({
        title: "Eksport fullført",
        description: `Rapporten er eksportert som ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Eksportfeil",
        description: "Kunne ikke eksportere rapporten.",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Del rapport
          </DialogTitle>
          <DialogDescription>
            Del denne rapporten med andre eller eksporter til forskjellige formater.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Lenke</TabsTrigger>
            <TabsTrigger value="email">E-post</TabsTrigger>
            <TabsTrigger value="export">Eksport</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Rapportlenke</Label>
              <div className="flex space-x-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Andre med tilgang til systemet kan åpne denne lenken for å se rapporten.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-postadresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="person@firma.no"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleEmailShare} disabled={!email} className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Åpne e-post
            </Button>
            <p className="text-sm text-muted-foreground">
              Dette åpner din standard e-postklient med en ferdig melding.
            </p>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => handleQuickExport('pdf')}
                disabled={isSharing}
                className="h-20 flex-col"
              >
                <Download className="h-5 w-5 mb-1" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickExport('excel')}
                disabled={isSharing}
                className="h-20 flex-col"
              >
                <Download className="h-5 w-5 mb-1" />
                Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickExport('image')}
                disabled={isSharing}
                className="h-20 flex-col"
              >
                <Download className="h-5 w-5 mb-1" />
                Bilde
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {isSharing ? 'Eksporterer...' : 'Kjappe eksportvalg for øyeblikkelig nedlasting.'}
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}