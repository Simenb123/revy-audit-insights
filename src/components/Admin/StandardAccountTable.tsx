import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit, Trash2, Plus, Search, ArrowUpDown } from 'lucide-react';
import {
  useStandardAccounts,
  useCreateStandardAccount,
  useUpdateStandardAccount,
  useDeleteStandardAccount,
  type StandardAccount,
} from '@/hooks/useChartOfAccounts';
import StandardAccountForm from './forms/StandardAccountForm';
import { 
  getAccountTypeColor, 
  getLineTypeStyle, 
  getCategoryColor, 
  getLineTypeBadgeVariant 
} from '@/utils/accountColors';

type SortField = 'standard_number' | 'standard_name' | 'account_type' | 'category' | 'display_order';
type SortDirection = 'asc' | 'desc';

const StandardAccountTable = () => {
  const { data: accounts = [], isLoading } = useStandardAccounts();
  const createAccount = useCreateStandardAccount();
  const updateAccount = useUpdateStandardAccount();
  const deleteAccount = useDeleteStandardAccount();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('display_order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingAccount, setEditingAccount] = useState<StandardAccount | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Get unique values for filters
  const accountTypes = useMemo(() => {
    const types = [...new Set(accounts.map(acc => acc.account_type))];
    return types.sort();
  }, [accounts]);

  const categories = useMemo(() => {
    const cats = [...new Set(accounts.map(acc => acc.category).filter(Boolean))];
    return cats.sort();
  }, [accounts]);

  // Filter and sort accounts
  const filteredAndSortedAccounts = useMemo(() => {
    let filtered = accounts.filter(account => {
      const matchesSearch = 
        account.standard_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.standard_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || account.account_type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || account.category === categoryFilter;
      
      return matchesSearch && matchesType && matchesCategory;
    });

    // Sort accounts
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Handle numeric sorting for standard_number and display_order
      if (sortField === 'standard_number' || sortField === 'display_order') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [accounts, searchTerm, typeFilter, categoryFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreate = async (data: any) => {
    await createAccount.mutateAsync(data);
    setIsCreateDialogOpen(false);
  };

  const handleEdit = async (data: any) => {
    if (!editingAccount) return;
    await updateAccount.mutateAsync({ id: editingAccount.id, ...data });
    setIsEditDialogOpen(false);
    setEditingAccount(null);
  };

  const handleDelete = async (account: StandardAccount) => {
    if (confirm(`Er du sikker på at du vil slette konto ${account.standard_number} - ${account.standard_name}?`)) {
      await deleteAccount.mutateAsync(account.id);
    }
  };

  const getIndentLevel = (account: StandardAccount): number => {
    if (!account.parent_line_id) return 0;
    const parent = accounts.find(acc => acc.id === account.parent_line_id);
    return parent ? getIndentLevel(parent) + 1 : 0;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(field)}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        {children}
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    </TableHead>
  );

  if (isLoading) {
    return <div className="flex justify-center p-8">Laster standardkontoplan...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with filters and create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i kontoplan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Kontotype" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle typer</SelectItem>
              {accountTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle kategorier</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">{filteredAndSortedAccounts.length} av {accounts.length} kontoer</Badge>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ny konto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Opprett ny standardkonto</DialogTitle>
                <DialogDescription>
                  Opprett en ny standardkonto med kontonummer, navn og kategori.
                </DialogDescription>
              </DialogHeader>
              <StandardAccountForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="standard_number">Kontonummer</SortableHeader>
              <SortableHeader field="standard_name">Kontonavn</SortableHeader>
              <SortableHeader field="account_type">Type</SortableHeader>
              <SortableHeader field="category">Kategori</SortableHeader>
              <TableHead>Analysegruppe</TableHead>
              <TableHead>Linjetype</TableHead>
              <SortableHeader field="display_order">Rekkefølge</SortableHeader>
              <TableHead className="w-24">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
           <TableBody>
            {filteredAndSortedAccounts.map((account) => {
              const indentLevel = getIndentLevel(account);
              const lineTypeStyle = getLineTypeStyle(account);
              const accountTypeColors = getAccountTypeColor(account.account_type);
              
              return (
                <TableRow 
                  key={account.id} 
                  className={`${lineTypeStyle.row} transition-colors`}
                >
                  <TableCell>
                    <div 
                      className="font-mono flex items-center"
                      style={{ paddingLeft: `${indentLevel * 16}px` }}
                    >
                      {indentLevel > 0 && (
                        <span className="text-muted-foreground mr-2">└─</span>
                      )}
                      {account.standard_number}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {account.standard_name}
                  {account.is_total_line && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-brand-surface text-brand-text-muted border-brand-surface-hover">
                      Sum
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={accountTypeColors.badge}
                    >
                      {account.account_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {account.category ? (
                      <Badge 
                        variant="outline" 
                        className={getCategoryColor(account.category)}
                      >
                        {account.category}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{account.analysis_group || '-'}</TableCell>
                  <TableCell>
                    {account.line_type && (
                      <Badge 
                        variant={getLineTypeBadgeVariant(account.line_type) as any}
                        className={`text-xs ${lineTypeStyle.badge}`}
                      >
                        {account.line_type}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{account.display_order}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingAccount(account);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(account)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger standardkonto</DialogTitle>
            <DialogDescription>
              Rediger kontonummer, navn og kategori for den valgte standardkontoen.
            </DialogDescription>
          </DialogHeader>
          <StandardAccountForm 
            defaultValues={editingAccount || undefined} 
            onSubmit={handleEdit} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StandardAccountTable;