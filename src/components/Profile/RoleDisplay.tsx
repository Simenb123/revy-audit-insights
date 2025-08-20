import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown } from 'lucide-react';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import type { UserRole } from '@/types/organization';

interface RoleDisplayProps {
  userRole: UserRole;
  userId?: string;
  showBadges?: boolean;
  className?: string;
}

const RoleDisplay: React.FC<RoleDisplayProps> = ({ 
  userRole, 
  userId, 
  showBadges = true,
  className = "" 
}) => {
  const { data: isSuperAdmin, isLoading } = useIsSuperAdmin();

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'partner': return 'Partner';
      case 'manager': return 'Manager';
      case 'employee': return 'Ansatt';
      default: return role;
    }
  };

  const getRoleVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'partner': return 'default';
      case 'manager': return 'secondary';
      case 'employee': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div className={`animate-pulse bg-muted h-6 w-20 rounded ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showBadges ? (
        <>
          <Badge variant={getRoleVariant(userRole)} className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {getRoleDisplayName(userRole)}
          </Badge>
          {isSuperAdmin && (
            <Badge variant="default" className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
              <Crown className="h-3 w-3" />
              Superadmin
            </Badge>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-medium">{getRoleDisplayName(userRole)}</span>
          {isSuperAdmin && (
            <span className="text-xs text-yellow-600 font-semibold flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Superadmin
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleDisplay;