import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface CommentInputProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
  isSubmitting?: boolean;
  autoFocus?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({ 
  onSubmit, 
  placeholder = "Skriv en kommentar...",
  isSubmitting = false,
  autoFocus = false
}) => {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
        disabled={isSubmitting}
        autoFocus={autoFocus}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Ctrl+Enter for å sende
        </span>
        <Button 
          onClick={handleSubmit} 
          disabled={!content.trim() || isSubmitting}
          size="sm"
          className="gap-2"
        >
          <Send size={14} />
          Send
        </Button>
      </div>
    </div>
  );
};

export default CommentInput;
