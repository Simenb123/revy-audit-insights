
import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Highlighter, Link as LinkIcon } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  editor: Editor;
};

const HighlightLinkGroup = ({ editor }: Props) => {
  const handleSetLink = useCallback(() => {
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

  return (
    <>
       <ToolbarButton
        tooltip="Uthev (Ctrl+Shift+H)"
        pressed={editor.isActive('highlight')}
        onPressedChange={() => editor.chain().focus().toggleHighlight({ color: '#FFFFA0' }).run()}
      >
        <Highlighter className="h-4 w-4" />
      </ToolbarButton>
       <ToolbarButton
        tooltip="Lenke (Ctrl+K)"
        pressed={editor.isActive('link')}
        onPressedChange={handleSetLink}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <Tooltip>
        <TooltipTrigger asChild>
           <input
            type="color"
            onInput={(event: React.ChangeEvent<HTMLInputElement>) => editor.chain().focus().setColor(event.target.value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-9 h-9 p-1 bg-transparent border border-input rounded-md cursor-pointer focus:ring-0 focus:outline-none"
            title="Tekstfarge"
            aria-label="Tekstfarge"
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Tekstfarge</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
            <input
            type="color"
            onInput={(event: React.ChangeEvent<HTMLInputElement>) => editor.chain().focus().toggleHighlight({ color: event.target.value }).run()}
            value={editor.getAttributes('highlight').color || '#ffffff'}
            className="w-9 h-9 p-1 bg-transparent border border-input rounded-md cursor-pointer focus:ring-0 focus:outline-none"
            title="Uthevingsfarge"
            aria-label="Uthevingsfarge"
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Uthevingsfarge</p>
        </TooltipContent>
      </Tooltip>
    </>
  );
};

export default HighlightLinkGroup;
