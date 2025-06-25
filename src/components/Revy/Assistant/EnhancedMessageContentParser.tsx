
import React from 'react';
import { MessageContentParser } from './MessageContentParser';
import DocumentReferenceViewer from '@/components/ClientDocuments/DocumentReferenceViewer';

interface EnhancedMessageContentParserProps {
  content: string;
  showDocumentContext?: boolean;
}

const EnhancedMessageContentParser: React.FC<EnhancedMessageContentParserProps> = ({
  content,
  showDocumentContext = true
}) => {
  // Extract document context info from AI response
  const hasDocumentContext = content.includes('DOKUMENTINNHOLD FUNNET') || 
                             content.includes('RELEVANTE DOKUMENTER FUNNET');
  
  // Extract variant info if present
  const variantMatch = content.match(/<!-- VARIANT_INFO: (.*?) -->/);
  const variantInfo = variantMatch ? JSON.parse(variantMatch[1]) : null;

  // Extract document references if present
  let documentReferences: any[] = [];
  let documentClientId: string | undefined = undefined;
  const docRefMatch = content.match(/<!-- DOCUMENT_REFERENCES: (.*?) -->/);
  if (docRefMatch) {
    try {
      const parsed = JSON.parse(docRefMatch[1]);
      if (Array.isArray(parsed)) {
        documentReferences = parsed;
      } else {
        documentReferences = parsed.references || [];
        documentClientId = parsed.clientId;
      }
    } catch (err) {
      console.error('Failed to parse document references', err);
    }
  }

  // Clean content for display (remove metadata comments)
  const cleanContent = content
    .replace(/<!-- ARTICLE_MAPPINGS: .*? -->/g, '')
    .replace(/<!-- VARIANT_INFO: .*? -->/g, '')
    .replace(/<!-- DOCUMENT_REFERENCES: .*? -->/g, '')
    .trim();

  return (
    <div className="space-y-2">
      {hasDocumentContext && showDocumentContext && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Dokumentanalyse aktiv</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            AI-Revi har funnet og analysert relevante dokumenter for å gi deg et nøyaktig svar
          </p>
        </div>
      )}

      {variantInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
          <div className="flex items-center gap-2 text-blue-700">
            <span className="text-xs font-medium">{variantInfo.display_name}</span>
            <span className="text-xs text-blue-500">• {variantInfo.specialization}</span>
          </div>
        </div>
      )}

      {documentReferences.length > 0 && (
        <DocumentReferenceViewer
          documents={documentReferences}
          clientId={documentClientId}
          title="Dokumenter fra svaret"
        />
      )}

      <MessageContentParser content={cleanContent} />
    </div>
  );
};

export default EnhancedMessageContentParser;
