
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from 'lucide-react';
import PDFUploader from '@/components/PDFDocuments/PDFUploader';
import PDFDocumentList from '@/components/PDFDocuments/PDFDocumentList';
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import PageHeader from '@/components/Layout/PageHeader';

const PDFDocuments = () => {
  const [activeTab, setActiveTab] = useState('browse');

  return (
    <ConstrainedWidth width="full">
      <StandardPageLayout
        header={
          <PageHeader
            title="PDF-dokumenter"
            subtitle="Last opp, organiser og se PDF-dokumenter som ISA-standarder og andre viktige dokumenter"
          />
        }
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Bla gjennom dokumenter
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Last opp dokumenter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <PDFDocumentList />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <PDFUploader />

            <div className="mt-8">
              <Button
                variant="outline"
                onClick={() => setActiveTab('browse')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Se alle dokumenter
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </StandardPageLayout>
    </ConstrainedWidth>
  );
};

export default PDFDocuments;
