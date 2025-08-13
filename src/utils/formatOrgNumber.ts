export function formatOrgNumber(orgNumber?: string | null): string {
  if (!orgNumber) return '';
  const digits = orgNumber.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
}

export default formatOrgNumber;
