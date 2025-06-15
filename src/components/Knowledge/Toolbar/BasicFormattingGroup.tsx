
import React from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Underline, Code, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, CaseSensitive } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';

type Props = {
  editor: Editor;
};

const BasicFormattingGroup = ({ editor }: Props) => {
  const toggleUppercase = () => {
    const { textTransform, ...otherAttributes } = editor.getAttributes('textStyle');

    if (textTransform === 'uppercase') {
      editor.chain().focus().setMark('textStyle', otherAttributes).removeEmptyTextStyle().run();
    } else {
      editor.chain().focus().setMark('textStyle', { ...otherAttributes, textTransform: 'uppercase' }).run();
    }
  };

  return (
    <>
      <ToolbarButton
        tooltip="Fet (Ctrl+B)"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Kursiv (Ctrl+I)"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Gjennomstreking (Ctrl+Shift+X)"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Understreking (Ctrl+U)"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Kode (Ctrl+E)"
        pressed={editor.isActive('code')}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
       <ToolbarButton
        tooltip="Senket skrift (Ctrl+,)"
        pressed={editor.isActive('subscript')}
        onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
      >
        <SubscriptIcon className="h-4 w-4" />
      </ToolbarButton>
       <ToolbarButton
        tooltip="Hevet skrift (Ctrl+.)"
        pressed={editor.isActive('superscript')}
        onPressedChange={() => editor.chain().focus().toggleSuperscript().run()}
      >
        <SuperscriptIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Store bokstaver"
        pressed={editor.isActive('textStyle', { textTransform: 'uppercase' })}
        onPressedChange={toggleUppercase}
        aria-label="Store bokstaver"
      >
        <CaseSensitive className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};

export default BasicFormattingGroup;
