import React, { useState } from 'react';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useFirmStandardAccounts } from '@/hooks/useFirmStandardAccounts';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, TrendingUp, TrendingDown, DollarSign, Building } from 'lucide-react';
import { convertAccountType } from '@/utils/accountTypeMapping';

interface AccountClassificationViewProps {
  clientId: string;
  selectedVersion: string;
  selectedFiscalYear: number;
}

interface GroupedAccount {
  id: string;
  account_number: string;
  account_name: string;
  closing_balance: number;
  current_category?: string;
  standard_account_id?: string;
}

interface CategoryGroup {
  id: string;
  name: string;
  display_name: string;
  icon: React.ReactNode;
  color: string;
  accounts: GroupedAccount[];
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'eiendeler':
      return <Building className="h-4 w-4" />;
    case 'gjeld':
      return <TrendingDown className="h-4 w-4" />;
    case 'egenkapital':
      return <DollarSign className="h-4 w-4" />;
    case 'resultat':
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'eiendeler':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'gjeld':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'egenkapital':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'resultat':
      return 'bg-purple-50 border-purple-200 text-purple-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

export function AccountClassificationView({ clientId, selectedVersion, selectedFiscalYear }: AccountClassificationViewProps) {
  const { data: trialBalanceData, isLoading: tbLoading } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear, 
    selectedVersion
  );
  
  const { data: standardAccounts, isLoading: saLoading } = useFirmStandardAccounts();
  
  const [groupedCategories, setGroupedCategories] = useState<CategoryGroup[]>([]);

  React.useEffect(() => {
    if (!trialBalanceData?.trialBalanceEntries || !standardAccounts) return;

    // Group accounts by their current category (account type)
    const accountsByCategory = new Map<string, GroupedAccount[]>();
    
    trialBalanceData.trialBalanceEntries.forEach(entry => {
      // Determine category based on account number range or existing mapping
      let category = 'ukjent';
      
      if (entry.standard_account_id) {
        const standardAccount = standardAccounts.find((sa: any) => sa.id === entry.standard_account_id);
        if (standardAccount) {
          category = convertAccountType(standardAccount.account_type);
        }
      } else {
        // Fallback to account number range classification
        const accountNum = parseInt(entry.account_number);
        if (accountNum >= 1000 && accountNum < 2000) category = 'eiendeler';
        else if (accountNum >= 2000 && accountNum < 3000) category = 'gjeld';
        else if (accountNum >= 2000 && accountNum < 2100) category = 'egenkapital';
        else if (accountNum >= 3000 && accountNum < 9000) category = 'resultat';
      }

      const account: GroupedAccount = {
        id: entry.id,
        account_number: entry.account_number,
        account_name: entry.account_name,
        closing_balance: entry.closing_balance,
        current_category: category,
        standard_account_id: entry.standard_account_id
      };

      if (!accountsByCategory.has(category)) {
        accountsByCategory.set(category, []);
      }
      accountsByCategory.get(category)!.push(account);
    });

    // Create category groups
    const categories: CategoryGroup[] = [
      {
        id: 'eiendeler',
        name: 'eiendeler',
        display_name: 'Eiendeler',
        icon: getCategoryIcon('eiendeler'),
        color: getCategoryColor('eiendeler'),
        accounts: accountsByCategory.get('eiendeler') || []
      },
      {
        id: 'gjeld',
        name: 'gjeld', 
        display_name: 'Gjeld',
        icon: getCategoryIcon('gjeld'),
        color: getCategoryColor('gjeld'),
        accounts: accountsByCategory.get('gjeld') || []
      },
      {
        id: 'egenkapital',
        name: 'egenkapital',
        display_name: 'Egenkapital',
        icon: getCategoryIcon('egenkapital'),
        color: getCategoryColor('egenkapital'),
        accounts: accountsByCategory.get('egenkapital') || []
      },
      {
        id: 'resultat',
        name: 'resultat',
        display_name: 'Resultat',
        icon: getCategoryIcon('resultat'),
        color: getCategoryColor('resultat'),
        accounts: accountsByCategory.get('resultat') || []
      },
      {
        id: 'ukjent',
        name: 'ukjent',
        display_name: 'Uklassifisert',
        icon: getCategoryIcon('ukjent'),
        color: getCategoryColor('ukjent'),
        accounts: accountsByCategory.get('ukjent') || []
      }
    ];

    setGroupedCategories(categories);
  }, [trialBalanceData, standardAccounts]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Find the account being moved
    const sourceCategory = groupedCategories.find(cat => cat.id === source.droppableId);
    const destCategory = groupedCategories.find(cat => cat.id === destination.droppableId);
    
    if (!sourceCategory || !destCategory) return;

    const account = sourceCategory.accounts.find(acc => acc.id === draggableId);
    if (!account) return;

    // Update the categories
    const newCategories = groupedCategories.map(category => {
      if (category.id === source.droppableId) {
        // Remove from source
        return {
          ...category,
          accounts: category.accounts.filter(acc => acc.id !== draggableId)
        };
      } else if (category.id === destination.droppableId) {
        // Add to destination
        const newAccounts = [...category.accounts];
        const updatedAccount = { ...account, current_category: category.name };
        newAccounts.splice(destination.index, 0, updatedAccount);
        return {
          ...category,
          accounts: newAccounts
        };
      }
      return category;
    });

    setGroupedCategories(newCategories);
    
    // TODO: Show confirmation dialog and save changes
    console.log(`Moving account ${account.account_number} from ${sourceCategory.display_name} to ${destCategory.display_name}`);
  };

  if (tbLoading || saLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Laster kontoklassifisering...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Kontoklassifisering</h3>
        <p className="text-sm text-muted-foreground">
          Dra og slipp kontoer mellom kategorier for å reklassifisere dem
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {groupedCategories.map((category) => (
            <Card key={category.id} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {category.icon}
                  {category.display_name}
                  <Badge variant="secondary" className="ml-auto">
                    {category.accounts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Droppable droppableId={category.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] max-h-[400px] overflow-y-auto space-y-2 p-2 rounded-md border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border bg-background'
                      }`}
                    >
                      {category.accounts.map((account, index) => (
                        <Draggable key={account.id} draggableId={account.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 rounded-md border bg-card text-card-foreground transition-all cursor-move ${
                                snapshot.isDragging 
                                  ? 'shadow-lg scale-105 rotate-2' 
                                  : 'hover:shadow-md'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm">
                                    {account.account_number}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {account.account_name}
                                  </div>
                                </div>
                                <div className="text-xs font-mono text-right">
                                  {account.closing_balance.toLocaleString('nb-NO', {
                                    style: 'currency',
                                    currency: 'NOK',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {category.accounts.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                          Ingen kontoer
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}