
import React from 'react';
import { MessageContentParser } from './MessageContentParser';

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


  // Extract knowledge article references if present
  const knowledgeMatch = content.match(/<!-- KNOWLEDGE_ARTICLES: (.*?) -->/);
  const knowledgeArticles = knowledgeMatch ? JSON.parse(knowledgeMatch[1]) : [];

  // Extract document references if present
  const docRefMatch = content.match(/<!-- DOCUMENT_REFERENCES: (.*?) -->/);
  let documentReferences: Array<{ id: string; fileName?: string; snippet?: string }> = [];
  if (docRefMatch) {
    try {
      documentReferences = JSON.parse(docRefMatch[1]);
    } catch (e) {
      console.error('Failed to parse DOCUMENT_REFERENCES:', e);
    }
  }
 
  // Clean content for display (remove metadata comments)
  const cleanContent = content
    .replace(/<!-- ARTICLE_MAPPINGS: .*? -->/g, '')
    .replace(/<!-- VARIANT_INFO: .*? -->/g, '')
    .replace(/<!-- DOCUMENT_REFERENCES: .*? -->/g, '')
    .replace(/<!-- KNOWLEDGE_ARTICLES: .*? -->/g, '')
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
      
      <MessageContentParser content={cleanContent} />


      {knowledgeArticles.length > 0 && (
        <div className="mt-4 border-t pt-2 space-y-1">
          <p className="text-xs text-muted-foreground mb-1">Refererte artikler:</p>
          <ul className="space-y-1 list-disc list-inside">
            {knowledgeArticles.map((article: any) => (
              <li key={article.slug || article.id} className="text-sm">
                <a
                  href={`/fag/artikkel/${article.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {article.title}
                </a>{' '}
                {article.reference_code && (
                  <span className="text-xs text-gray-500">({article.reference_code})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {documentReferences.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Kildedokumenter</h4>
          <ul className="space-y-2">
            {documentReferences.map((doc) => (
              <li key={doc.id} className="border rounded-lg p-2 bg-gray-50">
                <div className="text-xs font-semibold text-gray-700">
                  {doc.fileName}
                </div>
                {doc.snippet && (
                  <p className="text-xs text-gray-600 italic mt-1">
                    "{doc.snippet}"
                  </p>
                )}
                <a
                  href="/documents"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                >
                  Åpne dokument
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EnhancedMessageContentParser;
