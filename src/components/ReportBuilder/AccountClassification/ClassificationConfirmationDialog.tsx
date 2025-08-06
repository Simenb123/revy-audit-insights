import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface GroupedAccount {
  account_number: string;
  account_name: string;
  closing_balance: number;
  current_category: string;
}

interface ClassificationConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: {
    applySimilar: boolean;
    saveAsRule: boolean;
  }) => void;
  account: GroupedAccount | null;
  fromCategory: string;
  toCategory: string;
  similarAccounts?: GroupedAccount[];
}

export function ClassificationConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  account,
  fromCategory,
  toCategory,
  similarAccounts = [],
}: ClassificationConfirmationDialogProps) {
  const [applySimilar, setApplySimilar] = useState(false);
  const [saveAsRule, setSaveAsRule] = useState(false);

  const handleConfirm = () => {
    onConfirm({
      applySimilar,
      saveAsRule,
    });
    
    // Reset state
    setApplySimilar(false);
    setSaveAsRule(false);
    onClose();
  };

  const handleCancel = () => {
    setApplySimilar(false);
    setSaveAsRule(false);
    onClose();
  };

  if (!account) return null;

  const accountPrefix = account.account_number.substring(0, 2);
  const relatedAccounts = similarAccounts.filter(acc => 
    acc.account_number.startsWith(accountPrefix) && 
    acc.account_number !== account.account_number
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bekreft kontoklassifisering</DialogTitle>
          <DialogDescription>
            Vil du klassifisere denne kontoen til den nye kategorien?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account details */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <div className="font-medium">{account.account_number}</div>
              <div className="text-sm text-muted-foreground">{account.account_name}</div>
              <div className="text-sm font-medium">
                {account.closing_balance.toLocaleString('nb-NO')} kr
              </div>
            </div>
          </div>

          {/* Category change visualization */}
          <div className="flex items-center justify-center space-x-2 py-2">
            <Badge variant="outline">{fromCategory}</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="default">{toCategory}</Badge>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {relatedAccounts.length > 0 && (
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="apply-similar"
                  checked={applySimilar}
                  onCheckedChange={(checked) => setApplySimilar(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="apply-similar"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Anvend for lignende kontoer ({relatedAccounts.length})
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Kontoer som starter med {accountPrefix}xx
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="save-rule"
                checked={saveAsRule}
                onCheckedChange={(checked) => setSaveAsRule(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="save-rule"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Lagre som klassifiseringsregel
                </label>
                <p className="text-xs text-muted-foreground">
                  Nye kontoer av samme type vil automatisk klassifiseres
                </p>
              </div>
            </div>
          </div>

          {/* Show affected accounts if applySimilar is checked */}
          {applySimilar && relatedAccounts.length > 0 && (
            <div className="border rounded-lg p-3 space-y-2">
              <div className="text-sm font-medium">Berørte kontoer:</div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {relatedAccounts.slice(0, 5).map((acc) => (
                  <div key={acc.account_number} className="text-xs text-muted-foreground">
                    {acc.account_number} - {acc.account_name}
                  </div>
                ))}
                {relatedAccounts.length > 5 && (
                  <div className="text-xs text-muted-foreground font-medium">
                    +{relatedAccounts.length - 5} flere...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Avbryt
          </Button>
          <Button onClick={handleConfirm}>
            Bekreft klassifisering
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}