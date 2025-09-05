import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building, Hash } from 'lucide-react';

interface AccountDisplayProps {
  accountNumber: string;
  accountName?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
  className?: string;
}

const AccountDisplay: React.FC<AccountDisplayProps> = ({
  accountNumber,
  accountName,
  variant = 'default',
  showIcon = false,
  className = ''
}) => {
  const formatAccountNumber = (number: string) => {
    // Format account number for better readability (e.g., 1234 -> 1234)
    return number.replace(/\D/g, '');
  };

  const getAccountTypeColor = (accountNumber: string) => {
    const firstDigit = accountNumber.charAt(0);
    switch (firstDigit) {
      case '1': return 'bg-blue-100 text-blue-800 border-blue-200';
      case '2': return 'bg-green-100 text-green-800 border-green-200';
      case '3': return 'bg-purple-100 text-purple-800 border-purple-200';
      case '4': return 'bg-orange-100 text-orange-800 border-orange-200';
      case '5': return 'bg-red-100 text-red-800 border-red-200';
      case '6': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case '7': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case '8': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAccountTypeLabel = (accountNumber: string) => {
    const firstDigit = accountNumber.charAt(0);
    switch (firstDigit) {
      case '1': return 'Eiendeler';
      case '2': return 'Gjeld/Egenkapital';
      case '3': return 'Inntekter';
      case '4': return 'Kostnader';
      case '5': return 'Lønn/Personalkost';
      case '6': return 'Andre kostnader';
      case '7': return 'Finansinntekter';
      case '8': return 'Finanskostnader';
      default: return 'Ukjent';
    }
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`font-mono text-xs ${className}`}>
              {showIcon && <Hash className="h-3 w-3 mr-1" />}
              {formatAccountNumber(accountNumber)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{formatAccountNumber(accountNumber)}</p>
              {accountName && <p className="text-sm">{accountName}</p>}
              <p className="text-xs text-muted-foreground">
                {getAccountTypeLabel(accountNumber)}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`flex items-center gap-3 p-3 bg-muted/30 rounded-md ${className}`}>
        {showIcon && <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge 
              variant="outline" 
              className={`font-mono text-xs ${getAccountTypeColor(accountNumber)}`}
            >
              {formatAccountNumber(accountNumber)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {getAccountTypeLabel(accountNumber)}
            </Badge>
          </div>
          {accountName && (
            <p className="text-sm font-medium text-foreground truncate">
              {accountName}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <Hash className="h-4 w-4 text-muted-foreground" />}
      <Badge variant="outline" className="font-mono text-xs">
        {formatAccountNumber(accountNumber)}
      </Badge>
      {accountName && (
        <span className="text-sm text-foreground truncate">
          {accountName}
        </span>
      )}
    </div>
  );
};

interface AccountListDisplayProps {
  accounts: Array<{
    number: string;
    name?: string;
  }>;
  variant?: 'default' | 'compact' | 'detailed';
  maxDisplay?: number;
  className?: string;
}

export const AccountListDisplay: React.FC<AccountListDisplayProps> = ({
  accounts,
  variant = 'compact',
  maxDisplay = 3,
  className = ''
}) => {
  const displayAccounts = accounts.slice(0, maxDisplay);
  const remainingCount = accounts.length - maxDisplay;

  if (accounts.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Ingen kontoer identifisert
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayAccounts.map((account, index) => (
        <AccountDisplay
          key={`${account.number}-${index}`}
          accountNumber={account.number}
          accountName={account.name}
          variant={variant}
        />
      ))}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs cursor-help">
                +{remainingCount} til
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {accounts.slice(maxDisplay).map((account, index) => (
                  <div key={`${account.number}-${index}`} className="text-sm">
                    {account.number} {account.name && `- ${account.name}`}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default AccountDisplay;