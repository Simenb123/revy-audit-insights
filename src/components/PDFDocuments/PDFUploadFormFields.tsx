
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PDFUploadFormFieldsProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  isaNumber: string;
  setIsaNumber: (value: string) => void;
  nrsNumber: string;
  setNrsNumber: (value: string) => void;
  onUpload: () => void;
  isUploading: boolean;
  canUpload: boolean;
  fileCount: number;
}

const PDFUploadFormFields = ({
  title,
  setTitle,
  description,
  setDescription,
  category,
  setCategory,
  isaNumber,
  setIsaNumber,
  nrsNumber,
  setNrsNumber,
  onUpload,
  isUploading,
  canUpload,
  fileCount
}: PDFUploadFormFieldsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Tittel *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Dokumenttittel"
          required
          disabled={isUploading}
        />
      </div>

      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kort beskrivelse av dokumentet"
          rows={3}
          disabled={isUploading}
        />
      </div>

      <div>
        <Label htmlFor="category">Kategori</Label>
        <Select value={category} onValueChange={setCategory} disabled={isUploading}>
          <SelectTrigger>
            <SelectValue placeholder="Velg kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="isa">ISA Standarder</SelectItem>
            <SelectItem value="regnskapsstandarder">Regnskapsstandarder</SelectItem>
            <SelectItem value="laws">Lover og forskrifter</SelectItem>
            <SelectItem value="internal">Interne retningslinjer</SelectItem>
            <SelectItem value="other">Andre dokumenter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {category === 'isa' && (
        <div>
          <Label htmlFor="isa-number">ISA Nummer</Label>
          <Input
            id="isa-number"
            value={isaNumber}
            onChange={(e) => setIsaNumber(e.target.value)}
            placeholder="f.eks. 200, 210, 315"
            disabled={isUploading}
          />
        </div>
      )}
      
      {category === 'regnskapsstandarder' && (
        <div>
          <Label htmlFor="nrs-number">NRS Nummer</Label>
          <Input
            id="nrs-number"
            value={nrsNumber}
            onChange={(e) => setNrsNumber(e.target.value)}
            placeholder="f.eks. 1, 8, (IFRS)"
            disabled={isUploading}
          />
        </div>
      )}

      <Button 
        onClick={onUpload}
        disabled={!canUpload || isUploading}
        className="w-full"
      >
        {isUploading ? 'Laster opp...' : `Last opp ${fileCount} fil(er)`}
      </Button>
    </div>
  );
};

export default PDFUploadFormFields;
