
import React from 'react';
import { Editor } from '@tiptap/react';
import { List, ListOrdered, Quote } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';

type Props = {
  editor: Editor;
};

const ListGroup = ({ editor }: Props) => {
  return (
    <>
       <ToolbarButton
        tooltip="Bullet List"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
       <ToolbarButton
        tooltip="Ordered List"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
       <ToolbarButton
        tooltip="Blockquote"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};

export default ListGroup;
