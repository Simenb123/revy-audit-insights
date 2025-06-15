
import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import CharacterCount from '@tiptap/extension-character-count';
import { Image as ImageIcon } from 'lucide-react';
import { useArticleMedia } from '@/hooks/knowledge/useArticleMedia';
import { MediaLibraryDialog } from './MediaLibraryDialog';
import { EditorToolbar } from './EditorToolbar';

// Extend Tiptap extensions to add keyboard shortcuts
const CustomSubscript = Subscript.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-,': () => this.editor.commands.toggleSubscript(),
    };
  },
});

const CustomSuperscript = Superscript.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-.': () => this.editor.commands.toggleSuperscript(),
    };
  },
});

type RichTextEditorProps = {
  content: string;
  onChange: (richText: string) => void;
};

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const { uploadImage, isUploading } = useArticleMedia();
  const [isDragging, setIsDragging] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      CustomSubscript,
      CustomSuperscript,
      CharacterCount,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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

  useEffect(() => {
    if (editor && content) {
      const isSame = editor.getHTML() === content;

      if (isSame) {
        return;
      }
      
      // Bruker `setContent` for å oppdatere editorens innhold når `content`-prop endres.
      // Det andre argumentet `false` forhindrer at denne handlingen utløser `onUpdate`-callbacken,
      // som unngår en uendelig løkke.
      editor.commands.setContent(content, false);
    }
  }, [editor, content]);

  const handleSelectImageFromLibrary = (url: string) => {
    if (editor) {
      const alt = window.prompt("Alternativ tekst (for skjermlesere)", "");
      editor.chain().focus().setImage({ src: url, alt: alt || '' }).run();
    }
  };

  return (
    <div className={`border border-input rounded-md relative transition-all ${isDragging ? 'border-2 border-dashed border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
      <EditorToolbar 
        editor={editor} 
        onImageUpload={uploadImage} 
        isUploading={isUploading} 
        onOpenMediaLibrary={() => setIsMediaLibraryOpen(true)}
      />
      <EditorContent editor={editor} />
      {editor && (
        <div className="text-xs text-muted-foreground p-2 border-t border-input text-right">
          {editor.storage.characterCount.words()} ord
        </div>
      )}
      {isDragging && (
        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center pointer-events-none rounded-b-md z-10">
          <div className="text-center text-white p-6 bg-black/70 rounded-xl shadow-lg">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 animate-bounce" />
            <p className="font-bold text-lg">Slipp bildet her</p>
            <p className="text-sm">Bildet blir lastet opp og satt inn i artikkelen.</p>
          </div>
        </div>
      )}
       <MediaLibraryDialog
        open={isMediaLibraryOpen}
        onOpenChange={setIsMediaLibraryOpen}
        onSelectImage={handleSelectImageFromLibrary}
      />
    </div>
  );
};

export default RichTextEditor;
