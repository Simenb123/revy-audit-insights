
import React from 'react';
import { Editor } from '@tiptap/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  editor: Editor;
};

const fontFamilies = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
];

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
    <Tooltip>
      <TooltipTrigger asChild>
        <Select value={currentFontFamily} onValueChange={handleFontFamilyChange}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Skrifttype" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">Standard</SelectItem>
            {fontFamilies.map(font => (
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
  );
};

export default FontFamilyGroup;
