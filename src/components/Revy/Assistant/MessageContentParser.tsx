
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, Tag, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface MessageContentParserProps {
  content: string;
  isEmbedded?: boolean;
}

interface ArticleMapping {
  articleSlug: string;
  articleTitle: string;
  matchedTags: string[];
  relevanceScore: number;
}

export const MessageContentParser = ({ content, isEmbedded = false }: MessageContentParserProps) => {
  const [copiedBlocks, setCopiedBlocks] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

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

  // Extract article mappings from content
  const extractArticleMappings = (content: string): Record<string, ArticleMapping> => {
    const mappingMatch = content.match(/<!-- ARTICLE_MAPPINGS: (.+?) -->/);
    if (mappingMatch) {
      try {
        return JSON.parse(mappingMatch[1]);
      } catch (error) {
        console.error('❌ Failed to parse article mappings:', error);
      }
    }
    return {};
  };

  // Enhanced tag extraction with better visibility
  const extractTags = (content: string): string[] => {
    console.log('🏷️ Starting enhanced tag extraction...');
    
    // Find any line that contains "EMNER" (case insensitive)
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      console.log(`🔍 Checking line ${i}: "${line}"`);
      
      // Check if line contains EMNER in any form
      if (/emner/i.test(line)) {
        console.log('✅ Found EMNER line:', line);
        
        // Extract everything after "EMNER:" or "EMNER"
        let tagsPart = '';
        
        // Try multiple simple extraction methods
        if (line.includes(':')) {
          tagsPart = line.split(':').slice(1).join(':').trim();
        } else {
          // Look for text after "EMNER" word
          const emnerIndex = line.toLowerCase().indexOf('emner');
          if (emnerIndex !== -1) {
            tagsPart = line.substring(emnerIndex + 5).trim();
          }
        }
        
        console.log('📝 Extracted tags part:', tagsPart);
        
        if (tagsPart) {
          // Clean up the tags part - remove bold markers, emojis, etc.
          const cleanedPart = tagsPart
            .replace(/\*\*/g, '') // Remove bold markers
            .replace(/🏷️/g, '') // Remove emoji
            .replace(/[.!?]+$/, '') // Remove trailing punctuation
            .trim();
          
          console.log('🧹 Cleaned tags part:', cleanedPart);
          
          // Split on common separators and clean each tag
          const tags = cleanedPart
            .split(/[,;]/)
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0 && tag.length < 50);
          
          console.log('🎯 Final extracted tags:', tags);
          return tags;
        }
      }
    }
    
    console.log('❌ No tags found in content');
    return [];
  };

  // Handle tag click with article navigation
  const handleTagClick = (tag: string, articleMappings: Record<string, ArticleMapping>) => {
    console.log('🏷️ Tag clicked:', tag);
    
    // Find exact match first
    let mapping = articleMappings[tag];
    
    // If no exact match, try case-insensitive and partial matches
    if (!mapping) {
      const tagLower = tag.toLowerCase();
      const matchingKey = Object.keys(articleMappings).find(key => 
        key.toLowerCase() === tagLower || 
        key.toLowerCase().includes(tagLower) ||
        tagLower.includes(key.toLowerCase())
      );
      
      if (matchingKey) {
        mapping = articleMappings[matchingKey];
        console.log('🎯 Found partial match for tag:', tag, '→', matchingKey);
      }
    }
    
    if (mapping && mapping.articleSlug) {
      console.log('📖 Navigating to article:', mapping.articleTitle);
      navigate(`/fag/artikkel/${mapping.articleSlug}`);
      toast.success(`Åpner fagartikkel: ${mapping.articleTitle}`);
    } else {
      console.log('❌ No article mapping found for tag:', tag);
      toast.info(`Søker etter: ${tag}`);
      navigate(`/fag/sok?q=${encodeURIComponent(tag)}`);
    }
  };

  const processContent = (content: string): React.ReactElement[] => {
    const lines = content.split('\n');
    const processedElements: React.ReactElement[] = [];
    let currentBlockIndex = 0;

    console.log('🔍 Processing content lines:', lines.length);

    // Extract article mappings and tags first
    const articleMappings = extractArticleMappings(content);
    console.log('📎 Extracted article mappings:', Object.keys(articleMappings));
    const extractedTags = extractTags(content);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines but add spacing
      if (!trimmedLine) {
        if (processedElements.length > 0) {
          processedElements.push(
            <div key={`spacer-${i}`} className="h-2" />
          );
        }
        continue;
      }

      // Skip the EMNER line since we'll add it at the bottom
      if (/emner/i.test(trimmedLine)) {
        console.log('⏭️ Skipping EMNER line since we will add tags at the bottom');
        continue;
      }

      // Skip article mapping comments
      if (trimmedLine.includes('ARTICLE_MAPPINGS')) {
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

    // 🏷️ NOW: Add tags at the BOTTOM with enhanced visibility
    if (extractedTags.length > 0) {
      console.log('🎉 Rendering clickable tags section at BOTTOM with', extractedTags.length, 'tags');
      
      processedElements.push(
        <div 
          key="extracted-tags-bottom" 
          className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200" 
          style={{ display: 'block', visibility: 'visible', position: 'relative', zIndex: 10 }}
        >
          <div className="flex flex-wrap gap-3 items-start">
            <div className="flex items-center gap-2 text-blue-700 mb-3 min-w-0">
              <Tag className="h-5 w-5 flex-shrink-0" />
              <span className={`font-semibold ${isEmbedded ? 'text-sm' : 'text-base'}`}>Emner:</span>
            </div>
            <div className="flex flex-wrap gap-2 min-w-0 flex-1">
              {extractedTags.map((tag, tagIndex) => {
                const hasMapping = articleMappings[tag] || 
                  Object.keys(articleMappings).some(key => 
                    key.toLowerCase() === tag.toLowerCase() || 
                    key.toLowerCase().includes(tag.toLowerCase()) ||
                    tag.toLowerCase().includes(key.toLowerCase())
                  );
                
                return (
                  <Badge 
                    key={tagIndex} 
                    variant="secondary" 
                    className={`
                      ${hasMapping 
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-2 border-blue-300 cursor-pointer' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300 cursor-pointer'
                      } 
                      transition-all duration-200 transform hover:scale-105 font-medium 
                      ${isEmbedded ? 'text-xs px-2 py-1.5' : 'text-sm px-3 py-2'}
                    `}
                    style={{ display: 'inline-flex', visibility: 'visible' }}
                    onClick={() => handleTagClick(tag, articleMappings)}
                    title={hasMapping ? `Klikk for å åpne fagartikkel om ${tag}` : `Klikk for å søke etter ${tag}`}
                  >
                    {hasMapping && <FileText className="w-3 h-3 mr-1" />}
                    {tag}
                    {hasMapping && <ExternalLink className="w-3 h-3 ml-1 opacity-60" />}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      );
    } else {
      console.log('🚨 NO TAGS EXTRACTED - this should be investigated');
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
