
import React from 'react';

interface TagExtractionResult {
  tags: string[];
  hasValidFormat: boolean;
  extractedFrom: string;
}

export const extractTagsFromContent = (content: string): TagExtractionResult => {
  console.log('🔍 Starting enhanced tag extraction from content...');
  console.log('📝 Content preview:', content.substring(0, 200) + '...');
  
  const lines = content.split('\n');
  
  // Comprehensive patterns to catch all AI response formats
  const tagPatterns = [
    // Standard format: 🏷️ **EMNER:** tag1, tag2, tag3
    /🏷️\s*\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*\s*(.+)/,
    // Without emoji: **EMNER:** tag1, tag2, tag3
    /\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*\s*(.+)/,
    // Simple format: EMNER: tag1, tag2, tag3
    /^[Ee][Mm][Nn][Ee][Rr]:\s*(.+)/,
    // With bullet: • EMNER: tag1, tag2, tag3
    /[•·]\s*[Ee][Mm][Nn][Ee][Rr]:?\s*(.+)/,
    // Markdown style: ## EMNER or ### EMNER
    /#{2,3}\s*[Ee][Mm][Nn][Ee][Rr]:?\s*(.+)/,
    // Any line ending with EMNER: content
    /.*[Ee][Mm][Nn][Ee][Rr]:?\s*(.+)/,
    // Line starting with tags emoji
    /🏷️\s*(.+)/,
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    console.log(`🔍 Analyzing line ${i}: "${line}"`);
    
    for (const pattern of tagPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        console.log('✅ Found tags with pattern:', pattern);
        const tagsPart = match[1].trim();
        console.log('📝 Raw tags part:', tagsPart);
        
        // Enhanced cleaning for various AI response formats
        const cleanedPart = tagsPart
          .replace(/\*\*/g, '') // Remove bold markers
          .replace(/🏷️/g, '') // Remove emoji
          .replace(/[.!?]+$/, '') // Remove trailing punctuation
          .replace(/<!--.*?-->/g, '') // Remove HTML comments
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/^[:\-\s]+/, '') // Remove leading colons, dashes, spaces
          .trim();
        
        console.log('🧹 Cleaned tags part:', cleanedPart);
        
        // Split on common separators and clean each tag
        const tags = cleanedPart
          .split(/[,;|]/)
          .map(tag => tag.trim())
          .filter(tag => 
            tag.length > 0 && 
            tag.length < 50 && 
            !tag.includes('ARTICLE_MAPPINGS') &&
            !tag.includes('<!--') &&
            !/^\d+$/.test(tag) && // Remove pure numbers
            !tag.includes('**') && // Remove any remaining markdown
            tag !== 'EMNER' // Remove the word EMNER itself
          )
          .map(tag => {
            // Capitalize first letter for consistency
            return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
          });
        
        if (tags.length > 0) {
          console.log('🎯 Successfully extracted and formatted tags:', tags);
          return {
            tags,
            hasValidFormat: true,
            extractedFrom: line
          };
        }
      }
    }
  }
  
  console.log('❌ No valid tags found with standard patterns, trying intelligent fallback extraction...');
  
  // Intelligent fallback: extract key terms from the actual content
  const fallbackTags = extractIntelligentFallbackTags(content);
  
  if (fallbackTags.length > 0) {
    console.log('🔄 Using intelligent fallback tags:', fallbackTags);
    return {
      tags: fallbackTags,
      hasValidFormat: false,
      extractedFrom: 'Intelligent content analysis'
    };
  }
  
  console.log('❌ No tags found at all');
  return {
    tags: [],
    hasValidFormat: false,
    extractedFrom: ''
  };
};

function extractIntelligentFallbackTags(content: string): string[] {
  const contentLower = content.toLowerCase();
  const foundTags: string[] = [];
  
  // Tax and accounting terms that often appear in content
  const termMappings = [
    { patterns: ['skattemelding', 'skatterapport'], tag: 'Skattemelding' },
    { patterns: ['mva', 'merverdiavgift'], tag: 'MVA' },
    { patterns: ['regnskap', 'bokføring'], tag: 'Regnskap' },
    { patterns: ['revisjon', 'revisjonsarbeid'], tag: 'Revisjon' },
    { patterns: ['inntekt', 'omsetning'], tag: 'Inntekter' },
    { patterns: ['isa 315', 'isa315'], tag: 'ISA 315' },
    { patterns: ['isa 230', 'isa230'], tag: 'ISA 230' },
    { patterns: ['isa 240', 'isa240'], tag: 'ISA 240' },
    { patterns: ['materialitet', 'vesentlighet'], tag: 'Materialitet' },
    { patterns: ['risikovurdering', 'risiko'], tag: 'Risikovurdering' },
    { patterns: ['dokumentasjon', 'dokumentere'], tag: 'Dokumentasjon' },
    { patterns: ['planlegging', 'plan'], tag: 'Planlegging' },
    { patterns: ['kontroll', 'testing'], tag: 'Kontroll' },
    { patterns: ['årsavslutning', 'årsslutt'], tag: 'Årsavslutning' },
  ];
  
  termMappings.forEach(({ patterns, tag }) => {
    if (patterns.some(pattern => contentLower.includes(pattern))) {
      foundTags.push(tag);
    }
  });
  
  // Return max 4 most relevant tags
  return foundTags.slice(0, 4);
}
