/**
 * Hook for validering og beregning av completionPercentage for responsfelter
 * Konsoliderer logikk som tidligere var duplisert i ExpandableActionCard og ActionDetailDrawer
 */

export interface ResponseField {
  id: string;
  required?: boolean;
  [key: string]: any;
}

/**
 * Validerer at alle obligatoriske responsfelter er fylt ut
 * @param fields - Array av responsfelter fra template
 * @param values - Record med verdier for hvert felt
 * @returns true hvis alle obligatoriske felter er fylt ut, false ellers
 */
export function validateResponseFields(
  fields: ResponseField[] | undefined,
  values: Record<string, any>
): { isValid: boolean; errors: Record<string, string> } {
  if (!fields || fields.length === 0) {
    return { isValid: true, errors: {} };
  }

  const errors: Record<string, string> = {};
  let hasErrors = false;

  fields.forEach((field) => {
    if (field.required) {
      const value = values[field.id];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        errors[field.id] = 'Dette feltet er obligatorisk';
        hasErrors = true;
      }
    }
  });

  return { isValid: !hasErrors, errors };
}

/**
 * Beregner fullføringsprosent basert på antall obligatoriske felter som er fylt ut
 * @param fields - Array av responsfelter fra template
 * @param values - Record med verdier for hvert felt
 * @returns Prosent (0-100) av obligatoriske felter som er fylt ut
 */
export function calculateCompletionPercentage(
  fields: ResponseField[] | undefined,
  values: Record<string, any>
): number {
  if (!fields || fields.length === 0) {
    return 0;
  }

  const requiredFields = fields.filter((f) => f.required);
  if (requiredFields.length === 0) return 100;

  const completedFields = requiredFields.filter((f) => {
    const value = values[f.id];
    return value && (!Array.isArray(value) || value.length > 0);
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
}
