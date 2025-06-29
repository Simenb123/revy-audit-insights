import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import FileDropZone from '../../common/FileDropZone';
import { toast } from 'sonner';

const TrainingDocumentUploader = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState('');
  const [systemSource, setSystemSource] = useState('');
  const [description, setDescription] = useState('');
  const [trainingNotes, setTrainingNotes] = useState('');

  const handleFiles = (acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  };

  const documentTypes = [
    { value: 'hovedbok', label: 'Hovedbok / General Ledger' },
    { value: 'saldobalanse', label: 'Saldobalanse / Trial Balance' },
    { value: 'resultat', label: 'Resultatregnskap' },
    { value: 'balanse', label: 'Balanse' },
    { value: 'kontoplaner', label: 'Kontoplaner' },
    { value: 'fakturaer', label: 'Fakturaer / Invoices' },
    { value: 'lonnslister', label: 'Lønnssliper' },
    { value: 'bankutskrifter', label: 'Bankutskrifter' },
    { value: 'annet', label: 'Annet' }
  ];

  const systemSources = [
    { value: 'visma_business', label: 'Visma Business' },
    { value: 'visma_global', label: 'Visma Global' },
    { value: 'poweroffice', label: 'PowerOffice' },
    { value: 'tripletex', label: 'Tripletex' },
    { value: 'fiken', label: 'Fiken' },
    { value: 'mamut', label: 'Mamut' },
    { value: 'excel_manual', label: 'Excel (manuell)' },
    { value: 'csv_export', label: 'CSV Export' },
    { value: 'unknown', label: 'Ukjent system' }
  ];

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Velg minst en fil for opplasting');
      return;
    }

    if (!documentType || !systemSource) {
      toast.error('Fyll inn alle påkrevde felt');
      return;
    }

    try {
      // Here we would upload to a special training documents bucket
      logger.log('Uploading training documents:', {
        files: selectedFiles,
        documentType,
        systemSource,
        description,
        trainingNotes
      });

      toast.success(`${selectedFiles.length} treningsdokumenter lastet opp`);
      
      // Reset form
      setSelectedFiles([]);
      setDocumentType('');
      setSystemSource('');
      setDescription('');
      setTrainingNotes('');
      
    } catch (error) {
      toast.error('Feil ved opplasting av treningsdokumenter');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Last opp AI-treningsdokumenter
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Last opp eksempeldokumenter som AI kan lære av for bedre analyse og kategorisering
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <FileDropZone
            onFilesSelected={handleFiles}
            accept={{
              'application/pdf': ['.pdf'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
              'text/csv': ['.csv'],
              'text/plain': ['.txt'],
            }}
          >
            {(active) => (
              <div>
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                {active ? (
                  <p>Slipp filene her...</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium">Dra og slipp filer her, eller klikk for å velge</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Støttede formater: PDF, Excel, CSV, TXT
                    </p>
                  </div>
                )}
              </div>
            )}
          </FileDropZone>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Valgte filer ({selectedFiles.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Dokumenttype *</label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg dokumenttype" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Systemkilde *</label>
              <Select value={systemSource} onValueChange={setSystemSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg system" />
                </SelectTrigger>
                <SelectContent>
                  {systemSources.map(source => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Beskrivelse</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivelse av dokumentene..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">AI-treningsnotater</label>
            <Textarea
              value={trainingNotes}
              onChange={(e) => setTrainingNotes(e.target.value)}
              placeholder="Spesielle notater for AI-trening, f.eks. hvilke kolonner som er viktige, kjente problemer, forventede mønstre..."
              rows={4}
            />
          </div>

          <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Konfidensialitet</p>
              <p className="text-yellow-700">
                Disse dokumentene brukes kun til AI-trening og er ikke tilgjengelige for vanlige brukere.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFiles([]);
                setDocumentType('');
                setSystemSource('');
                setDescription('');
                setTrainingNotes('');
              }}
            >
              Nullstill
            </Button>
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Last opp treningsdokumenter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingDocumentUploader;
