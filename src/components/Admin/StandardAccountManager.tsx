import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Edit, Trash2 } from 'lucide-react';
import EntityManager, { type EntityManagerProps } from '@/components/common/EntityManager';

type StandardAccountEntityManagerProps = EntityManagerProps<StandardAccount>;
const StandardAccountEntityManager =
  EntityManager as React.ComponentType<StandardAccountEntityManagerProps>;
import StandardAccountForm from './forms/StandardAccountForm';
import {
  useStandardAccounts,
  useCreateStandardAccount,
  useUpdateStandardAccount,
  useDeleteStandardAccount,
  type StandardAccount,
} from '@/hooks/useChartOfAccounts';
import { Label } from '@/components/ui/label';

const StandardAccountCard = ({ account, actions }: { account: StandardAccount; actions: { select: () => void; edit: () => void; remove: () => void; selected: boolean } }) => (
  <Card className={`cursor-pointer transition-colors hover:bg-accent/50 ${actions.selected ? 'border-primary' : ''}`}>\
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1" onClick={actions.select}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-semibold">
              {account.standard_number} - {account.standard_name}
            </h4>
            <Badge variant="outline" className="text-xs">
              {account.account_type}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={actions.edit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={actions.remove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const StandardAccountDetails = ({ account }: { account: StandardAccount }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label className="font-semibold">Kontonummer</Label>
        <p className="text-sm font-mono bg-muted p-2 rounded">{account.standard_number}</p>
      </div>
      <div>
        <Label className="font-semibold">Kontonavn</Label>
        <p className="text-sm">{account.standard_name}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label className="font-semibold">Kontotype</Label>
        <p className="text-sm">{account.account_type}</p>
      </div>
      <div>
        <Label className="font-semibold">Kategori</Label>
        <p className="text-sm">{account.category || 'Ingen'}</p>
      </div>
    </div>
    <div>
      <Label className="font-semibold">Analysegruppe</Label>
      <p className="text-sm">{account.analysis_group || 'Ingen'}</p>
    </div>
  </div>
);

const StandardAccountManager = () => {
  const { data: accounts = [], isLoading } = useStandardAccounts();
  const createAccount = useCreateStandardAccount();
  const updateAccount = useUpdateStandardAccount();
  const deleteAccount = useDeleteStandardAccount();

  return (
    <StandardAccountEntityManager
      items={accounts}
      isLoading={isLoading}
      itemKey={(a) => a.id}
      onCreate={async (data) => { await createAccount.mutateAsync(data); }}
      onUpdate={async (id, data) => { await updateAccount.mutateAsync({ id, ...data }); }}
      onDelete={async (id) => { await deleteAccount.mutateAsync(id); }}
      FormComponent={({ item, onSubmit }) => (
        <StandardAccountForm defaultValues={item ?? undefined} onSubmit={onSubmit} />
      )}
      renderItem={(account, actions) => (
        <StandardAccountCard account={account} actions={actions} />
      )}
      header={(
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Standardkontoplan
          </span>
          <Badge variant="outline">{accounts.length} kontoer</Badge>
        </div>
      )}
      footer={(item) => <StandardAccountDetails account={item} />}
    />
  );
};

export default StandardAccountManager;
