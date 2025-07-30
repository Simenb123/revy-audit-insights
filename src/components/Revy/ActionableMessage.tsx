
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowRight, FileText, Users, TrendingUp, AlertCircle, Book } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ActionableLink {
  type: 'navigation' | 'action' | 'external' | 'knowledge';
  text: string;
  path?: string;
  url?: string;
  action?: () => void;
  iconName?: string;
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
    } else if (link.type === 'knowledge' && link.path) {
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

  const getIconByName = (iconName?: string) => {
    if (!iconName) return null;
    switch (iconName) {
      case 'Book': return <Book className="h-3 w-3" />;
      case 'FileText': return <FileText className="h-3 w-3" />;
      case 'Users': return <Users className="h-3 w-3" />;
      case 'TrendingUp': return <TrendingUp className="h-3 w-3" />;
      case 'AlertCircle': return <AlertCircle className="h-3 w-3" />;
      case 'ExternalLink': return <ExternalLink className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-li:text-foreground">
        <ReactMarkdown 
          components={{
            // Custom link component to handle internal links
            a: ({ href, children, ...props }) => {
              if (href?.startsWith('/')) {
                return (
                  <button
                    onClick={() => navigate(href)}
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {children}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                );
              }
              return (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                  {...props}
                >
                  {children}
                  <ExternalLink className="h-3 w-3" />
                </a>
              );
            },
            // Style headings
            h1: ({ children, ...props }) => (
              <h1 className="text-lg font-semibold mb-1" {...props}>{children}</h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 className="text-base font-semibold mb-1" {...props}>{children}</h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 className="text-sm font-semibold mb-0.5" {...props}>{children}</h3>
            ),
            // Style lists with reduced margins
            ul: ({ children, ...props }) => (
              <ul className="list-disc pl-4 space-y-0.5 my-1" {...props}>{children}</ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal pl-4 space-y-0.5 my-1" {...props}>{children}</ol>
            ),
            // Style paragraphs with reduced margins
            p: ({ children, ...props }) => (
              <p className="mb-1 last:mb-0" {...props}>{children}</p>
            ),
            // Style strong text
            strong: ({ children, ...props }) => (
              <strong className="font-semibold text-foreground" {...props}>{children}</strong>
            ),
            // Style code
            code: ({ children, ...props }) => (
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {links.map((link, index) => (
            <Button
              key={index}
              variant={link.variant || "outline"}
              size="sm"
              onClick={() => handleLinkClick(link)}
              className="text-xs h-7 hover-scale"
            >
              {getIconByName(link.iconName) && <span className="mr-1">{getIconByName(link.iconName)}</span>}
              {link.text}
              {link.type === 'navigation' && <ArrowRight className="h-3 w-3 ml-1" />}
              {link.type === 'external' && <ExternalLink className="h-3 w-3 ml-1" />}
              {link.type === 'knowledge' && <ArrowRight className="h-3 w-3 ml-1" />}
            </Button>
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <div className="border-t pt-3 mt-3 animate-fade-in">
          <p className="text-xs text-muted-foreground mb-2 font-medium">📚 Kilder og referanser:</p>
          <div className="flex flex-wrap gap-1">
            {sources.map((source, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs flex items-center gap-1 hover-scale cursor-pointer"
                onClick={() => {
                  if (source.url) {
                    navigate(source.url);
                  }
                }}
              >
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
