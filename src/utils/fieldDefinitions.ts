import { supabase } from '@/integrations/supabase/client';

export interface FieldDefinition {
  id: string;
  field_key: string;
  field_label: string;
  data_type: 'text' | 'number' | 'date';
  is_required: boolean;
  file_type: string;
  aliases: string[];
  sort_order: number;
  is_active: boolean;
}

// Extended interface for enhanced column mapping
export interface EnhancedFieldDefinition extends FieldDefinition {
  confidence_patterns?: {
    exact_matches: string[];
    fuzzy_matches: string[];
    context_patterns: string[];
    content_validators: {
      number_format?: RegExp;
      date_format?: RegExp;
      text_patterns?: RegExp[];
    };
  };
}

// Helper function to expand year placeholders in aliases
function expandYearPlaceholders(alias: string, fiscalYear: number): string[] {
  const expandedAliases = [alias]; // Include original alias
  
  // Expand [YEAR] placeholder
  if (alias.includes('[YEAR]')) {
    expandedAliases.push(alias.replace(/\[YEAR\]/g, fiscalYear.toString()));
  }
  
  // Expand [YEAR-1] placeholder
  if (alias.includes('[YEAR-1]')) {
    expandedAliases.push(alias.replace(/\[YEAR-1\]/g, (fiscalYear - 1).toString()));
  }
  
  // Expand [YEAR+1] placeholder
  if (alias.includes('[YEAR+1]')) {
    expandedAliases.push(alias.replace(/\[YEAR\+1\]/g, (fiscalYear + 1).toString()));
  }
  
  return expandedAliases;
}

export async function getFieldDefinitions(fileType: string, fiscalYear?: number): Promise<FieldDefinition[]> {
  const { data, error } = await supabase
    .from('field_definitions')
    .select('*')
    .eq('file_type', fileType)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching field definitions:', error);
    return [];
  }

  return (data || []).map(item => {
    let field_label = item.field_label;
    let aliases = [...(item.aliases || [])];
    
    // Expand year placeholders if fiscal year is provided
    if (fiscalYear) {
      const expandedAliases: string[] = [];
      aliases.forEach(alias => {
        expandedAliases.push(...expandYearPlaceholders(alias, fiscalYear));
      });
      aliases = expandedAliases;
    }
    
    // Dynamic fiscal year labels for trial balance (clarify opening vs closing)
    if (fileType === 'trial_balance' && fiscalYear) {
      if (item.field_key === 'opening_balance') {
        field_label = `Saldo ${fiscalYear - 1} (Inngående ${fiscalYear})`;
        aliases = [
          ...aliases,
          `saldo ${fiscalYear - 1}`,
          `åpning ${fiscalYear - 1}`,
          `inngående ${fiscalYear - 1}`,
          `inngående saldo ${fiscalYear}`,
          `åpningssaldo ${fiscalYear}`,
          `åpningsbalanse ${fiscalYear}`,
          `ib ${fiscalYear}`,
          'ib'
        ];
      } else if (item.field_key === 'closing_balance') {
        field_label = `Saldo ${fiscalYear} (Utgående ${fiscalYear})`;
        aliases = [
          ...aliases,
          `saldo ${fiscalYear}`,
          `slutt ${fiscalYear}`,
          `utgående ${fiscalYear}`,
          `utgående saldo ${fiscalYear}`,
          `avslutningssaldo ${fiscalYear}`,
          `ub ${fiscalYear}`,
          'ub'
        ];
      }
    }
    
    return {
      ...item,
      field_label,
      aliases,
      data_type: item.data_type as 'text' | 'number' | 'date'
    };
  });
}

export async function saveColumnMappingHistory(
  clientId: string,
  fileType: string,
  sourceColumn: string,
  targetField: string,
  confidenceScore: number,
  isManualOverride: boolean,
  fileName?: string,
  fiscalYear?: number
) {
  const { error } = await supabase
    .from('column_mapping_history')
    .insert({
      client_id: clientId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      file_type: fileType,
      source_column: sourceColumn,
      target_field: targetField,
      confidence_score: confidenceScore,
      is_manual_override: isManualOverride,
      file_name: fileName,
      fiscal_year: fiscalYear,
    });

  if (error) {
    console.error('Error saving mapping history:', error);
  }
}

export async function getHistoricalMappings(
  clientId: string,
  fileType: string,
  fiscalYear?: number
): Promise<Record<string, string>> {
  let query = supabase
    .from('column_mapping_history')
    .select('source_column, target_field, confidence_score, file_name')
    .eq('client_id', clientId)
    .eq('file_type', fileType);
    
  // Add fiscal year filter if provided
  if (fiscalYear) {
    query = query.eq('fiscal_year', fiscalYear);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching historical mappings:', error);
    return {};
  }

  // Create a mapping from the most recent successful mappings with weighted scoring
  const mappings: Record<string, string> = {};
  const mappingScores: Record<string, number> = {};
  
  data?.forEach((mapping) => {
    if (!mappings[mapping.source_column] || 
        (mappingScores[mapping.source_column] || 0) < mapping.confidence_score) {
      mappings[mapping.source_column] = mapping.target_field;
      mappingScores[mapping.source_column] = mapping.confidence_score;
    }
  });

  return mappings;
}

// Enhanced mapping suggestion with improved algorithms
export async function suggestEnhancedColumnMappings(
  clientId: string,
  fileType: string,
  headers: string[],
  sampleData?: string[][],
  fileName?: string,
  fiscalYear?: number
): Promise<{ sourceColumn: string; targetField: string; confidence: number; reasoning: string }[]> {
  const [fieldDefinitions, historicalMappings] = await Promise.all([
    getFieldDefinitions(fileType, fiscalYear),
    getHistoricalMappings(clientId, fileType, fiscalYear)
  ]);

  const rawSuggestions = [];

  for (const header of headers) {
    let bestMatch: FieldDefinition | null = null;
    let bestConfidence = 0;
    let reasoning = '';

    // Check historical mappings first
    if (historicalMappings[header]) {
      const historicalField = fieldDefinitions.find(f => f.field_key === historicalMappings[header]);
      if (historicalField) {
        rawSuggestions.push({
          sourceColumn: header,
          targetField: historicalField.field_key,
          confidence: 0.95,
          reasoning: 'Basert på tidligere mappinger for denne klienten'
        });
        continue;
      }
    }

    // Enhanced matching algorithm
    for (const field of fieldDefinitions) {
      const { confidence, reasoning: matchReasoning } = calculateEnhancedFieldConfidence(
        header, 
        field, 
        sampleData, 
        headers
      );

      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = field;
        reasoning = matchReasoning;
      }
    }

    if (bestMatch && bestConfidence > 0.3) {
      rawSuggestions.push({
        sourceColumn: header,
        targetField: bestMatch.field_key,
        confidence: bestConfidence,
        reasoning
      });
    }
  }

  // Ensure unique field assignments: sort by confidence and keep only highest confidence match per field
  const sortedSuggestions = rawSuggestions.sort((a, b) => b.confidence - a.confidence);
  const usedFields = new Set<string>();
  const uniqueSuggestions = [];

  for (const suggestion of sortedSuggestions) {
    if (!usedFields.has(suggestion.targetField)) {
      usedFields.add(suggestion.targetField);
      uniqueSuggestions.push(suggestion);
    }
  }

  return uniqueSuggestions.sort((a, b) => b.confidence - a.confidence);
}

// Enhanced confidence calculation with detailed reasoning
function calculateEnhancedFieldConfidence(
  header: string,
  field: FieldDefinition,
  sampleData?: string[][],
  headers?: string[]
): { confidence: number; reasoning: string } {
  const normalizedHeader = normalizeNorwegianText(header);
  const reasons: string[] = [];
  let confidence = 0;

  // Exact alias match (highest confidence)
  const exactMatch = field.aliases.find(alias => 
    normalizeNorwegianText(alias) === normalizedHeader
  );
  if (exactMatch) {
    confidence = 0.95;
    reasons.push(`Eksakt match med alias "${exactMatch}"`);
  } else {
    // Enhanced year-aware matching
    let bestAliasMatch = 0;
    let bestAlias = '';
    
    for (const alias of field.aliases) {
      const normalizedAlias = normalizeNorwegianText(alias);
      
      // Check for year patterns in header and alias
      const headerYearMatch = header.match(/\b(19|20)\d{2}\b/);
      const aliasYearMatch = alias.match(/\b(19|20)\d{2}\b/);
      
      if (normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader)) {
        let similarity = Math.min(normalizedAlias.length, normalizedHeader.length) / 
                        Math.max(normalizedAlias.length, normalizedHeader.length);
        
        // Boost confidence for year matches
        if (headerYearMatch && aliasYearMatch && headerYearMatch[0] === aliasYearMatch[0]) {
          similarity = Math.min(similarity * 1.3, 0.98);
          reasons.push(`År-match funnet: ${headerYearMatch[0]}`);
        }
        
        if (similarity > bestAliasMatch) {
          bestAliasMatch = similarity;
          bestAlias = alias;
        }
      }
    }
    
    if (bestAliasMatch > 0.6) {
      confidence = bestAliasMatch * 0.8;
      reasons.push(`Delvis match med "${bestAlias}"`);
    }
  }

  // Norwegian pattern matching
  const norwegianBoost = applyNorwegianPatternsWithReasoning(header, field);
  if (norwegianBoost.boost > 0) {
    confidence = Math.max(confidence, norwegianBoost.boost);
    reasons.push(norwegianBoost.reason);
  }

  // Content validation including account_name specific validation
  if (sampleData && headers && confidence > 0.4) {
      const columnIndex = headers.indexOf(header);
      if (columnIndex !== -1) {
        const columnData = sampleData
          .map(row => row[columnIndex] || '')
          .map(val => typeof val === 'string' ? val : val != null ? String(val) : '')
          .filter(val => val.trim() !== '');
        const contentScore = validateContentTypeEnhanced(columnData, field.data_type);
      
      // Special validation for account_name to distinguish from account_number
      if (field.field_key === 'account_name') {
        const alphabeticValues = columnData.filter(val => {
          const strVal = typeof val === 'string' ? val : val != null ? String(val) : '';
          const cleaned = strVal.trim();
          if (!cleaned) return false;
          const alphaCount = (cleaned.match(/[a-zA-ZæøåÆØÅ]/g) || []).length;
          return alphaCount / cleaned.length > 0.3;
        }).length;
        const alphabeticRatio = alphabeticValues / Math.max(columnData.length, 1);
        
        if (alphabeticRatio > 0.7) {
          confidence = Math.min(confidence * 1.3, 0.99);
          reasons.push(`Inneholdet er hovedsakelig tekst (${Math.round(alphabeticRatio * 100)}% alfabetiske tegn)`);
        } else if (alphabeticRatio < 0.3) {
          confidence *= 0.5;
          reasons.push(`Innholdet er hovedsakelig tall, ikke tekst (${Math.round(alphabeticRatio * 100)}% alfabetiske tegn)`);
        }
      }
      
      if (contentScore.score > 0.8) {
        confidence = Math.min(confidence * 1.2, 0.99);
        reasons.push(`Innholdet matcher forventet datatype (${contentScore.reason})`);
      } else if (contentScore.score < 0.3) {
        confidence *= 0.6;
        reasons.push(`Innholdsmismatch: ${contentScore.reason}`);
      }
    }
  }

  return {
    confidence: Math.min(confidence, 0.99),
    reasoning: reasons.join('; ') || 'Ingen spesifikk match funnet'
  };
}

// Enhanced Norwegian pattern matching with reasoning
function applyNorwegianPatternsWithReasoning(
  header: string, 
  field: FieldDefinition
): { boost: number; reason: string } {
  const lowerHeader = header.toLowerCase();
  
  const patterns: Record<string, { keywords: string[]; description: string }> = {
    'account_number': { keywords: ['konto', 'kontonr', 'kontonummer'], description: 'Norsk kontonummer-mønster' },
    'account_name': { keywords: ['navn', 'beskrivelse', 'tekst'], description: 'Norsk kontonavn-mønster' },
    'opening_balance': { keywords: ['inngående', 'åpning', 'start', 'ib'], description: 'Norsk åpningsbalanse-mønster' },
    'closing_balance': { keywords: ['utgående', 'slutt', 'avslutning', 'ub'], description: 'Norsk sluttbalanse-mønster' },
    'debit_amount': { keywords: ['debet', 'skal', 'dr'], description: 'Norsk debet-mønster' },
    'credit_amount': { keywords: ['kredit', 'have', 'cr'], description: 'Norsk kredit-mønster' },
    'transaction_date': { keywords: ['dato', 'bilagsdato'], description: 'Norsk dato-mønster' },
    'voucher_number': { keywords: ['bilag', 'bilagsnr', 'dok'], description: 'Norsk bilagsnummer-mønster' }
  };

  const pattern = patterns[field.field_key];
  if (pattern) {
    for (const keyword of pattern.keywords) {
      if (lowerHeader.includes(keyword)) {
        return { boost: 0.8, reason: pattern.description };
      }
    }
  }

  return { boost: 0, reason: '' };
}

// Enhanced content validation with detailed reasoning
function validateContentTypeEnhanced(
  sampleData: string[], 
  expectedType: 'text' | 'number' | 'date'
): { score: number; reason: string } {
  // Ensure all values are strings and filter out empty values
  const validSamples = sampleData
    .map(val => typeof val === 'string' ? val : val != null ? String(val) : '')
    .filter(val => val.trim())
    .slice(0, 10);
  
  if (validSamples.length === 0) return { score: 0.5, reason: 'Ingen data å validere' };

  let validCount = 0;
  const issues: string[] = [];

  for (const value of validSamples) {
    const strVal = typeof value === 'string' ? value : value != null ? String(value) : '';
    const trimmedValue = strVal.trim();
    
    switch (expectedType) {
      case 'number':
        const normalizedNumber = trimmedValue.replace(/\s/g, '').replace(',', '.');
        if (!isNaN(Number(normalizedNumber)) && normalizedNumber !== '') {
          validCount++;
        } else {
          issues.push(`"${trimmedValue}" er ikke et tall`);
        }
        break;
      case 'date':
        const datePatterns = [
          /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/, // DD.MM.YYYY
          /^\d{4}[./-]\d{1,2}[./-]\d{1,2}$/, // YYYY.MM.DD
          /^\d{1,2}\.\s?\w+\s?\d{4}$/ // DD. Month YYYY
        ];
        
        if (datePatterns.some(pattern => pattern.test(trimmedValue)) || !isNaN(Date.parse(trimmedValue))) {
          validCount++;
        } else {
          issues.push(`"${trimmedValue}" er ikke en gyldig dato`);
        }
        break;
      case 'text':
        validCount++; // Text is always valid
        break;
    }
  }

  const score = validCount / validSamples.length;
  const reason = score > 0.8 
    ? `${Math.round(score * 100)}% av verdiene matcher forventet format`
    : `${Math.round(score * 100)}% match. Problemer: ${issues.slice(0, 2).join(', ')}`;

  return { score, reason };
}

// Normalize Norwegian text for better matching
function normalizeNorwegianText(text: string): string {
  return text.toLowerCase().trim()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}