
import React from 'react';
import { Editor } from '@tiptap/react';
import { Indent, Outdent, ListTodo } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';

type Props = {
  editor: Editor;
};

const ListActionsGroup = ({ editor }: Props) => {
  return (
    <div className="flex items-center gap-1">
      <ToolbarButton
        tooltip="Sjekkliste"
        pressed={editor.isActive('taskList')}
        onPressedChange={() => editor.chain().focus().toggleList('taskList', 'taskItem').run()}
      >
        <ListTodo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Reduser innrykk (Shift+Tab)"
        onClick={() => editor.chain().focus().liftListItem('listItem').run()}
        disabled={!editor.can().liftListItem('listItem')}
      >
        <Outdent className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Øk innrykk (Tab)"
        onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
        disabled={!editor.can().sinkListItem('listItem')}
      >
        <Indent className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
};

export default ListActionsGroup;
