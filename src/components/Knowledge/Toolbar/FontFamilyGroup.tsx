
import React from 'react';
import { Editor } from '@tiptap/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FONT_FAMILIES } from '@/styles/constants';

type Props = {
  editor: Editor;
};


const FontFamilyGroup = ({ editor }: Props) => {
  const handleFontFamilyChange = (family: string) => {
    if (family === 'unset') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(family).run();
    }
  };

  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || 'unset';

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Select value={currentFontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Skrifttype" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">Standard</SelectItem>
              {FONT_FAMILIES.map(font => (
                <SelectItem key={font.name} value={font.value} style={{ fontFamily: font.value }}>
                  {font.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TooltipTrigger>
        <TooltipContent>
          <p>Skrifttype</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FontFamilyGroup;
