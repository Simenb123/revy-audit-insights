
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, Tag, Copy, Check, Book, Scale, FileCode, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { extractTagsFromContent } from './TagExtractor';
import ContentTypeBadge from '@/components/Knowledge/ContentTypeBadge';

interface MessageContentParserProps {
  content: string;
  isEmbedded?: boolean;
}

interface ArticleMapping {
  articleSlug: string;
  articleTitle: string;
  matchedTags: string[];
  relevanceScore: number;
  contentType?: string;
  category?: string;
}

// Enhanced content type configuration
const CONTENT_TYPE_CONFIG = {
  'fagartikkel': {
    label: 'Fagartikkel',
    icon: FileText,
    bgColor: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    borderColor: 'border-blue-700',
    textColor: 'text-white'
  },
  'lov': {
    label: 'Lov',
    icon: Scale,
    bgColor: 'bg-green-600',
    hoverColor: 'hover:bg-green-700',
    borderColor: 'border-green-700',
    textColor: 'text-white'
  },
  'isa-standard': {
    label: 'ISA-standard',
    icon: FileCode,
    bgColor: 'bg-purple-600',
    hoverColor: 'hover:bg-purple-700',
    borderColor: 'border-purple-700',
    textColor: 'text-white'
  },
  'nrs-standard': {
    label: 'NRS-standard',
    icon: Book,
    bgColor: 'bg-indigo-600',
    hoverColor: 'hover:bg-indigo-700',
    borderColor: 'border-indigo-700',
    textColor: 'text-white'
  },
  'forskrift': {
    label: 'Forskrift',
    icon: Gavel,
    bgColor: 'bg-orange-600',
    hoverColor: 'hover:bg-orange-700',
    borderColor: 'border-orange-700',
    textColor: 'text-white'
  },
  'forarbeider': {
    label: 'Forarbeider',
    icon: FileText,
    bgColor: 'bg-gray-600',
    hoverColor: 'hover:bg-gray-700',
    borderColor: 'border-gray-700',
    textColor: 'text-white'
  }
};

export const MessageContentParser = ({ content, isEmbedded = false }: MessageContentParserProps) => {
  const [copiedBlocks, setCopiedBlocks] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  console.log('🔍 MessageContentParser processing content with enhanced categorization:', content.substring(0, 100) + '...');

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

  // Get content type config with fallback
  const getContentTypeConfig = (contentType?: string) => {
    return CONTENT_TYPE_CONFIG[contentType as keyof typeof CONTENT_TYPE_CONFIG] || CONTENT_TYPE_CONFIG.fagartikkel;
  };

  // Handle tag click with enhanced content type awareness
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
      const contentTypeConfig = getContentTypeConfig(mapping.contentType);
      console.log('📖 Navigating to article:', mapping.articleTitle, 'Type:', mapping.contentType);
      navigate(`/fag/artikkel/${mapping.articleSlug}`);
      toast.success(`Åpner ${contentTypeConfig.label.toLowerCase()}: ${mapping.articleTitle}`);
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

    console.log('🔍 Processing content lines with enhanced categorization:', lines.length);

    // Extract article mappings and tags FIRST
    const articleMappings = extractArticleMappings(content);
    console.log('📎 Extracted article mappings:', Object.keys(articleMappings));
    
    const tagExtraction = extractTagsFromContent(content);
    const extractedTags = tagExtraction.tags;
    const contentTypes = tagExtraction.contentTypes || ['fagartikkel'];
    
    console.log('🏷️ ENHANCED: Tag extraction result:', {
      tags: extractedTags,
      contentTypes: contentTypes,
      hasValidFormat: tagExtraction.hasValidFormat,
      extractedFrom: tagExtraction.extractedFrom,
      tagCount: extractedTags.length
    });

    // Process each line but skip EMNER lines since we'll add tags separately
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

      // Skip the EMNER line since we'll add it as clickable tags separately
      if (/🏷️.*[Ee][Mm][Nn][Ee][Rr]|[Ee][Mm][Nn][Ee][Rr]:/i.test(trimmedLine)) {
        console.log('⏭️ Skipping EMNER line, will render separately with content types');
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

      // Article links with enhanced content type display
      const articleLinkRegex = /\[([^\]]+)\]\(\/fag\/artikkel\/([^)]+)\)/g;
      if (articleLinkRegex.test(trimmedLine)) {
        const matches = [...trimmedLine.matchAll(articleLinkRegex)];
        
        processedElements.push(
          <div key={`articles-${i}`} className="my-4">
            <div className="flex items-center gap-2 text-blue-800 font-medium mb-3">
              <FileText className="h-4 w-4" />
              <span className={isEmbedded ? 'text-sm' : 'text-base'}>Relevante artikler:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {matches.map((match, matchIndex) => {
                // Try to determine content type from article mappings
                const slug = match[2];
                const matchedMapping = Object.values(articleMappings).find(m => m.articleSlug === slug);
                const contentType = matchedMapping?.contentType || 'fagartikkel';
                
                return (
                  <a
                    key={`article-${i}-${matchIndex}`}
                    href={`/fag/artikkel/${match[2]}`}
                    className="inline-flex items-center gap-2 hover:underline px-4 py-2 rounded-lg transition-all duration-200 group shadow-sm bg-white border border-gray-200 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isEmbedded ? 'text-sm' : 'text-base'} text-gray-900`}>
                        {match[1]}
                      </span>
                      <ContentTypeBadge contentType={contentType as any} size="sm" />
                    </div>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
                  </a>
                );
              })}
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

    // Enhanced tags section with better content type visualization
    console.log('🚨 ENHANCED: Rendering tags section with improved content types...');
    
    let tagsToRender = extractedTags;
    
    // If no tags extracted, use intelligent fallback
    if (!tagsToRender || tagsToRender.length === 0) {
      console.log('⚠️ No tags extracted, using fallback tags');
      tagsToRender = ['Revisjon', 'Fagstoff']; // Basic fallback
    }
    
    console.log('🎯 FINAL: Will render these tags with content types:', tagsToRender, 'Content types:', contentTypes);
    
    // ALWAYS add the enhanced clickable tags section
    processedElements.push(
      <div 
        key="ENHANCED-clickable-tags" 
        className="mt-6 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-700" />
            <span className={`font-bold text-blue-800 ${isEmbedded ? 'text-sm' : 'text-base'}`}>
              Relaterte emner
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 opacity-75">
              Klikk for å utforske
            </span>
            {contentTypes.length > 0 && (
              <div className="flex gap-1">
                {contentTypes.map((type, index) => (
                  <ContentTypeBadge 
                    key={index} 
                    contentType={type as any} 
                    size="sm" 
                    showIcon={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tagsToRender.map((tag, tagIndex) => {
            // Find matching key in articleMappings
            const matchingKey = articleMappings[tag] ? tag : 
              Object.keys(articleMappings).find(key => 
                key.toLowerCase() === tag.toLowerCase() || 
                key.toLowerCase().includes(tag.toLowerCase()) ||
                tag.toLowerCase().includes(key.toLowerCase())
              );
            
            const hasMapping = !!matchingKey;
            const mapping = matchingKey ? articleMappings[matchingKey] : null;
            const contentType = mapping?.contentType || contentTypes[0];
            const contentTypeConfig = getContentTypeConfig(contentType);
            const IconComponent = contentTypeConfig.icon;
            
            return (
              <Badge 
                key={`ENHANCED-tag-${tagIndex}`} 
                variant="secondary" 
                className={`
                  ${hasMapping 
                    ? `${contentTypeConfig.bgColor} ${contentTypeConfig.textColor} ${contentTypeConfig.hoverColor} border ${contentTypeConfig.borderColor} shadow-md` 
                    : 'bg-gray-600 text-white hover:bg-gray-700 border border-gray-700 shadow-md'
                  } 
                  cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg 
                  font-medium px-3 py-2 text-xs flex items-center gap-1.5
                `}
                onClick={() => handleTagClick(tag, articleMappings)}
                title={hasMapping ? `Klikk for å åpne ${contentTypeConfig.label.toLowerCase()}: ${tag}` : `Klikk for å søke etter ${tag}`}
              >
                <IconComponent className="w-3 h-3" />
                {tag}
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Badge>
            );
          })}
        </div>
        
        <div className="mt-3 text-xs text-blue-600 opacity-60">
          {tagExtraction.hasValidFormat ? 'Fra AI-respons' : 'Automatisk generert'} • 
          {contentTypes.map(type => CONTENT_TYPE_CONFIG[type as keyof typeof CONTENT_TYPE_CONFIG]?.label || type).join(', ')}
        </div>
      </div>
    );

    console.log('✅ ENHANCED: Created', processedElements.length, 'elements including enhanced tags section with content types');
    return processedElements;
  };

  return (
    <div className="space-y-1">
      {processContent(content)}
    </div>
  );
};
