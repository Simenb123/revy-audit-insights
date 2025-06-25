import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Edit, Trash2, Plus } from 'lucide-react';
import TaxonomyForm, { TaxonomyData } from './TaxonomyForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TaxonomyItem extends TaxonomyData {
  id: string;
}

interface TaxonomyTableProps {
  title: string;
  items: TaxonomyItem[];
  onCreate: (data: TaxonomyData) => void;
  onUpdate: (id: string, data: TaxonomyData) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string, active: boolean) => void;
}

const TaxonomyTable: React.FC<TaxonomyTableProps> = ({
  title,
  items,
  onCreate,
  onUpdate,
  onDelete,
  onToggleActive,
}) => {
  const [editing, setEditing] = React.useState<TaxonomyItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (item: TaxonomyItem) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const handleSubmit = (data: TaxonomyData) => {
    if (editing) {
      onUpdate(editing.id, data);
    } else {
      onCreate(data);
    }
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} size="sm">
                <Plus className="w-4 h-4 mr-2" /> Ny
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Rediger' : 'Ny'}</DialogTitle>
              </DialogHeader>
              <TaxonomyForm
                initialData={editing ?? undefined}
                onSubmit={handleSubmit}
                onCancel={() => setDialogOpen(false)}
                submitLabel={editing ? 'Oppdater' : 'Opprett'}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Navn</TableHead>
              <TableHead>Beskrivelse</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {item.color && (
                      <span
                        className="w-2 h-2 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    {item.display_name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.description}
                </TableCell>
                <TableCell className="text-center">
                  {item.is_active ? (
                    <Badge>Aktiv</Badge>
                  ) : (
                    <Badge variant="secondary">Inaktiv</Badge>
                  )}
                </TableCell>
                <TableCell className="flex gap-2">
                  {onToggleActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(item.id, !item.is_active)}
                    >
                      {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {items.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">Ingen elementer.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TaxonomyTable;
