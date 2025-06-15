
import React from 'react';
import { Editor } from '@tiptap/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDown, ArrowUp } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';

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

  const currentSizeForButtons = currentFontSize === 'default' ? '16' : currentFontSize;
  const currentIndex = fontSizes.indexOf(currentSizeForButtons);

  const canIncrease = currentIndex < fontSizes.length - 1;
  const canDecrease = currentIndex > 0;

  const handleIncreaseFontSize = () => {
    if (canIncrease) {
      const nextSize = fontSizes[currentIndex + 1];
      editor.chain().focus().setFontSize(`${nextSize}px`).run();
    }
  };

  const handleDecreaseFontSize = () => {
    if (canDecrease) {
      const prevSize = fontSizes[currentIndex - 1];
      editor.chain().focus().setFontSize(`${prevSize}px`).run();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <ToolbarButton
        tooltip="Reduser skriftstørrelse"
        onClick={handleDecreaseFontSize}
        disabled={!canDecrease}
        size="sm"
      >
        <ArrowDown className="h-4 w-4" />
      </ToolbarButton>
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
      <ToolbarButton
        tooltip="Øk skriftstørrelse"
        onClick={handleIncreaseFontSize}
        disabled={!canIncrease}
        size="sm"
      >
        <ArrowUp className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
};

export default FontSizeGroup;
