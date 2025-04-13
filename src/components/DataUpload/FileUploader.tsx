
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileType, Check, X, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const FileUploader = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  const handleFiles = (files: FileList) => {
    const file = files[0];
    
    // Check if the file is an Excel or CSV file
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      setError('Filtypen støttes ikke. Vennligst last opp Excel eller CSV.');
      toast({
        title: "Feil filtype",
        description: "Vennligst last opp en Excel eller CSV fil.",
        variant: "destructive"
      });
      return;
    }
    
    setError(null);
    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      
      toast({
        title: "Opplasting vellykket",
        description: `Filen "${file.name}" er lastet opp.`,
        variant: "default"
      });
      
      // Reset success state after a few seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    }, 2000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Last opp regnskapsdata</CardTitle>
        <CardDescription>
          Dra og slipp saldobalanse eller hovedbok, eller klikk for å velge fil
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className={`
            border-2 border-dashed rounded-lg p-8 
            transition-colors duration-200 ease-in-out
            flex flex-col items-center justify-center
            ${isDragging ? 'border-revio-500 bg-revio-50' : 'border-gray-300 hover:border-revio-300'}
            ${isUploading ? 'bg-gray-50 pointer-events-none' : ''}
            ${uploadSuccess ? 'bg-green-50 border-green-300' : ''}
            ${error ? 'bg-red-50 border-red-300' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            onChange={handleFileInput}
            accept=".xlsx,.xls,.csv"
          />
          
          {isUploading ? (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-t-revio-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Laster opp fil...</p>
            </div>
          ) : uploadSuccess ? (
            <div className="text-center">
              <Check size={48} className="text-green-500 mx-auto mb-4" />
              <p className="text-sm text-gray-600">Filen er lastet opp!</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <label htmlFor="file-upload" className="cursor-pointer text-center">
              <Upload size={48} className="text-revio-500 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Dra og slipp filen her, eller klikk for å velge
              </p>
              <p className="text-xs text-gray-500">
                Støtter Excel (.xlsx, .xls) og CSV-filer
              </p>
            </label>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <div className="flex items-center">
          <FileType size={20} className="text-revio-500 mr-2" />
          <span className="text-sm">Støttede formater: Excel, CSV</span>
        </div>
        
        {(error || uploadSuccess) && (
          <Button 
            variant="outline"
            onClick={() => {
              setError(null);
              setUploadSuccess(false);
            }}
            size="sm"
          >
            <X size={16} className="mr-1" />
            Lukk
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default FileUploader;
