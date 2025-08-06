import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useFirmStandardAccounts } from '@/hooks/useFirmStandardAccounts';
import { useAccountClassifications, useSaveAccountClassification, useBulkSaveAccountClassifications } from '@/hooks/useAccountClassifications';
import { ClassificationConfirmationDialog } from './ClassificationConfirmationDialog';

interface AccountClassificationViewProps {
  clientId: string;
  selectedVersion?: string;
  selectedFiscalYear: number;
}

interface GroupedAccount {
  account_number: string;
  account_name: string;
  closing_balance: number;
  current_category: string;
}

interface CategoryGroup {
  title: string;
  accounts: GroupedAccount[];
  color: string;
}

export function AccountClassificationView({ 
  clientId, 
  selectedVersion, 
  selectedFiscalYear 
}: AccountClassificationViewProps) {
  const [groupedCategories, setGroupedCategories] = useState<{ [key: string]: CategoryGroup }>({});
  const [pendingClassification, setPendingClassification] = useState<{
    account: GroupedAccount;
    fromCategory: string;
    toCategory: string;
    dropResult: DropResult;
  } | null>(null);

  const { data: trialBalanceData, isLoading: tbLoading } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear, 
    selectedVersion
  );
  
  const { data: standardAccounts, isLoading: saLoading } = useFirmStandardAccounts();
  
  const { data: existingClassifications } = useAccountClassifications(clientId, selectedVersion);
  const saveClassification = useSaveAccountClassification();
  const bulkSaveClassifications = useBulkSaveAccountClassifications();

  const isLoading = tbLoading || saLoading;

  // Group accounts into categories based on their standard_account_id or account number
  useEffect(() => {
    if (!trialBalanceData || !standardAccounts) return;

    const categories: { [key: string]: CategoryGroup } = {
      'Eiendeler': { title: 'Eiendeler', accounts: [], color: 'bg-blue-50' },
      'Gjeld': { title: 'Gjeld', accounts: [], color: 'bg-red-50' },
      'Egenkapital': { title: 'Egenkapital', accounts: [], color: 'bg-green-50' },
      'Resultater': { title: 'Resultater', accounts: [], color: 'bg-purple-50' },
    };

    // Create a map of existing classifications
    const classificationMap = new Map<string, string>();
    existingClassifications?.forEach(classification => {
      classificationMap.set(classification.account_number, classification.new_category);
    });

    trialBalanceData.trialBalanceEntries.forEach((item: any) => {
      if (!item.account_number || !item.account_name) return;

      const account: GroupedAccount = {
        account_number: item.account_number,
        account_name: item.account_name,
        closing_balance: item.closing_balance || 0,
        current_category: 'Ukategorisert',
      };

      // Check if there's an existing classification for this account
      const existingCategory = classificationMap.get(item.account_number);
      if (existingCategory && categories[existingCategory]) {
        account.current_category = existingCategory;
        categories[existingCategory].accounts.push(account);
        return;
      }

      // Try to find category based on standard_account_id mapping
      if (item.standard_account_id) {
        const standardAccount = standardAccounts.find((sa: any) => sa.id === item.standard_account_id);
        if (standardAccount) {
          if (standardAccount.account_type === 'asset') {
            account.current_category = 'Eiendeler';
            categories['Eiendeler'].accounts.push(account);
          } else if (standardAccount.account_type === 'liability') {
            account.current_category = 'Gjeld';
            categories['Gjeld'].accounts.push(account);
          } else if (standardAccount.account_type === 'equity') {
            account.current_category = 'Egenkapital';
            categories['Egenkapital'].accounts.push(account);
          } else if (standardAccount.account_type === 'income' || standardAccount.account_type === 'expense') {
            account.current_category = 'Resultater';
            categories['Resultater'].accounts.push(account);
          }
          return;
        }
      }

      // Fallback: categorize based on account number ranges
      const accountNum = parseInt(item.account_number);
      if (accountNum >= 1000 && accountNum <= 1999) {
        account.current_category = 'Eiendeler';
        categories['Eiendeler'].accounts.push(account);
      } else if (accountNum >= 2000 && accountNum <= 2999) {
        account.current_category = 'Gjeld';
        categories['Gjeld'].accounts.push(account);
      } else if (accountNum >= 3000 && accountNum <= 3999) {
        account.current_category = 'Egenkapital';
        categories['Egenkapital'].accounts.push(account);
      } else if (accountNum >= 4000 && accountNum <= 8999) {
        account.current_category = 'Resultater';
        categories['Resultater'].accounts.push(account);
      } else {
        // Default category for unknown accounts
        if (!categories['Ukategorisert']) {
          categories['Ukategorisert'] = { title: 'Ukategorisert', accounts: [], color: 'bg-gray-50' };
        }
        categories['Ukategorisert'].accounts.push(account);
      }
    });

    setGroupedCategories(categories);
  }, [trialBalanceData, standardAccounts, existingClassifications]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Check if dropped outside a valid area
    if (!destination) {
      return;
    }

    // Check if dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceCategory = source.droppableId;
    const destinationCategory = destination.droppableId;

    // Find the account that was dragged
    const sourceAccounts = groupedCategories[sourceCategory]?.accounts || [];
    const draggedAccount = sourceAccounts.find(acc => 
      `${acc.account_number}-${acc.account_name}` === draggableId
    );

    if (!draggedAccount) return;

    // Store pending classification for confirmation
    setPendingClassification({
      account: draggedAccount,
      fromCategory: sourceCategory,
      toCategory: destinationCategory,
      dropResult: result,
    });
  };

  const handleConfirmClassification = (options: {
    applySimilar: boolean;
    saveAsRule: boolean;
  }) => {
    if (!pendingClassification) return;

    const { account, fromCategory, toCategory, dropResult } = pendingClassification;

    // Apply the visual change immediately
    applyVisualClassification(dropResult);

    // Prepare classification data
    const baseClassification = {
      client_id: clientId,
      account_number: account.account_number,
      original_category: fromCategory,
      new_category: toCategory,
      classification_type: options.applySimilar ? 'bulk' as const : 'manual' as const,
      version_id: selectedVersion,
      is_active: true,
      metadata: {
        account_name: account.account_name,
        closing_balance: account.closing_balance,
        save_as_rule: options.saveAsRule,
      },
    };

    if (options.applySimilar) {
      // Find similar accounts to classify in bulk
      const accountPrefix = account.account_number.substring(0, 2);
      const similarAccounts = Object.values(groupedCategories)
        .flatMap(category => category.accounts)
        .filter(acc => 
          acc.account_number.startsWith(accountPrefix) && 
          acc.current_category === fromCategory
        );

      const bulkClassifications = similarAccounts.map(acc => ({
        ...baseClassification,
        account_number: acc.account_number,
        is_active: true,
        metadata: {
          ...baseClassification.metadata,
          account_name: acc.account_name,
          closing_balance: acc.closing_balance,
        },
      }));

      bulkSaveClassifications.mutate(bulkClassifications);
    } else {
      saveClassification.mutate(baseClassification);
    }

    setPendingClassification(null);
  };

  const applyVisualClassification = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;

    const sourceCategory = source.droppableId;
    const destinationCategory = destination.droppableId;

    // Find the account that was dragged
    const sourceAccounts = groupedCategories[sourceCategory]?.accounts || [];
    const draggedAccount = sourceAccounts.find(acc => 
      `${acc.account_number}-${acc.account_name}` === draggableId
    );

    if (!draggedAccount) return;

    // Create a copy of the current state
    const newCategories = { ...groupedCategories };

    // Remove from source
    newCategories[sourceCategory] = {
      ...newCategories[sourceCategory],
      accounts: sourceAccounts.filter(acc => 
        `${acc.account_number}-${acc.account_name}` !== draggableId
      )
    };

    // Add to destination
    const destinationAccounts = [...(newCategories[destinationCategory]?.accounts || [])];
    const updatedAccount = { ...draggedAccount, current_category: destinationCategory };
    destinationAccounts.splice(destination.index, 0, updatedAccount);

    newCategories[destinationCategory] = {
      ...newCategories[destinationCategory],
      accounts: destinationAccounts
    };

    // Update state
    setGroupedCategories(newCategories);
  };

  const getAllAccounts = () => {
    return Object.values(groupedCategories).flatMap(category => category.accounts);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Laster kontoklassifisering...</span>
      </div>
    );
  }

  if (!trialBalanceData || !trialBalanceData.trialBalanceEntries || trialBalanceData.trialBalanceEntries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ingen regnskapsdata funnet for valgt periode.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedCategories).map(([categoryName, category]) => (
            <Card key={categoryName} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{category.title}</span>
                  <Badge variant="secondary">
                    {category.accounts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId={categoryName}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] max-h-[400px] overflow-y-auto space-y-2 p-4 border-2 border-dashed rounded-lg transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border'
                      } ${category.color}`}
                    >
                      {category.accounts.map((account, index) => (
                        <Draggable 
                          key={`${account.account_number}-${account.account_name}`} 
                          draggableId={`${account.account_number}-${account.account_name}`} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 bg-white border rounded-md shadow-sm cursor-move transition-all ${
                                snapshot.isDragging 
                                  ? 'shadow-lg rotate-3 scale-105' 
                                  : 'hover:shadow-md'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm">
                                    {account.account_number}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {account.account_name}
                                  </div>
                                </div>
                                <div className="text-xs font-mono ml-2">
                                  {account.closing_balance.toLocaleString('nb-NO')} kr
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {category.accounts.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                          Ingen kontoer i denne kategorien
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

      <ClassificationConfirmationDialog
        isOpen={!!pendingClassification}
        onClose={() => setPendingClassification(null)}
        onConfirm={handleConfirmClassification}
        account={pendingClassification?.account || null}
        fromCategory={pendingClassification?.fromCategory || ''}
        toCategory={pendingClassification?.toCategory || ''}
        similarAccounts={getAllAccounts()}
      />
    </div>
  );
}