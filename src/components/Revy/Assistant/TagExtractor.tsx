
import React from 'react';

interface TagExtractionResult {
  tags: string[];
  hasValidFormat: boolean;
  extractedFrom: string;
  contentTypes: string[]; // NEW: Array of content types found
}

export const extractTagsFromContent = (content: string): TagExtractionResult => {
  console.log('🔍 Starting enhanced tag extraction with content type detection...');
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
          const contentTypes = detectContentTypes(content);
          return {
            tags,
            hasValidFormat: true,
            extractedFrom: line,
            contentTypes
          };
        }
      }
    }
  }
  
  console.log('❌ No valid tags found with standard patterns, trying intelligent fallback extraction...');
  
  // Intelligent fallback: extract key terms from the actual content
  const fallbackTags = extractIntelligentFallbackTags(content);
  const contentTypes = detectContentTypes(content);
  
  if (fallbackTags.length > 0) {
    console.log('🔄 Using intelligent fallback tags:', fallbackTags);
    return {
      tags: fallbackTags,
      hasValidFormat: false,
      extractedFrom: 'Intelligent content analysis',
      contentTypes
    };
  }
  
  console.log('❌ No tags found at all');
  return {
    tags: [],
    hasValidFormat: false,
    extractedFrom: '',
    contentTypes
  };
};

function detectContentTypes(content: string): string[] {
  const contentLower = content.toLowerCase();
  const detectedTypes: string[] = [];
  
  // Detect different content types based on content analysis
  if (contentLower.includes('isa ') || contentLower.includes('revisjonsstandard')) {
    detectedTypes.push('isa-standard');
  }
  
  if (contentLower.includes('nrs ') || contentLower.includes('nrs-')) {
    detectedTypes.push('nrs-standard');
  }
  
  if (contentLower.includes('lov') || contentLower.includes('loven') || 
      contentLower.includes('lovbestemmelse')) {
    detectedTypes.push('lov');
  }
  
  if (contentLower.includes('forskrift') || contentLower.includes('reglement')) {
    detectedTypes.push('forskrift');
  }
  
  if (contentLower.includes('forarbeider') || contentLower.includes('proposisjon') || 
      contentLower.includes('innstilling')) {
    detectedTypes.push('forarbeider');
  }
  
  // Default to fagartikkel if no specific type detected
  if (detectedTypes.length === 0) {
    detectedTypes.push('fagartikkel');
  }
  
  console.log('🏷️ Detected content types:', detectedTypes);
  return detectedTypes;
}

function extractIntelligentFallbackTags(content: string): string[] {
  const contentLower = content.toLowerCase();
  const foundTags: string[] = [];
  
  // Enhanced term mappings with content type awareness
  const termMappings = [
    { patterns: ['skattemelding', 'skatterapport'], tag: 'Skattemelding', type: 'fagartikkel' },
    { patterns: ['mva', 'merverdiavgift'], tag: 'MVA', type: 'fagartikkel' },
    { patterns: ['regnskap', 'bokføring'], tag: 'Regnskap', type: 'fagartikkel' },
    { patterns: ['revisjon', 'revisjonsarbeid'], tag: 'Revisjon', type: 'fagartikkel' },
    { patterns: ['inntekt', 'omsetning'], tag: 'Inntekter', type: 'fagartikkel' },
    { patterns: ['isa 315', 'isa315'], tag: 'ISA 315', type: 'isa-standard' },
    { patterns: ['isa 230', 'isa230'], tag: 'ISA 230', type: 'isa-standard' },
    { patterns: ['isa 240', 'isa240'], tag: 'ISA 240', type: 'isa-standard' },
    { patterns: ['nrs 17', 'nrs17'], tag: 'NRS 17', type: 'nrs-standard' },
    { patterns: ['materialitet', 'vesentlighet'], tag: 'Materialitet', type: 'fagartikkel' },
    { patterns: ['risikovurdering', 'risiko'], tag: 'Risikovurdering', type: 'fagartikkel' },
    { patterns: ['dokumentasjon', 'dokumentere'], tag: 'Dokumentasjon', type: 'fagartikkel' },
    { patterns: ['planlegging', 'plan'], tag: 'Planlegging', type: 'fagartikkel' },
    { patterns: ['kontroll', 'testing'], tag: 'Kontroll', type: 'fagartikkel' },
    { patterns: ['årsavslutning', 'årsslutt'], tag: 'Årsavslutning', type: 'fagartikkel' },
    { patterns: ['hvitvasking', 'hvitvaskingsloven'], tag: 'Hvitvasking', type: 'lov' },
  ];
  
  termMappings.forEach(({ patterns, tag, type }) => {
    if (patterns.some(pattern => contentLower.includes(pattern))) {
      foundTags.push(tag);
    }
  });
  
  // Return max 4 most relevant tags
  return foundTags.slice(0, 4);
}
