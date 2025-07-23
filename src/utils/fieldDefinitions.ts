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

export async function getFieldDefinitions(fileType: string): Promise<FieldDefinition[]> {
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

  return (data || []).map(item => ({
    ...item,
    data_type: item.data_type as 'text' | 'number' | 'date'
  }));
}

export async function saveColumnMappingHistory(
  clientId: string,
  fileType: string,
  sourceColumn: string,
  targetField: string,
  confidenceScore: number,
  isManualOverride: boolean,
  fileName?: string
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
    });

  if (error) {
    console.error('Error saving mapping history:', error);
  }
}

export async function getHistoricalMappings(
  clientId: string,
  fileType: string
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('column_mapping_history')
    .select('source_column, target_field')
    .eq('client_id', clientId)
    .eq('file_type', fileType)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching historical mappings:', error);
    return {};
  }

  // Create a mapping from the most recent successful mappings
  const mappings: Record<string, string> = {};
  data?.forEach((mapping) => {
    if (!mappings[mapping.source_column]) {
      mappings[mapping.source_column] = mapping.target_field;
    }
  });

  return mappings;
}