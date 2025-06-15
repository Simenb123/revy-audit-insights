
import React from 'react';
import { Editor } from '@tiptap/react';
import { Separator } from '@/components/ui/separator';

import BasicFormattingGroup from './Toolbar/BasicFormattingGroup';
import HighlightLinkGroup from './Toolbar/HighlightLinkGroup';
import AlignmentGroup from './Toolbar/AlignmentGroup';
import HeadingGroup from './Toolbar/HeadingGroup';
import ListGroup from './Toolbar/ListGroup';
import InsertGroup from './Toolbar/InsertGroup';
import HistoryGroup from './Toolbar/HistoryGroup';
import RevyAIGroup from './Toolbar/RevyAIGroup';
import { Client } from '@/types/revio';
import { ClientAuditAction } from '@/types/audit-actions';
import FontSizeGroup from './Toolbar/FontSizeGroup';
import FontFamilyGroup from './Toolbar/FontFamilyGroup';
import LineHeightGroup from './Toolbar/LineHeightGroup';
import LetterSpacingGroup from './Toolbar/LetterSpacingGroup';

type EditorToolbarProps = {
  editor: Editor | null;
  onImageUpload: (file: File) => Promise<string | undefined>;
  isUploading: boolean;
  onOpenMediaLibrary: () => void;
  context?: 'knowledge' | 'audit';
  contextData?: {
    client?: Client;
    action?: ClientAuditAction;
  };
};

export const EditorToolbar = ({ editor, onImageUpload, isUploading, onOpenMediaLibrary, context = 'knowledge', contextData = {} }: EditorToolbarProps) => {

  if (!editor) {
    return null;
  }
  
  const { client, action } = contextData;

  return (
    <div className="border-b border-input bg-transparent rounded-t-md p-2 flex flex-wrap items-center gap-1">
      <HistoryGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <HeadingGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <FontFamilyGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <FontSizeGroup editor={editor} />
      <LineHeightGroup editor={editor} />
      <LetterSpacingGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <BasicFormattingGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <HighlightLinkGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <AlignmentGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <ListGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <InsertGroup 
        editor={editor}
        onImageUpload={onImageUpload}
        isUploading={isUploading}
        onOpenMediaLibrary={onOpenMediaLibrary}
      />
      {context === 'audit' && client && action && (
        <>
          <Separator orientation="vertical" className="h-8 mx-1" />
          <RevyAIGroup editor={editor} client={client} action={action} />
        </>
      )}
    </div>
  );
};
