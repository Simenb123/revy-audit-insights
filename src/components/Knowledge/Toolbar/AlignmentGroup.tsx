
import React from 'react';
import { Editor } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';

type Props = {
  editor: Editor;
};

const AlignmentGroup = ({ editor }: Props) => {
  return (
    <>
       <ToolbarButton
        tooltip="Venstrejuster"
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Midtstill"
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Høyrejuster"
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};

export default AlignmentGroup;
