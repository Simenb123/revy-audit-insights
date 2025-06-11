
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowRight, FileText, Users, TrendingUp, AlertCircle } from 'lucide-react';

interface ActionableLink {
  type: 'navigation' | 'action' | 'external' | 'knowledge';
  text: string;
  path?: string;
  url?: string;
  action?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
}

interface ActionableMessageProps {
  content: string;
  links?: ActionableLink[];
  sources?: Array<{
    title: string;
    type: 'isa' | 'regulation' | 'knowledge' | 'client';
    reference?: string;
    url?: string;
  }>;
}

const ActionableMessage = ({ content, links = [], sources = [] }: ActionableMessageProps) => {
  const navigate = useNavigate();

  const handleLinkClick = (link: ActionableLink) => {
    if (link.type === 'navigation' && link.path) {
      navigate(link.path);
    } else if (link.type === 'external' && link.url) {
      window.open(link.url, '_blank');
    } else if (link.action) {
      link.action();
    }
  };

  const getIconForSourceType = (type: string) => {
    switch (type) {
      case 'isa': return <FileText className="h-3 w-3" />;
      case 'regulation': return <AlertCircle className="h-3 w-3" />;
      case 'knowledge': return <FileText className="h-3 w-3" />;
      case 'client': return <Users className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="whitespace-pre-wrap">{content}</div>
      
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((link, index) => (
            <Button
              key={index}
              variant={link.variant || "outline"}
              size="sm"
              onClick={() => handleLinkClick(link)}
              className="text-xs h-7"
            >
              {link.icon && <span className="mr-1">{link.icon}</span>}
              {link.text}
              {link.type === 'navigation' && <ArrowRight className="h-3 w-3 ml-1" />}
              {link.type === 'external' && <ExternalLink className="h-3 w-3 ml-1" />}
            </Button>
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <div className="border-t pt-2 mt-2">
          <p className="text-xs text-muted-foreground mb-2">Kilder og referanser:</p>
          <div className="flex flex-wrap gap-1">
            {sources.map((source, index) => (
              <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                {getIconForSourceType(source.type)}
                {source.reference ? `${source.title} (${source.reference})` : source.title}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionableMessage;
