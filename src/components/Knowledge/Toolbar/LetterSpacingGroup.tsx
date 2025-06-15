
import React from 'react';
import { Editor } from '@tiptap/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  editor: Editor;
};

const letterSpacings = ['-0.05em', '-0.02em', '0em', '0.02em', '0.05em', '0.1em'];

const LetterSpacingGroup = ({ editor }: Props) => {
  const handleLetterSpacingChange = (spacing: string) => {
    const { letterSpacing, ...otherAttributes } = editor.getAttributes('textStyle');

    if (spacing === 'default') {
      editor.chain().focus().setMark('textStyle', otherAttributes).removeEmptyTextStyle().run();
    } else {
      editor.chain().focus().setMark('textStyle', { ...otherAttributes, letterSpacing: spacing }).run();
    }
  };

  const currentLetterSpacing = editor.getAttributes('textStyle').letterSpacing || 'default';

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Select value={currentLetterSpacing} onValueChange={handleLetterSpacingChange}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Bokstavavstand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              {letterSpacings.map(spacing => (
                <SelectItem key={spacing} value={spacing}>{spacing}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TooltipTrigger>
        <TooltipContent>
          <p>Bokstavavstand</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LetterSpacingGroup;
