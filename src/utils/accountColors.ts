import { StandardAccount } from '@/hooks/useChartOfAccounts';

// Color schemes for different account types
export const getAccountTypeColor = (accountType: string) => {
  switch (accountType) {
    case 'asset':
      return {
        bg: 'bg-blue-50 hover:bg-blue-100',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        text: 'text-blue-700'
      };
    case 'liability':
      return {
        bg: 'bg-red-50 hover:bg-red-100',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-800 border-red-200',
        text: 'text-red-700'
      };
    case 'equity':
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        text: 'text-emerald-700'
      };
    case 'revenue':
      return {
        bg: 'bg-teal-50 hover:bg-teal-100',
        border: 'border-teal-200',
        badge: 'bg-teal-100 text-teal-800 border-teal-200',
        text: 'text-teal-700'
      };
    case 'expense':
      return {
        bg: 'bg-amber-50 hover:bg-amber-100',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        text: 'text-amber-700'
      };
    default:
      return {
        bg: 'bg-gray-50 hover:bg-gray-100',
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-800 border-gray-200',
        text: 'text-gray-700'
      };
  }
};

// Row styling based on line type
export const getLineTypeStyle = (account: StandardAccount) => {
  const baseColors = getAccountTypeColor(account.account_type);
  
  switch (account.line_type) {
    case 'subtotal':
      return {
        row: `${baseColors.bg} ${baseColors.border} border-l-4 border-l-2`,
        badge: 'bg-purple-100 text-purple-800 border-purple-200'
      };
    case 'calculation':
      return {
        row: `${baseColors.bg} ${baseColors.border} border-l-4 font-medium shadow-sm`,
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      };
    default: // detail
      return {
        row: `${baseColors.bg}`,
        badge: 'bg-gray-100 text-gray-700 border-gray-200'
      };
  }
};

// Category color mapping
export const getCategoryColor = (category: string) => {
  const categoryColors: Record<string, string> = {
    'Omløpsmidler': 'bg-blue-100 text-blue-800 border-blue-200',
    'Anleggsmidler': 'bg-slate-100 text-slate-800 border-slate-200',
    'Kortsiktig gjeld': 'bg-red-100 text-red-800 border-red-200',
    'Langsiktig gjeld': 'bg-rose-100 text-rose-800 border-rose-200',
    'Egenkapital': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Driftsinntekter': 'bg-teal-100 text-teal-800 border-teal-200',
    'Driftskostnader': 'bg-amber-100 text-amber-800 border-amber-200',
    'Finansinntekter': 'bg-green-100 text-green-800 border-green-200',
    'Finanskostnader': 'bg-orange-100 text-orange-800 border-orange-200',
    'Resultat': 'bg-revio-100 text-revio-800 border-revio-200',
    'Skattekostnad': 'bg-violet-100 text-violet-800 border-violet-200'
  };
  
  return categoryColors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
};

// Badge variant for line types
export const getLineTypeBadgeVariant = (lineType: string) => {
  switch (lineType) {
    case 'subtotal':
      return 'secondary';
    case 'calculation':
      return 'default';
    default:
      return 'outline';
  }
};