
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { RevyMessage } from '@/types/revio';
import RevyAvatar from '../RevyAvatar';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink } from 'lucide-react';

interface RevyMessageItemProps {
  message: RevyMessage;
  isEmbedded?: boolean;
}

export const RevyMessageItem = ({ message, isEmbedded = false }: RevyMessageItemProps) => {
  const { sender, content, timestamp } = message;

  const userMessageClass = isEmbedded
    ? "bg-blue-600 text-white p-2.5 rounded-lg"
    : "bg-blue-600 text-white p-3 rounded-xl";
    
  const revyMessageContainerClass = "flex items-start gap-2.5";
  const revyMessageClass = isEmbedded
    ? "bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm"
    : "bg-white border border-gray-200 p-3 rounded-2xl shadow-sm";

  const formattedTimestamp = timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: nb }) : '';

  // Enhanced content processing for better article link display
  const processRevyContent = (content: string): React.ReactElement[] => {
    // Split content into lines for processing
    const lines = content.split('\n');
    const processedLines: React.ReactElement[] = [];
    
    lines.forEach((line, lineIndex) => {
      // Check for article links
      const articleLinkRegex = /\[([^\]]+)\]\(\/fag\/artikkel\/([^)]+)\)/g;
      
      if (line.includes('📚 Relevante artikler:') || line.includes('Relevante artikler:')) {
        processedLines.push(
          <div key={`header-${lineIndex}`} className="mt-4 mb-2">
            <div className="flex items-center gap-2 text-blue-800 font-semibold">
              <FileText className="h-4 w-4" />
              <span>Relevante fagartikler:</span>
            </div>
          </div>
        );
      } else if (articleLinkRegex.test(line)) {
        // Process article links specially
        const matches = [...line.matchAll(articleLinkRegex)];
        const parts = line.split(articleLinkRegex);
        
        processedLines.push(
          <div key={`article-${lineIndex}`} className="my-1">
            {parts.map((part, partIndex) => {
              const matchIndex = Math.floor(partIndex / 3);
              const match = matches[matchIndex];
              if (partIndex % 3 === 1 && match) {
                // This is a link title
                return (
                  <a
                    key={`link-${lineIndex}-${partIndex.toString()}`}
                    href={`/fag/artikkel/${match[2]}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium hover:underline bg-blue-50 px-2 py-1 rounded mr-2"
                  >
                    <FileText className="h-3 w-3" />
                    {match[1]}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                );
              } else if (partIndex % 3 === 0 && part.trim()) {
                // Regular text
                return <span key={`text-${lineIndex}-${partIndex.toString()}`}>{part}</span>;
              }
              return null;
            })}
          </div>
        );
      } else if (line.includes('🔖 REFERANSE:') || line.includes('Referanse:')) {
        const refMatch = line.match(/(?:🔖 REFERANSE:|Referanse:)\s*(.+)/);
        if (refMatch) {
          processedLines.push(
            <div key={`ref-${lineIndex}`} className="my-1">
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
                📋 {refMatch[1]}
              </Badge>
            </div>
          );
        }
      } else if (line.includes('🏷️ EMNER:') || line.includes('Emner:')) {
        const tagsMatch = line.match(/(?:🏷️ EMNER:|Emner:)\s*(.+)/);
        if (tagsMatch) {
          const tags = tagsMatch[1].split(',').map(tag => tag.trim());
          processedLines.push(
            <div key={`tags-${lineIndex}`} className="my-2 flex flex-wrap gap-1">
              <span className="text-sm text-gray-600 mr-2">Emner:</span>
              {tags.map((tag, tagIndex) => (
                <Badge key={`tag-${lineIndex}-${tagIndex.toString()}`} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          );
        }
      } else if (line.includes('💡 Tips:')) {
        processedLines.push(
          <div key={`tips-${lineIndex}`} className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">💡</span>
              <span className="text-sm text-yellow-800">{line.replace('💡 Tips:', '').trim()}</span>
            </div>
          </div>
        );
      } else if (line.trim()) {
        // Regular content - process for inline links but return as JSX
        const hasArticleLinks = articleLinkRegex.test(line);
        
        if (hasArticleLinks) {
          // Process inline article links within regular text
          const parts = line.split(articleLinkRegex);
          const matches = [...line.matchAll(articleLinkRegex)];
          
          processedLines.push(
            <div key={`inline-${lineIndex}`} className="leading-relaxed">
              {parts.map((part, partIndex) => {
                const matchIndex = Math.floor(partIndex / 3);
                const match = matches[matchIndex];
                if (partIndex % 3 === 1 && match) {
                  return (
                    <a
                      key={`inline-link-${lineIndex}-${partIndex.toString()}`}
                      href={`/fag/artikkel/${match[2]}`}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      {match[1]}
                    </a>
                  );
                } else if (partIndex % 3 === 0 && part.trim()) {
                  return <span key={`inline-text-${lineIndex}-${partIndex.toString()}`}>{part}</span>;
                }
                return null;
              })}
            </div>
          );
        } else {
          // Regular text without links
          processedLines.push(
            <div key={`regular-${lineIndex}`} className="leading-relaxed">
              {line}
            </div>
          );
        }
      }
    });
    
    return processedLines;
  };

  if (sender === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex flex-col items-end max-w-[90%]">
          <div className={`${userMessageClass} rounded-br-none`}>
            {content}
          </div>
          {formattedTimestamp && <span className="text-xs text-gray-500 mt-1.5 px-1">{formattedTimestamp}</span>}
        </div>
      </div>
    );
  }

  if (sender === 'revy') {
    return (
       <div className="flex justify-start">
        <div className={`flex flex-col items-start ${isEmbedded ? 'max-w-[90%]' : 'max-w-[85%]'}`}>
          <div className={revyMessageContainerClass}>
            <RevyAvatar size={isEmbedded ? 'xs' : 'sm'} className="flex-shrink-0" />
            <div className={`${revyMessageClass} rounded-bl-none prose prose-sm max-w-none`}>
              <div className="space-y-2">
                {processRevyContent(content as string)}
              </div>
            </div>
          </div>
          {formattedTimestamp && <span className="text-xs text-gray-500 mt-1.5 ml-10 px-1">{formattedTimestamp}</span>}
        </div>
      </div>
    );
  }

  return null;
};
