
import React from 'react';
import { Editor } from '@tiptap/react';
import { Undo, Redo } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';

type Props = {
  editor: Editor;
};

const HistoryGroup = ({ editor }: Props) => {
  return (
    <>
      <ToolbarButton
        tooltip="Angre (Ctrl+Z)"
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Gjør om (Ctrl+Y)"
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};

export default HistoryGroup;
