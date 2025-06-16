
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, Tag, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MessageContentParserProps {
  content: string;
  isEmbedded?: boolean;
}

export const MessageContentParser = ({ content, isEmbedded = false }: MessageContentParserProps) => {
  const [copiedBlocks, setCopiedBlocks] = useState<Set<number>>(new Set());

  // 🔍 DEBUG: Log the content being parsed
  console.log('🔍 MessageContentParser received content:', content);
  console.log('📏 Content length:', content.length);
  console.log('🏷️ Content contains emoji:', /🏷️/.test(content));
  console.log('🔤 Content contains EMNER:', /EMNER/i.test(content));

  const copyToClipboard = async (text: string, blockIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBlocks(prev => new Set(prev).add(blockIndex));
      setTimeout(() => {
        setCopiedBlocks(prev => {
          const newSet = new Set(prev);
          newSet.delete(blockIndex);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const processContent = (content: string): React.ReactElement[] => {
    const lines = content.split('\n');
    const processedElements: React.ReactElement[] = [];
    let currentBlockIndex = 0;

    console.log('🔍 Processing content lines:', lines.length);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      console.log(`🔍 Processing line ${i}: "${trimmedLine}"`);

      // Skip empty lines but add spacing
      if (!trimmedLine) {
        if (processedElements.length > 0) {
          processedElements.push(
            <div key={`spacer-${i}`} className="h-2" />
          );
        }
        continue;
      }

      // Code blocks (```code```)
      if (trimmedLine.startsWith('```')) {
        const codeLines: string[] = [];
        let j = i + 1;
        
        while (j < lines.length && !lines[j].trim().startsWith('```')) {
          codeLines.push(lines[j]);
          j++;
        }
        
        if (codeLines.length > 0) {
          const codeText = codeLines.join('\n');
          const blockId = currentBlockIndex++;
          
          processedElements.push(
            <div key={`code-${i}`} className="my-4 relative group">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-100"
                    onClick={() => copyToClipboard(codeText, blockId)}
                  >
                    {copiedBlocks.has(blockId) ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap">{codeText}</pre>
              </div>
            </div>
          );
        }
        
        i = j; // Skip to after closing ```
        continue;
      }

      // Headers (## Header)
      if (trimmedLine.startsWith('##')) {
        const headerText = trimmedLine.replace(/^#+\s*/, '');
        processedElements.push(
          <h3 key={`header-${i}`} className={`font-semibold text-gray-900 mt-6 mb-3 ${isEmbedded ? 'text-base' : 'text-lg'}`}>
            {headerText}
          </h3>
        );
        continue;
      }

      // Bold text (**text**)
      if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split(/\*\*(.*?)\*\*/g);
        processedElements.push(
          <p key={`bold-${i}`} className={`leading-relaxed ${isEmbedded ? 'text-sm' : 'text-base'} mb-2`}>
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? 
                <strong key={partIndex} className="font-semibold">{part}</strong> : 
                part
            )}
          </p>
        );
        continue;
      }

      // Bullet points (- item or * item)
      if (trimmedLine.match(/^[-*]\s+/)) {
        const bulletItems: string[] = [trimmedLine.replace(/^[-*]\s+/, '')];
        let j = i + 1;
        
        while (j < lines.length && lines[j].trim().match(/^[-*]\s+/)) {
          bulletItems.push(lines[j].trim().replace(/^[-*]\s+/, ''));
          j++;
        }
        
        processedElements.push(
          <ul key={`bullets-${i}`} className={`space-y-1 mb-4 ${isEmbedded ? 'text-sm' : 'text-base'}`}>
            {bulletItems.map((item, itemIndex) => (
              <li key={itemIndex} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1.5 text-xs">●</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        );
        
        i = j - 1; // Adjust index
        continue;
      }

      // Numbered lists (1. item)
      if (trimmedLine.match(/^\d+\.\s+/)) {
        const numberedItems: string[] = [trimmedLine.replace(/^\d+\.\s+/, '')];
        let j = i + 1;
        
        while (j < lines.length && lines[j].trim().match(/^\d+\.\s+/)) {
          numberedItems.push(lines[j].trim().replace(/^\d+\.\s+/, ''));
          j++;
        }
        
        processedElements.push(
          <ol key={`numbered-${i}`} className={`space-y-1 mb-4 ${isEmbedded ? 'text-sm' : 'text-base'}`}>
            {numberedItems.map((item, itemIndex) => (
              <li key={itemIndex} className="flex items-start gap-3">
                <span className="text-blue-600 font-medium text-sm min-w-[1.5rem]">
                  {itemIndex + 1}.
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        );
        
        i = j - 1; // Adjust index
        continue;
      }

      // Article links
      const articleLinkRegex = /\[([^\]]+)\]\(\/fag\/artikkel\/([^)]+)\)/g;
      if (articleLinkRegex.test(trimmedLine)) {
        const matches = [...trimmedLine.matchAll(articleLinkRegex)];
        const parts = trimmedLine.split(articleLinkRegex);
        
        processedElements.push(
          <div key={`articles-${i}`} className="my-3">
            <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
              <FileText className="h-4 w-4" />
              <span className={isEmbedded ? 'text-sm' : 'text-base'}>Relevante fagartikler:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {matches.map((match, matchIndex) => (
                <a
                  key={`article-${i}-${matchIndex}`}
                  href={`/fag/artikkel/${match[2]}`}
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium hover:underline bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors duration-200 group"
                >
                  <FileText className="h-3 w-3" />
                  <span className={isEmbedded ? 'text-xs' : 'text-sm'}>{match[1]}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        );
        continue;
      }

      // Reference badges (🔖 **REFERANSE:** text)
      if (/🔖\s*(\*\*)?[Rr]eferanse:?(\*\*)?/i.test(trimmedLine)) {
        const refMatch = trimmedLine.match(/🔖\s*(\*\*)?[Rr]eferanse:?(\*\*)?\s*(.+)/i);
        if (refMatch && refMatch[3]) {
          processedElements.push(
            <div key={`ref-${i}`} className="my-3">
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800 px-3 py-1">
                <span className="mr-1">📋</span>
                {refMatch[3]}
              </Badge>
            </div>
          );
        }
        continue;
      }

      // 🔧 SIMPLIFIED AND ENHANCED Tags parsing with multiple robust patterns
      console.log(`🔍 Checking line ${i} for tags: "${trimmedLine}"`);
      
      // First, check if this line contains any EMNER text at all
      if (/EMNER/i.test(trimmedLine)) {
        console.log('✅ Found EMNER in line, attempting to extract tags...');
        
        let tags: string[] = [];
        
        // Try multiple patterns, ordered from most specific to most general
        const patterns = [
          // Pattern 1: 🏷️ **EMNER:** tags
          /🏷️\s*\*\*EMNER:?\*\*\s*(.+)/i,
          // Pattern 2: 🏷️ EMNER: tags (without bold)
          /🏷️\s*EMNER:?\s*(.+)/i,
          // Pattern 3: **EMNER:** tags (without emoji)
          /\*\*EMNER:?\*\*\s*(.+)/i,
          // Pattern 4: EMNER: tags (minimal format)
          /EMNER:?\s*(.+)/i,
          // Pattern 5: Any text after EMNER (fallback)
          /EMNER.*?([A-Za-zÆØÅæøå,\s]+)/i
        ];
        
        for (let p = 0; p < patterns.length; p++) {
          const match = trimmedLine.match(patterns[p]);
          if (match && match[1]) {
            console.log(`✅ Pattern ${p + 1} matched:`, match[1]);
            
            // Clean and split the tags
            const rawTags = match[1]
              .replace(/\*\*/g, '') // Remove any bold markers
              .replace(/[.!?]+$/, '') // Remove trailing punctuation
              .trim();
            
            console.log('🧹 Cleaned tags string:', rawTags);
            
            // Split on common separators
            tags = rawTags
              .split(/[,;]/)
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0 && tag.length < 50); // Reasonable tag length
            
            console.log('📋 Final tags array:', tags);
            break;
          }
        }
        
        // If we found tags, render them
        if (tags.length > 0) {
          console.log('🎯 Rendering tags section with', tags.length, 'tags:', tags);
          processedElements.push(
            <div key={`tags-${i}`} className="mt-4 mb-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex flex-wrap gap-2 items-start">
                <div className="flex items-center gap-1.5 text-blue-700 mb-2 min-w-0">
                  <Tag className="h-4 w-4 flex-shrink-0" />
                  <span className={`font-medium ${isEmbedded ? 'text-sm' : 'text-base'}`}>Emner:</span>
                </div>
                <div className="flex flex-wrap gap-2 min-w-0 flex-1">
                  {tags.map((tag, tagIndex) => (
                    <Badge 
                      key={tagIndex} 
                      variant="secondary" 
                      className={`bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer border border-blue-300 ${isEmbedded ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'}`}
                      onClick={() => {
                        console.log('🏷️ Tag clicked:', tag);
                        // Future: Add tag navigation functionality
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          );
          console.log('✅ Tags rendered successfully for line', i);
        } else {
          console.warn('⚠️ Found EMNER but could not extract any valid tags from:', trimmedLine);
          // Show a fallback tags section to indicate we found EMNER but couldn't parse it
          processedElements.push(
            <div key={`tags-fallback-${i}`} className="mt-4 mb-2 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <div className="flex items-center gap-2 text-yellow-700">
                <Tag className="h-4 w-4" />
                <span className={`font-medium ${isEmbedded ? 'text-sm' : 'text-base'}`}>
                  Emner funnet, men kunne ikke parses: {trimmedLine}
                </span>
              </div>
            </div>
          );
        }
        continue;
      }

      // Tips sections (💡 Tips:)
      if (/💡\s*[Tt]ips?:/i.test(trimmedLine)) {
        const tipText = trimmedLine.replace(/💡\s*[Tt]ips?:\s*/i, '').trim();
        processedElements.push(
          <div key={`tip-${i}`} className="my-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 text-lg">💡</span>
              <div>
                <span className="font-medium text-yellow-800 text-sm">Tips:</span>
                <p className={`text-yellow-700 mt-1 ${isEmbedded ? 'text-sm' : 'text-base'}`}>{tipText}</p>
              </div>
            </div>
          </div>
        );
        continue;
      }

      // Regular paragraphs
      processedElements.push(
        <p key={`para-${i}`} className={`leading-relaxed mb-3 ${isEmbedded ? 'text-sm' : 'text-base'} text-gray-900`}>
          {trimmedLine}
        </p>
      );
    }

    console.log('✅ Finished processing content, created', processedElements.length, 'elements');
    return processedElements;
  };

  return (
    <div className="space-y-1">
      {processContent(content)}
    </div>
  );
};
