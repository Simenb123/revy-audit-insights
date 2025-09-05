import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Check, X, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Note {
  id: string;
  code: string;
  text: string;
  timestamp: Date;
  author: string;
  type: 'note' | 'approval' | 'rejection';
}

interface NotesManagerProps {
  code: string;
  description: string;
  notes: Note[];
  onUpdateNotes: (code: string, notes: string) => void;
  onAcceptDiscrepancy: (code: string) => void;
  onRejectDiscrepancy: (code: string) => void;
}

export const NotesManager: React.FC<NotesManagerProps> = ({
  code,
  description,
  notes,
  onUpdateNotes,
  onAcceptDiscrepancy,
  onRejectDiscrepancy
}) => {
  const [newNote, setNewNote] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSaveNote = () => {
    if (!newNote.trim()) return;
    
    onUpdateNotes(code, newNote);
    setNewNote('');
    setIsOpen(false);
    
    toast({
      title: "Notat lagret",
      description: `Notat for ${description} er lagret.`
    });
  };

  const handleAccept = () => {
    onAcceptDiscrepancy(code);
    setIsOpen(false);
  };

  const handleReject = () => {
    onRejectDiscrepancy(code);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <MessageSquare className="h-4 w-4" />
          {notes.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
              {notes.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notater og avvikshåndtering</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Existing Notes */}
          {notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Eksisterende notater</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="border-l-2 border-muted pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          note.type === 'approval' ? 'default' :
                          note.type === 'rejection' ? 'destructive' : 'secondary'
                        }>
                          {note.type === 'approval' ? 'Godkjent' :
                           note.type === 'rejection' ? 'Avvist' : 'Notat'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {note.timestamp.toLocaleDateString('nb-NO')} - {note.author}
                        </span>
                      </div>
                      <p className="text-sm">{note.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add New Note */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Legg til notat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Textarea
                  placeholder="Skriv ditt notat her..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button onClick={handleAccept} size="sm" variant="default">
                      <Check className="h-4 w-4 mr-1" />
                      Godkjenn avvik
                    </Button>
                    <Button onClick={handleReject} size="sm" variant="destructive">
                      <X className="h-4 w-4 mr-1" />
                      Avvis avvik
                    </Button>
                  </div>
                  <Button onClick={handleSaveNote} size="sm" disabled={!newNote.trim()}>
                    <Save className="h-4 w-4 mr-1" />
                    Lagre notat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
