
import React from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Underline, Code, Subscript as SubscriptIcon, Superscript as SuperscriptIcon } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';

type Props = {
  editor: Editor;
};

const BasicFormattingGroup = ({ editor }: Props) => {
  return (
    <>
      <ToolbarButton
        tooltip="Bold"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Italic"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Strikethrough"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Underline"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Code"
        pressed={editor.isActive('code')}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
       <ToolbarButton
        tooltip="Subscript"
        pressed={editor.isActive('subscript')}
        onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
      >
        <SubscriptIcon className="h-4 w-4" />
      </ToolbarButton>
       <ToolbarButton
        tooltip="Superscript"
        pressed={editor.isActive('superscript')}
        onPressedChange={() => editor.chain().focus().toggleSuperscript().run()}
      >
        <SuperscriptIcon className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};

export default BasicFormattingGroup;
