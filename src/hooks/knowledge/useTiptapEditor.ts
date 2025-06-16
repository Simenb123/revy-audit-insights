
import { useState, useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import { editorExtensions } from '@/components/Knowledge/tiptap-extensions/editorExtensions';

type UseTiptapEditorProps = {
  content: string;
  onChange: (richText: string) => void;
  uploadImage: (file: File) => Promise<string | undefined>;
};

export const useTiptapEditor = ({ content, onChange, uploadImage }: UseTiptapEditorProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [lastContent, setLastContent] = useState(content);

  const editor = useEditor({
    extensions: editorExtensions,
    content: content,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      onChange(newContent);
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert m-5 focus:outline-none min-h-[300px]',
      },
      handleDrop: (view, event, slice, moved) => {
        setIsDragging(false);
        if (moved) return false;

        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) return false;

        event.preventDefault();

        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

        imageFiles.forEach(async (file) => {
          try {
            const url = await uploadImage(file);
            if (url && editor) {
              const alt = window.prompt("Alternativ tekst (for skjermlesere)", file.name);
              const position = coordinates ? coordinates.pos : editor.state.selection.from;
              editor.chain().focus().insertContentAt(position, { type: 'image', attrs: { src: url, alt: alt || '' } }).run();
            }
          } catch (error) {
            console.error("Upload failed on drop:", error);
          }
        });

        return true;
      },
      handleDOMEvents: {
        dragover: (view, event) => {
          event.preventDefault();
          if (!isDragging) setIsDragging(true);
          return false;
        },
        dragleave: (view, event) => {
          if (isDragging) setIsDragging(false);
          return false;
        },
        drop: (view, event) => {
          if (isDragging) setIsDragging(false);
          return false;
        },
      },
    },
  });

  // Handle external content changes more carefully
  useEffect(() => {
    if (editor && content !== lastContent) {
      const currentContent = editor.getHTML();
      
      // Only update if the content is actually different and not empty
      if (content && content !== currentContent) {
        editor.commands.setContent(content, false);
        setLastContent(content);
      }
    }
  }, [editor, content, lastContent]);

  return { editor, isDragging };
};
