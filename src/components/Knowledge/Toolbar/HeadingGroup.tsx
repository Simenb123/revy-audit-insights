
import React from 'react';
import { Editor } from '@tiptap/react';
import { Heading2, Heading3 } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';

type Props = {
  editor: Editor;
};

const HeadingGroup = ({ editor }: Props) => {
  return (
    <>
      <ToolbarButton
        tooltip="Heading 2"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Heading 3"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};

export default HeadingGroup;
