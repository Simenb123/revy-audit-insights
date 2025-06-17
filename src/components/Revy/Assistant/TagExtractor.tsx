
import React from 'react';

interface TagExtractionResult {
  tags: string[];
  hasValidFormat: boolean;
  extractedFrom: string;
}

export const extractTagsFromContent = (content: string): TagExtractionResult => {
  console.log('🔍 Starting tag extraction from content...');
  console.log('📝 Content preview:', content.substring(0, 200) + '...');
  
  const lines = content.split('\n');
  
  // Enhanced patterns to catch AI responses
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
        
        // Clean and extract tags more aggressively
        const cleanedPart = tagsPart
          .replace(/\*\*/g, '') // Remove bold markers
          .replace(/🏷️/g, '') // Remove emoji
          .replace(/[.!?]+$/, '') // Remove trailing punctuation
          .replace(/<!--.*?-->/g, '') // Remove HTML comments
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        console.log('🧹 Cleaned tags part:', cleanedPart);
        
        // Split on common separators and clean each tag
        const tags = cleanedPart
          .split(/[,;]/)
          .map(tag => tag.trim())
          .filter(tag => 
            tag.length > 0 && 
            tag.length < 50 && 
            !tag.includes('ARTICLE_MAPPINGS') &&
            !tag.includes('<!--') &&
            !/^\d+$/.test(tag) // Remove pure numbers
          );
        
        if (tags.length > 0) {
          console.log('🎯 Successfully extracted tags:', tags);
          return {
            tags,
            hasValidFormat: true,
            extractedFrom: line
          };
        }
      }
    }
  }
  
  console.log('❌ No valid tags found with standard patterns, trying fallback extraction...');
  
  // Fallback: look for any line containing common Norwegian revision terms
  const fallbackTerms = [
    'revisjon', 'inntekter', 'isa', 'materialitet', 'risikovurdering', 
    'dokumentasjon', 'planlegging', 'testing', 'kontroll', 'fagstoff'
  ];
  
  const fallbackTags: string[] = [];
  const contentLower = content.toLowerCase();
  
  fallbackTerms.forEach(term => {
    if (contentLower.includes(term)) {
      fallbackTags.push(term.charAt(0).toUpperCase() + term.slice(1));
    }
  });
  
  if (fallbackTags.length > 0) {
    console.log('🔄 Using fallback tags:', fallbackTags);
    return {
      tags: fallbackTags.slice(0, 4), // Limit to 4 fallback tags
      hasValidFormat: false,
      extractedFrom: 'Fallback extraction from content analysis'
    };
  }
  
  console.log('❌ No tags found at all');
  return {
    tags: [],
    hasValidFormat: false,
    extractedFrom: ''
  };
};
