
import React from 'react';
import { Editor } from '@tiptap/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  editor: Editor;
};

const lineHeights = ['1', '1.2', '1.5', '1.75', '2', '2.5', '3'];

const LineHeightGroup = ({ editor }: Props) => {
  const handleLineHeightChange = (height: string) => {
    if (height === 'unset') {
      editor.chain().focus().unsetLineHeight().run();
    } else {
      editor.chain().focus().setLineHeight(height).run();
    }
  };

  const activeNode = editor.state.selection.$head.parent;
  const currentLineHeight = activeNode.attrs.lineHeight || 'unset';

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Select value={currentLineHeight} onValueChange={handleLineHeightChange}>
            <SelectTrigger className="w-28 h-9">
              <SelectValue placeholder="Linjehøyde" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">Standard</SelectItem>
              {lineHeights.map(height => (
                <SelectItem key={height} value={height}>{height}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TooltipTrigger>
        <TooltipContent>
          <p>Linjehøyde</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LineHeightGroup;
