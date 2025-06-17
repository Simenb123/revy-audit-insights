
import React from 'react';

interface TagExtractionResult {
  tags: string[];
  hasValidFormat: boolean;
  extractedFrom: string;
}

export const extractTagsFromContent = (content: string): TagExtractionResult => {
  console.log('🔍 Starting comprehensive tag extraction...');
  console.log('📝 Content to analyze:', content.substring(0, 200) + '...');
  
  const lines = content.split('\n');
  
  // Multiple patterns to catch various AI formats
  const tagPatterns = [
    // Standard format: 🏷️ **EMNER:** tag1, tag2, tag3
    /🏷️\s*\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*\s*(.+)/,
    // Without emoji: **EMNER:** tag1, tag2, tag3
    /\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*\s*(.+)/,
    // Simple format: EMNER: tag1, tag2, tag3
    /[Ee][Mm][Nn][Ee][Rr]:\s*(.+)/,
    // With bullet: • EMNER: tag1, tag2, tag3
    /[•·]\s*[Ee][Mm][Nn][Ee][Rr]:?\s*(.+)/,
    // Markdown style: ## EMNER
    /#{1,3}\s*[Ee][Mm][Nn][Ee][Rr]:?\s*(.+)/,
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    console.log(`🔍 Checking line ${i}: "${line}"`);
    
    for (const pattern of tagPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        console.log('✅ Found tags with pattern:', pattern);
        const tagsPart = match[1].trim();
        console.log('📝 Raw tags part:', tagsPart);
        
        // Clean and extract tags
        const cleanedPart = tagsPart
          .replace(/\*\*/g, '') // Remove bold markers
          .replace(/🏷️/g, '') // Remove emoji
          .replace(/[.!?]+$/, '') // Remove trailing punctuation
          .replace(/<!--.*?-->/g, '') // Remove HTML comments
          .trim();
        
        console.log('🧹 Cleaned tags part:', cleanedPart);
        
        // Split on common separators and clean each tag
        const tags = cleanedPart
          .split(/[,;]/)
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0 && tag.length < 50 && !tag.includes('ARTICLE_MAPPINGS'));
        
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
  
  console.log('❌ No valid tags found in content');
  return {
    tags: [],
    hasValidFormat: false,
    extractedFrom: ''
  };
};
