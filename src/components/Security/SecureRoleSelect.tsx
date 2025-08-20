import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/types/organization';
import { rateLimiter } from '@/utils/sanitize';

interface SecureRoleSelectProps {
  currentRole: UserRole;
  userId: string;
  userName: string;
  onRoleChange: (userId: string, role: UserRole) => void;
  isLoading?: boolean;
}

const SecureRoleSelect: React.FC<SecureRoleSelectProps> = ({
  currentRole,
  userId,
  userName,
  onRoleChange,
  isLoading = false
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    
    // Rate limit role change attempts
    const rateLimitKey = `role_change_${userId}`;
    if (!rateLimiter.isAllowed(rateLimitKey, 5, 60000)) { // 5 attempts per minute
      toast({
        title: "For mange forsøk",
        description: "Du har gjort for mange rolleendringer. Prøv igjen om litt.",
        variant: "destructive"
      });
      return;
    }
    
    // Show confirmation for sensitive role changes
    if (role === 'admin' || currentRole === 'admin') {
      setShowConfirmDialog(true);
    } else {
      confirmRoleChange();
    }
  };

  const confirmRoleChange = () => {
    onRoleChange(userId, selectedRole);
    setShowConfirmDialog(false);
  };

  const getRoleChangeWarning = () => {
    if (selectedRole === 'admin') {
      return "Du er i ferd med å gi denne brukeren administratorrettigheter. Dette gir full tilgang til systemet.";
    }
    if (currentRole === 'admin') {
      return "Du er i ferd med å fjerne administratorrettigheter fra denne brukeren.";
    }
    return `Du er i ferd med å endre rollen til ${userName} fra ${currentRole} til ${selectedRole}.`;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={currentRole}
          onValueChange={handleRoleSelect}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-red-500" />
                Admin
              </div>
            </SelectItem>
            <SelectItem value="partner">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-orange-500" />
                Partner
              </div>
            </SelectItem>
            <SelectItem value="manager">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-blue-500" />
                Manager
              </div>
            </SelectItem>
            <SelectItem value="employee">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-green-500" />
                Employee
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {isLoading && <span className="text-sm text-muted-foreground">Oppdaterer...</span>}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Bekreft rolleendring
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getRoleChangeWarning()}
              <br /><br />
              Er du sikker på at du vil fortsette?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedRole(currentRole)}>
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Bekreft endring
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SecureRoleSelect;