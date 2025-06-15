
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

type EditorToolbarProps = {
  editor: Editor | null;
  onImageUpload: (file: File) => Promise<string | undefined>;
  isUploading: boolean;
  onOpenMediaLibrary: () => void;
};

export const EditorToolbar = ({ editor, onImageUpload, isUploading, onOpenMediaLibrary }: EditorToolbarProps) => {

  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-input bg-transparent rounded-t-md p-2 flex flex-wrap items-center gap-1">
      <HistoryGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <BasicFormattingGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <HighlightLinkGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <AlignmentGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <HeadingGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <ListGroup editor={editor} />
      <Separator orientation="vertical" className="h-8 mx-1" />
      <InsertGroup 
        editor={editor}
        onImageUpload={onImageUpload}
        isUploading={isUploading}
        onOpenMediaLibrary={onOpenMediaLibrary}
      />
    </div>
  );
};
