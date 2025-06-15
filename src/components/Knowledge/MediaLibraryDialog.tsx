
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useArticleMediaLibrary } from '@/hooks/knowledge/useArticleMediaLibrary';
import { ArticleMedia } from '@/types/knowledge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageIcon, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectImage: (url: string) => void;
}

const getPublicUrl = (filePath: string) => {
  const { data } = supabase.storage.from('article-media').getPublicUrl(filePath);
  return data.publicUrl;
};

export const MediaLibraryDialog = ({ open, onOpenChange, onSelectImage }: MediaLibraryDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: media, isLoading, error } = useArticleMediaLibrary(searchTerm);

  const handleSelect = (mediaItem: ArticleMedia) => {
    const url = getPublicUrl(mediaItem.file_path);
    onSelectImage(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mediebibliotek</DialogTitle>
          <DialogDescription>
            Søk og velg et bilde for å sette det inn i artikkelen din.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Søk etter filnavn eller alt-tekst..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <ScrollArea className="flex-grow mt-4 pr-4">
          {isLoading && <div className="text-center p-10">Laster media...</div>}
          {error && <p className="text-destructive text-center p-10">Kunne ikke hente media: {error.message}</p>}
          {media && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {media.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="aspect-square border rounded-md overflow-hidden relative group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label={`Select image ${item.file_name}`}
                >
                  <img
                    src={getPublicUrl(item.file_path)}
                    alt={item.alt_text || item.file_name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate w-full">{item.file_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {media?.length === 0 && !isLoading && (
            <div className="text-center py-10 flex flex-col items-center justify-center h-full">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">Ingen bilder funnet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Prøv å laste opp et bilde først.
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
