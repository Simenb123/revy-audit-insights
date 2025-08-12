import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validateXmlFile } from "@/utils/fileValidation";

const SaftImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    try {
      validateXmlFile(selected);
      setFile(selected);
    } catch (error) {
      toast({
        title: "Ugyldig fil",
        description: error instanceof Error ? error.message : "Ugyldig SAF-T fil",
        variant: "destructive",
      });
      e.target.value = "";
      setFile(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    // TODO: replace with actual upload logic
    console.log("Uploading SAF-T file:", file.name);
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>SAF-T Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          accept=".xml"
          onChange={handleFileChange}
          data-testid="saft-input"
        />
        {file && <p className="text-sm">Valgt fil: {file.name}</p>}
        <Button onClick={handleUpload} disabled={!file}>
          <Upload className="h-4 w-4 mr-2" />
          Last opp
        </Button>
      </CardContent>
    </Card>
  );
};

export default SaftImport;
