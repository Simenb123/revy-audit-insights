
import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Image as ImageIcon } from 'lucide-react';
import { useArticleMedia } from '@/hooks/knowledge/useArticleMedia';
import { MediaLibraryDialog } from './MediaLibraryDialog';
import { EditorToolbar } from './EditorToolbar';

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
      Image,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[300px]',
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
              const position = coordinates ? coordinates.pos : editor.state.selection.from;
              editor.chain().focus().insertContentAt(position, { type: 'image', attrs: { src: url } }).run();
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

  const handleSelectImageFromLibrary = (url: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="border border-input rounded-md relative">
      <EditorToolbar 
        editor={editor} 
        onImageUpload={uploadImage} 
        isUploading={isUploading} 
        onOpenMediaLibrary={() => setIsMediaLibraryOpen(true)}
      />
      <EditorContent editor={editor} />
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
