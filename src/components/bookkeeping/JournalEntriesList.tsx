import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Eye, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2
} from 'lucide-react';
import { 
  useJournalEntries, 
  usePostJournalEntry, 
  useDeleteJournalEntry, 
  JournalEntry 
} from '@/hooks/useJournalEntries';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface JournalEntriesListProps {
  clientId: string;
}

const JournalEntriesList: React.FC<JournalEntriesListProps> = ({ clientId }) => {
  const { data: journalEntries, isLoading } = useJournalEntries(clientId);
  const postJournalEntry = usePostJournalEntry();
  const deleteJournalEntry = useDeleteJournalEntry();

  const getStatusBadge = (status: JournalEntry['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Kladd</Badge>;
      case 'posted':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Postert</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Kansellert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePost = (entryId: string) => {
    postJournalEntry.mutate(entryId);
  };

  const handleDelete = (entryId: string) => {
    deleteJournalEntry.mutate(entryId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Laster bilag...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bilag og journalposter</CardTitle>
      </CardHeader>
      <CardContent>
        {!journalEntries || journalEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ingen bilag funnet</p>
            <p className="text-sm">Opprett ditt første bilag ved å bruke skjemaet ovenfor</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bilagsnummer</TableHead>
                <TableHead>Dato</TableHead>
                <TableHead>Beskrivelse</TableHead>
                <TableHead>Beløp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {entry.voucher_number}
                  </TableCell>
                  <TableCell>
                    {new Date(entry.voucher_date).toLocaleDateString('nb-NO')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{entry.description}</div>
                      {entry.journal_entry_lines && entry.journal_entry_lines.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {entry.journal_entry_lines.length} posteringslinjer
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.total_amount.toLocaleString('nb-NO', { 
                      style: 'currency', 
                      currency: 'NOK' 
                    })}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(entry.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {entry.status === 'draft' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePost(entry.id)}
                            disabled={postJournalEntry.isPending}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Slett bilag</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Er du sikker på at du vil slette bilag {entry.voucher_number}? 
                                  Dette kan ikke angres.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(entry.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Slett
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default JournalEntriesList;