
import React, { useState, useEffect } from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "@/components/ui/sidebar";
import { Search, ChevronRight, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Account, AccountGroup } from '@/types/revio';

// Mock data for account groups and accounts
const mockAccountGroups: AccountGroup[] = [
  {
    id: "income",
    name: "Driftsinntekter",
    balance: 15450000,
    prevBalance: 14200000,
    accounts: [
      { id: "3000", accountId: "3000", name: "Salgsinntekt, avgiftspliktig", groupId: "income", balance: 12500000, prevBalance: 11600000 },
      { id: "3100", accountId: "3100", name: "Salgsinntekt, avgiftsfri", groupId: "income", balance: 2950000, prevBalance: 2600000 },
    ]
  },
  {
    id: "expenses",
    name: "Driftskostnader",
    balance: 11230000,
    prevBalance: 10400000,
    accounts: [
      { id: "4300", accountId: "4300", name: "Varekjøp, høy avgiftssats", groupId: "expenses", balance: 4500000, prevBalance: 4100000 },
      { id: "5000", accountId: "5000", name: "Lønn til ansatte", groupId: "expenses", balance: 4850000, prevBalance: 4500000 },
      { id: "6300", accountId: "6300", name: "Leie lokaler", groupId: "expenses", balance: 950000, prevBalance: 950000 },
      { id: "6340", accountId: "6340", name: "Lys og varme", groupId: "expenses", balance: 325000, prevBalance: 290000 },
      { id: "6500", accountId: "6500", name: "Kontorrekvisita", groupId: "expenses", balance: 155000, prevBalance: 175000 },
      { id: "6700", accountId: "6700", name: "Regnskapshonorar", groupId: "expenses", balance: 275000, prevBalance: 225000 },
      { id: "6800", accountId: "6800", name: "Kontorrekvisita", groupId: "expenses", balance: 175000, prevBalance: 160000 },
    ]
  },
  {
    id: "assets",
    name: "Eiendeler",
    balance: 8120000,
    prevBalance: 7250000,
    accounts: [
      { id: "1500", accountId: "1500", name: "Kundefordringer", groupId: "assets", balance: 1850000, prevBalance: 1620000 },
      { id: "1900", accountId: "1900", name: "Kontanter", groupId: "assets", balance: 28000, prevBalance: 35000 },
      { id: "1920", accountId: "1920", name: "Bankinnskudd", groupId: "assets", balance: 6242000, prevBalance: 5595000 },
    ]
  },
  {
    id: "liabilities",
    name: "Gjeld og egenkapital",
    balance: 8120000,
    prevBalance: 7250000,
    accounts: [
      { id: "2000", accountId: "2000", name: "Egenkapital", groupId: "liabilities", balance: 4850000, prevBalance: 4100000 },
      { id: "2400", accountId: "2400", name: "Leverandørgjeld", groupId: "liabilities", balance: 1250000, prevBalance: 1150000 },
      { id: "2600", accountId: "2600", name: "Skattetrekk", groupId: "liabilities", balance: 405000, prevBalance: 385000 },
      { id: "2770", accountId: "2770", name: "Skyldig arbeidsgiveravgift", groupId: "liabilities", balance: 215000, prevBalance: 195000 },
      { id: "2800", accountId: "2800", name: "Avsatt utbytte", groupId: "liabilities", balance: 1400000, prevBalance: 1420000 },
    ]
  }
];

interface AccountSelectionSidebarProps {
  onAccountSelect: (account: Account | null) => void;
  onAccountGroupSelect: (group: AccountGroup | null) => void;
  onMultiSelect?: (accounts: Account[]) => void;
  selectedAccount?: Account | null;
  selectedAccountGroup?: AccountGroup | null;
  selectedAccounts?: Account[];
  side?: 'left' | 'right';
}

const AccountSelectionSidebar = ({ 
  onAccountSelect, 
  onAccountGroupSelect,
  onMultiSelect,
  selectedAccount,
  selectedAccountGroup,
  selectedAccounts = [],
  side = 'left'
}: AccountSelectionSidebarProps) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountGroups] = useState<AccountGroup[]>(mockAccountGroups);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [multiSelectAccounts, setMultiSelectAccounts] = useState<Account[]>(selectedAccounts || []);
  
  // Update multiSelectAccounts when selectedAccounts prop changes
  useEffect(() => {
    setMultiSelectAccounts(selectedAccounts);
  }, [selectedAccounts]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' }).format(amount);
  };
  
  const toggleGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };
  
  const handleAccountGroupClick = (group: AccountGroup) => {
    onAccountGroupSelect(group);
    onAccountSelect(null);
    
    // Auto-expand the selected group
    if (!expandedGroups.includes(group.id)) {
      setExpandedGroups(prev => [...prev, group.id]);
    }
  };
  
  const handleAccountClick = (account: Account, e: React.MouseEvent) => {
    // If multi-select is enabled (if onMultiSelect is provided)
    if (onMultiSelect && e.ctrlKey) {
      handleMultiSelect(account);
    } else {
      onAccountSelect(account);
      
      // Find and set the parent group
      const parentGroup = accountGroups.find(group => 
        group.accounts.some(acc => acc.id === account.id)
      );
      
      if (parentGroup) {
        onAccountGroupSelect(parentGroup);
      }
    }
  };
  
  const handleMouseDown = () => {
    setIsMouseDown(true);
  };
  
  const handleMouseUp = () => {
    setIsMouseDown(false);
  };
  
  const handleMultiSelect = (account: Account) => {
    const isSelected = multiSelectAccounts.some(a => a.id === account.id);
    
    let newSelectedAccounts: Account[];
    if (isSelected) {
      // Remove account if already selected
      newSelectedAccounts = multiSelectAccounts.filter(a => a.id !== account.id);
    } else {
      // Add account if not already selected
      newSelectedAccounts = [...multiSelectAccounts, account];
    }
    
    setMultiSelectAccounts(newSelectedAccounts);
    
    if (onMultiSelect) {
      onMultiSelect(newSelectedAccounts);
    }
  };
  
  const handleAccountMouseOver = (account: Account) => {
    if (isMouseDown && onMultiSelect) {
      handleMultiSelect(account);
    }
  };
  
  const isAccountSelected = (accountId: string) => {
    return multiSelectAccounts.some(a => a.id === accountId) || (selectedAccount?.id === accountId);
  };
  
  const filteredGroups = accountGroups.filter(group => {
    // If no search query, return all groups
    if (!searchQuery) return true;
    
    // Filter by group name
    if (group.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    
    // Filter by accounts within the group
    return group.accounts.some(account => 
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.accountId.includes(searchQuery)
    );
  });

  useEffect(() => {
    // Add event listeners to handle mouse up outside component
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <Sidebar collapsible="icon" side={side} className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center px-2 py-2">
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter konto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8"
              />
            </div>
          </div>
        </SidebarGroup>
        
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <SidebarGroup>
            <SidebarGroupLabel>Regnskapslinjer</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredGroups.map((group) => (
                  <SidebarMenuItem key={group.id}>
                    <SidebarMenuButton 
                      onClick={() => handleAccountGroupClick(group)}
                      isActive={selectedAccountGroup?.id === group.id}
                      className="justify-between"
                    >
                      <span>{group.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {formatCurrency(group.balance)}
                        </Badge>
                        <div onClick={(e) => toggleGroup(group.id, e)}>
                          {expandedGroups.includes(group.id) ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </div>
                      </div>
                    </SidebarMenuButton>
                    
                    {expandedGroups.includes(group.id) && (
                      <SidebarMenuSub>
                        {group.accounts
                          .filter(account => 
                            !searchQuery || 
                            account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            account.accountId.includes(searchQuery)
                          )
                          .map((account) => (
                            <SidebarMenuSubItem key={account.id} onMouseDown={handleMouseDown}>
                              <SidebarMenuSubButton 
                                onClick={(e: React.MouseEvent) => handleAccountClick(account, e)}
                                onMouseOver={() => handleAccountMouseOver(account)}
                                isActive={isAccountSelected(account.id)}
                                className={`justify-between ${isAccountSelected(account.id) ? 'bg-primary-50 text-primary-600' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-muted-foreground">{account.accountId}</span>
                                  <span>{account.name}</span>
                                </div>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {formatCurrency(account.balance)}
                                </Badge>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
};

export default AccountSelectionSidebar;
