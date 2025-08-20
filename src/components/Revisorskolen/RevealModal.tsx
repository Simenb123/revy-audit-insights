import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Eye } from 'lucide-react';

interface RevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  scoreImpact: number;
}

export const RevealModal = ({ isOpen, onClose, title, content, scoreImpact }: RevealModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <DialogTitle>Resultat av handling</DialogTitle>
          </div>
          <DialogDescription className="font-medium">
            {title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm leading-relaxed">{content}</p>
          </div>
          
          {scoreImpact !== 0 && (
            <div className="flex items-center justify-center">
              <Badge 
                variant={scoreImpact > 0 ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {scoreImpact > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {scoreImpact > 0 ? '+' : ''}{scoreImpact} poeng
              </Badge>
            </div>
          )}
          
          <Button onClick={onClose} className="w-full">
            Fortsett
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};