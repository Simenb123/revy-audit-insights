import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered, Quote, Image as ImageIcon, Table as TableIcon, Underline } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type EditorToolbarProps = {
  editor: Editor | null;
  onImageUpload: (file: File) => Promise<string | undefined>;
  isUploading: boolean;
  onOpenMediaLibrary: () => void;
};

export const EditorToolbar = ({ editor, onImageUpload, isUploading, onOpenMediaLibrary }: EditorToolbarProps) => {
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
      <Toggle
        size="sm"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().toggleUnderline()}
      >
        <Underline className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <input
        type="color"
        onInput={(event: React.ChangeEvent<HTMLInputElement>) => editor.chain().focus().setColor(event.target.value).run()}
        value={editor.getAttributes('textStyle').color || '#000000'}
        className="w-8 h-8 p-1 bg-transparent border-0 rounded-md cursor-pointer focus:ring-0 focus:outline-none"
        title="Tekstfarge"
      />
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
            <TableIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            Sett inn tabell
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().addColumnBefore().run()} disabled={!editor.can().addColumnBefore()}>
            Legg til kolonne før
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()}>
            Legg til kolonne etter
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()}>
            Slett kolonne
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().addRowBefore().run()} disabled={!editor.can().addRowBefore()}>
            Legg til rad før
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()}>
            Legg til rad etter
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()}>
            Slett rad
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeaderRow().run()} disabled={!editor.can().toggleHeaderRow()}>
            Veksle overskriftsrad
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()}>
            Slett tabell
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
