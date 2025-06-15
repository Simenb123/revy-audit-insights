import React, { useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered, Quote, 
  Image as ImageIcon, Table as TableIcon, Underline, AlignLeft, AlignCenter, 
  AlignRight, Highlighter, Link as LinkIcon, Subscript as SubscriptIcon, 
  Superscript as SuperscriptIcon, Code, Minus
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import ToolbarButton from './ToolbarButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

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
    <div className="border-b border-input bg-transparent rounded-t-md p-2 flex flex-wrap items-center gap-1">
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
      <Separator orientation="vertical" className="h-8 mx-1" />
       <ToolbarButton
        tooltip="Highlight"
        pressed={editor.isActive('highlight')}
        onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter className="h-4 w-4" />
      </ToolbarButton>
       <ToolbarButton
        tooltip="Link"
        pressed={editor.isActive('link')}
        onPressedChange={handleSetLink}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
             <input
              type="color"
              onInput={(event: React.ChangeEvent<HTMLInputElement>) => editor.chain().focus().setColor(event.target.value).run()}
              value={editor.getAttributes('textStyle').color || '#000000'}
              className="w-8 h-8 p-1 bg-transparent border border-input rounded-md cursor-pointer focus:ring-0 focus:outline-none"
              title="Tekstfarge"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Text color</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Separator orientation="vertical" className="h-8 mx-1" />
       <ToolbarButton
        tooltip="Align Left"
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Align Center"
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Align Right"
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <ToolbarButton
        tooltip="Heading 2"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Heading 3"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="h-8 mx-1" />
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
      <ToolbarButton
        tooltip="Horizontal Rule"
        onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>
            <p>Table</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
      />
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>
            <p>Image</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
