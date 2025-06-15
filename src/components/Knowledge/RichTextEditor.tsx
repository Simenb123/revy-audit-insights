
import React, { useState, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { Image as ImageIcon } from 'lucide-react';
import { useArticleMedia } from '@/hooks/knowledge/useArticleMedia';
import { MediaLibraryDialog } from './MediaLibraryDialog';
import { EditorToolbar } from './EditorToolbar';
import { Client } from '@/types/revio';
import { ClientAuditAction } from '@/types/audit-actions';
import { useTiptapEditor } from '@/hooks/knowledge/useTiptapEditor';

type RichTextEditorProps = {
  content: string;
  onChange: (richText: string) => void;
  context?: 'knowledge' | 'audit';
  contextData?: {
    client?: Client;
    action?: ClientAuditAction;
  };
};

const RichTextEditor = ({ content, onChange, context = 'knowledge', contextData }: RichTextEditorProps) => {
  const { uploadImage, isUploading } = useArticleMedia();
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);

  const { editor, isDragging } = useTiptapEditor({
    content,
    onChange,
    uploadImage,
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
        context={context}
        contextData={contextData}
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
