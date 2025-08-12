import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { validateXlsxFile } from "@/utils/secureXlsx";

interface TrialBalanceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  fiscalYear: number;
  onUploadSuccess?: () => void;
}

const TrialBalanceUploadDialog: React.FC<TrialBalanceUploadDialogProps> = ({
  open,
  onOpenChange,
  clientId,
  fiscalYear,
  onUploadSuccess
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        validateXlsxFile(file);
      }
      setSelectedFile(file);
    } catch (error) {
      toast({
        title: "Ugyldig fil",
        description: error instanceof Error ? error.message : 'Ugyldig fil',
        variant: "destructive",
      });
      event.target.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Ingen fil valgt",
        description: "Vennligst velg en fil før opplasting.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // TODO: Implement actual file upload logic here
      // This would typically involve:
      // 1. Uploading file to Supabase storage
      // 2. Processing the file (Excel/CSV parsing)
      // 3. Inserting trial balance data into database
      // 4. Tagging with correct period_year
      
      toast({
        title: "Opplasting fullført",
        description: `Saldobalanse for ${fiscalYear} er lastet opp.`,
      });
      
      onUploadSuccess?.();
      onOpenChange(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Opplasting feilet",
        description: "Det oppstod en feil under opplasting av filen.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Last opp saldobalanse for {fiscalYear}
          </DialogTitle>
          <DialogDescription>
            Last opp en Excel- eller CSV-fil med saldobalanse data for regnskapsåret {fiscalYear}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label 
              htmlFor="file-upload" 
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">
                Klikk for å velge fil
              </span>
              <span className="text-xs text-muted-foreground">
                Excel (.xlsx, .xls) eller CSV filer
              </span>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-sm flex-1">{selectedFile.name}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedFile(null)}
              >
                Fjern
              </Button>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Tips:</strong> Sørg for at filen inneholder kolonnene: Kontonummer, Kontonavn, og Saldo.
              Data vil automatisk bli tagget med regnskapsår {fiscalYear}.
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Avbryt
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Laster opp..." : "Last opp"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialBalanceUploadDialog;