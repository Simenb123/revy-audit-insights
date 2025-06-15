
import React from 'react';
import { Editor } from '@tiptap/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  editor: Editor;
};

const fontSizes = ['12', '14', '16', '18', '20', '24', '30', '36', '48'];

const FontSizeGroup = ({ editor }: Props) => {
  const handleFontSizeChange = (size: string) => {
    if (size === 'default') {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(`${size}px`).run();
    }
  };
  
  const currentFontSize = editor.getAttributes('textStyle').fontSize?.replace('px', '') || 'default';

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Select value={currentFontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="w-24 h-9">
              <SelectValue placeholder="Størrelse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              {fontSizes.map(size => (
                <SelectItem key={size} value={size}>{size}px</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TooltipTrigger>
        <TooltipContent>
          <p>Skriftstørrelse</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FontSizeGroup;
