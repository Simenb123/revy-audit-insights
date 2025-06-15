
import React, { useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Image as ImageIcon, Table as TableIcon, Minus, Loader2, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import ToolbarButton from '../ToolbarButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  editor: Editor;
  onImageUpload: (file: File) => Promise<string | undefined>;
  isUploading: boolean;
  onOpenMediaLibrary: () => void;
};

const InsertGroup = ({ editor, onImageUpload, isUploading, onOpenMediaLibrary }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const url = await onImageUpload(file);
        if (url) {
          const alt = window.prompt("Alternativ tekst (for skjermlesere)", file.name);
          editor.chain().focus().setImage({ src: url, alt: alt || '' }).run();
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
  
  const setAltText = useCallback(() => {
    if (!editor.isActive('image')) return;
    const oldAlt = editor.getAttributes('image').alt || '';
    const newAlt = window.prompt('Alternativ tekst for bilde', oldAlt);

    if (newAlt !== null) {
      editor.chain().focus().updateAttributes('image', { alt: newAlt }).run();
    }
  }, [editor]);

  return (
    <>
      <ToolbarButton
        tooltip="Horisontal linje"
        onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>
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
            <p>Tabell</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
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
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
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
            <p>Bilde</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ToolbarButton
        tooltip="Rediger alternativ tekst for bilde"
        onPressedChange={setAltText}
        disabled={!editor.isActive('image')}
      >
        <FileText className="h-4 w-4" />
      </ToolbarButton>
    </>
  );
};

export default InsertGroup;
