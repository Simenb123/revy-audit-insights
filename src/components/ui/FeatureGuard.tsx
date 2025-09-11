import React from 'react';
import { BetaBadge } from './BetaBadge';
import { isFeatureInBeta } from '@/lib/featureFlags';
import type { FeatureFlag } from '@/lib/featureFlags';

interface FeatureGuardProps {
  feature: FeatureFlag;
  children: React.ReactNode;
  showBetaBadge?: boolean;
  badgePosition?: 'inline' | 'tooltip';
}

/**
 * Wraps content with optional beta badge when feature is in beta phase
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({ 
  feature, 
  children, 
  showBetaBadge = true,
  badgePosition = 'inline' 
}) => {
  const isBeta = isFeatureInBeta(feature);

  if (!showBetaBadge || !isBeta) {
    return <>{children}</>;
  }

  if (badgePosition === 'inline') {
    return (
      <div className="flex items-center gap-2">
        {children}
        <BetaBadge />
      </div>
    );
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute -top-1 -right-1">
        <BetaBadge variant="outline" className="text-xs px-1 py-0.5" />
      </div>
    </div>
  );
};