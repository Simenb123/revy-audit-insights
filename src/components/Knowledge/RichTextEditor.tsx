
import React, { useRef, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered, Quote, Image as ImageIcon } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { useArticleMedia } from '@/hooks/knowledge/useArticleMedia';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MediaLibraryDialog } from './MediaLibraryDialog';

type ToolbarProps = {
  editor: Editor | null;
  onImageUpload: (file: File) => Promise<string | undefined>;
  isUploading: boolean;
  onOpenMediaLibrary: () => void;
};

const Toolbar = ({ editor, onImageUpload, isUploading, onOpenMediaLibrary }: ToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const url = await onImageUpload(file);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      } catch (error) {
        // Error is handled by the mutation's onError toast
        console.error("Upload failed in component:", error);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="border border-input bg-transparent rounded-t-md p-2 flex flex-wrap items-center gap-1">
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 mx-1" />
       <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 h-9 p-0" disabled={isUploading}>
            <ImageIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={triggerFileInput}>
            Last opp nytt bilde
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenMediaLibrary}>
            Velg fra bibliotek
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};


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
      <Toolbar 
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
