import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FilePreview as FilePreviewType } from '@/utils/fileProcessing';
import { FileText, Database, AlertCircle } from 'lucide-react';

interface FilePreviewProps {
  preview: FilePreviewType;
  fileName: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ preview, fileName }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Forhåndsvisning: {fileName}
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">
            <Database className="w-3 h-3 mr-1" />
            {preview.totalRows} rader
          </Badge>
          <Badge variant="secondary">
            {preview.headers.length} kolonner
          </Badge>
          {preview.detectedDelimiter && (
            <Badge variant="outline">
              Separator: "{preview.detectedDelimiter}"
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-2 py-1 text-left text-xs font-medium">
                  #
                </th>
                {preview.headers.map((header, index) => (
                  <th key={index} className="border border-border px-2 py-1 text-left text-xs font-medium">
                    {header || `Kolonne ${index + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-muted/25">
                  <td className="border border-border px-2 py-1 text-xs text-muted-foreground">
                    {rowIndex + 1}
                  </td>
                  {preview.headers.map((_, colIndex) => (
                    <td key={colIndex} className="border border-border px-2 py-1 text-xs">
                      {row[colIndex] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {preview.totalRows > preview.rows.length && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            Viser første {preview.rows.length} av {preview.totalRows} rader
          </div>
        )}
      </CardContent>
    </Card>
  );
};