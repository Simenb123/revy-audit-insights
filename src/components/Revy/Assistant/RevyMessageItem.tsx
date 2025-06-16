
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { RevyMessage } from '@/types/revio';
import RevyAvatar from '../RevyAvatar';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, Tag } from 'lucide-react';

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

  // Enhanced content processing with improved tag detection
  const processRevyContent = (content: string): React.ReactElement[] => {
    const lines = content.split('\n');
    const processedLines: React.ReactElement[] = [];
    
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        return;
      }

      // Enhanced regex for article links
      const articleLinkRegex = /\[([^\]]+)\]\(\/fag\/artikkel\/([^)]+)\)/g;
      
      // Check for article section headers
      const isArticleSection = /📚\s*(\*\*)?[Rr]elevante?\s+(fag)?artikler?:?(\*\*)?/i.test(trimmedLine) ||
                               /📚.*[Aa]rtikler?/i.test(trimmedLine);
      
      if (isArticleSection) {
        processedLines.push(
          <div key={`header-${lineIndex}`} className="mt-4 mb-2">
            <div className="flex items-center gap-2 text-blue-800 font-semibold">
              <FileText className="h-4 w-4" />
              <span>Relevante fagartikler:</span>
            </div>
          </div>
        );
      } else if (articleLinkRegex.test(trimmedLine)) {
        // Process article links
        const matches = [...trimmedLine.matchAll(articleLinkRegex)];
        const parts = trimmedLine.split(articleLinkRegex);
        
        processedLines.push(
          <div key={`article-${lineIndex}`} className="my-1">
            {parts.map((part, partIndex) => {
              const matchIndex = Math.floor(partIndex / 3);
              const match = matches[matchIndex];
              if (partIndex % 3 === 1 && match) {
                return (
                  <a
                    key={`link-${lineIndex}-${partIndex}`}
                    href={`/fag/artikkel/${match[2]}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium hover:underline bg-blue-50 px-2 py-1 rounded mr-2"
                  >
                    <FileText className="h-3 w-3" />
                    {match[1]}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                );
              } else if (partIndex % 3 === 0 && part.trim()) {
                return <span key={`text-${lineIndex}-${partIndex}`}>{part}</span>;
              }
              return null;
            })}
          </div>
        );
      } else if (/🔖\s*(\*\*)?[Rr]eferanse:?(\*\*)?/i.test(trimmedLine)) {
        // Enhanced reference parsing
        const refMatch = trimmedLine.match(/🔖\s*(\*\*)?[Rr]eferanse:?(\*\*)?\s*(.+)/i);
        if (refMatch && refMatch[3]) {
          processedLines.push(
            <div key={`ref-${lineIndex}`} className="my-2">
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
                📋 {refMatch[3]}
              </Badge>
            </div>
          );
        }
      } else if (/🏷️\s*(\*\*)?[Ee][Mm][Nn][Ee][Rr]:?(\*\*)?/i.test(trimmedLine)) {
        // IMPROVED TAGS PARSING - this is the critical fix
        console.log('🏷️ Found tags line:', trimmedLine);
        
        // More flexible regex to capture tags after EMNER:
        const tagsMatch = trimmedLine.match(/🏷️\s*(\*\*)?[Ee][Mm][Nn][Ee][Rr]:?(\*\*)?\s*(.+)/i);
        
        if (tagsMatch && tagsMatch[3]) {
          const tagsText = tagsMatch[3].trim();
          console.log('🏷️ Raw tags text:', tagsText);
          
          // Clean up the tags text and split
          const tags = tagsText
            .replace(/\*\*/g, '') // Remove any remaining ** 
            .split(/[,;]/) // Split on comma or semicolon
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0 && tag !== '**' && tag !== '*'); // Remove empty and markdown artifacts
          
          console.log('🏷️ Parsed tags:', tags);
          
          if (tags.length > 0) {
            processedLines.push(
              <div key={`tags-${lineIndex}`} className="mt-3 mb-1">
                <div className="flex flex-wrap gap-1 items-center">
                  <Tag className="h-3 w-3 text-gray-600 mr-1" />
                  {tags.map((tag, tagIndex) => (
                    <Badge 
                      key={`tag-${lineIndex}-${tagIndex}`} 
                      variant="secondary" 
                      className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          }
        }
      } else if (/💡\s*[Tt]ips?:/i.test(trimmedLine)) {
        // Tips section
        processedLines.push(
          <div key={`tips-${lineIndex}`} className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">💡</span>
              <span className="text-sm text-yellow-800">{trimmedLine.replace(/💡\s*[Tt]ips?:\s*/i, '').trim()}</span>
            </div>
          </div>
        );
      } else if (trimmedLine) {
        // Regular content - check for inline links
        const hasArticleLinks = articleLinkRegex.test(trimmedLine);
        
        if (hasArticleLinks) {
          // Process inline article links
          const parts = trimmedLine.split(articleLinkRegex);
          const matches = [...trimmedLine.matchAll(articleLinkRegex)];
          
          processedLines.push(
            <div key={`inline-${lineIndex}`} className="leading-relaxed">
              {parts.map((part, partIndex) => {
                const matchIndex = Math.floor(partIndex / 3);
                const match = matches[matchIndex];
                if (partIndex % 3 === 1 && match) {
                  return (
                    <a
                      key={`inline-link-${lineIndex}-${partIndex}`}
                      href={`/fag/artikkel/${match[2]}`}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      {match[1]}
                    </a>
                  );
                } else if (partIndex % 3 === 0 && part.trim()) {
                  return <span key={`inline-text-${lineIndex}-${partIndex}`}>{part}</span>;
                }
                return null;
              })}
            </div>
          );
        } else {
          // Regular text without links
          processedLines.push(
            <div key={`regular-${lineIndex}`} className="leading-relaxed">
              {trimmedLine}
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
