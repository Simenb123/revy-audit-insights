
import React, { useState, useEffect } from 'react'
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { useSidebar } from '@/components/ui/sidebar/SidebarContext'
import { Link, useLocation, useParams } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users,
  BarChart3,
  FileText,
  Settings,
  Building,
  BookOpen,
  MessageSquare,
  Database,
  Brain,
  UserCog,
  GraduationCap,
  Info,
  Shield,
  ChevronDown,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Receipt,
  ArrowRightLeft,
  FileSpreadsheet
} from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin'

// Static non-client specific items
const generalWorkItems = [
  {
    title: 'Regnskap',
    url: '/accounting',
    icon: Database,
  },
]


// Ressurser - tilgjengelig for alle
const resourceItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Klienter',
    url: '/clients',
    icon: Users,
  },
  {
    title: 'Rapporter',
    url: '/reports',
    icon: FileText,
  },
  {
    title: 'Team',
    url: '/teams',
    icon: Users,
  },
  {
    title: 'Budsjett',
    url: '/resource-planner',
    icon: BarChart3,
  },
  {
    title: 'Kunnskapsbase',
    url: '/fag',
    icon: BookOpen,
  },
  {
    title: 'Revisorskolen',
    url: '/revisorskolen',
    icon: GraduationCap,
  },
  {
    title: 'Kommunikasjon',
    url: '/communication',
    icon: MessageSquare,
  },
  {
    title: 'Dataredigering',
    url: '/resources/dataredigering',
    icon: FileSpreadsheet,
  },
  {
    title: 'Aksjonærregister',
    url: '/resources/aksjonaerregister',
    icon: Users,
  },
  {
    title: 'AI-Studio',
    url: '/ai/multi-agent-studio',
    icon: Brain,
  },
]

const ResizableLeftSidebar = () => {
  const { state } = useSidebar()
  const location = useLocation()
  const { data: userProfile } = useUserProfile()
  const { clientId } = useParams<{ clientId: string }>()
  const { data: isSuperAdmin } = useIsSuperAdmin()
  const isCollapsed = state === 'collapsed'

  // State for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  // Load collapsed sections from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed-sections')
    if (saved) {
      try {
        setCollapsedSections(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse saved sidebar state:', error)
      }
    }
  }, [])

  // Save collapsed sections to localStorage
  const toggleSection = (sectionKey: string) => {
    const newState = {
      ...collapsedSections,
      [sectionKey]: !collapsedSections[sectionKey]
    }
    setCollapsedSections(newState)
    localStorage.setItem('sidebar-collapsed-sections', JSON.stringify(newState))
  }

  // Dynamic client-specific items
  const clientMainItems = clientId ? [
    {
      title: 'Oversikt',
      url: `/clients/${clientId}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: 'Klientinformasjon',
      url: `/clients/${clientId}/overview`,
      icon: Info,
    },
    {
      title: 'Regnskapsdata',
      url: `/clients/${clientId}/regnskapsdata`,
      icon: Database,
    },
    {
      title: 'Analyse',
      url: `/clients/${clientId}/analysis`,
      icon: BarChart3,
    },
    {
      title: 'Transaksjonsanalyse',
      url: `/clients/${clientId}/transaction-analysis`,
      icon: Brain,
    },
    {
      title: 'Saldobalanse',
      url: `/clients/${clientId}/trial-balance`,
      icon: BarChart3,
    },
    {
      title: 'Hovedbok',
      url: `/clients/${clientId}/general-ledger`,
      icon: FileText,
    },
    {
      title: 'Dokumenter',
      url: `/clients/${clientId}/documents`,
      icon: FileText,
    },
  ] : []

  // Payroll sub-items
  const payrollItems = clientId ? [
    {
      title: 'Lønn Oversikt',
      url: `/clients/${clientId}/payroll`,
      icon: DollarSign,
    },
    {
      title: 'A07 Data',
      url: `/clients/${clientId}/payroll/a07`,
      icon: FileText,
    },
    {
      title: 'Lønnsanalyse',
      url: `/clients/${clientId}/payroll/analysis`,
      icon: BarChart3,
    },
  ] : []

  // Sales sub-items (removed as requested)
  const salesItems: any[] = []

  // Costs sub-items (removed as requested)  
  const costItems: any[] = []

  // Investment sub-items (client-specific only)
  const investmentItems = clientId ? [
    {
      title: 'Porteføljeoversikt',
      url: `/clients/${clientId}/investments/overview`,
      icon: BarChart3,
    },
    {
      title: 'Porteføljer',
      url: `/clients/${clientId}/investments/portfolios`,
      icon: BarChart3,
    },
    {
      title: 'Transaksjoner',
      url: `/clients/${clientId}/investments/transactions`,
      icon: FileText,
    },
  ] : []

  // Resource reference items (links to global resources)
  const resourceReferenceItems = [
    {
      title: 'Verdipapirer',
      url: '/resources/securities/catalog',
      icon: Shield,
    },
    {
      title: 'Historiske kurser',
      url: '/resources/securities/prices',
      icon: TrendingUp,
    },
    {
      title: 'Valutakurser',
      url: '/resources/currencies',
      icon: ArrowRightLeft,
    },
  ]

  const clientWorkItems = clientId ? clientMainItems : generalWorkItems

  const isActive = (url: string) => {
    if (url === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    return location.pathname === url || 
      (url !== '/' && location.pathname.startsWith(url))
  }


  return (
      <ShadcnSidebar
        collapsible="icon"
        className="border-r border-sidebar-border bg-sidebar"
        style={{
          width: isCollapsed
            ? 'var(--sidebar-width-icon)'
            : 'var(--sidebar-width)',
          minWidth: isCollapsed
            ? 'var(--sidebar-width-icon)'
            : 'var(--sidebar-width)'
        }}
    >
      <SidebarHeader className="p-1">
        <div className="flex w-full items-center">
          {!isCollapsed && (
            <span className="text-xs font-medium text-sidebar-foreground">Navigation</span>
          )}
          <SidebarTrigger className="ml-auto h-8 w-8" />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Klientarbeid seksjon */}
        <Collapsible 
          open={!collapsedSections['klientarbeid']} 
          onOpenChange={() => toggleSection('klientarbeid')}
        >
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between group">
                {!isCollapsed && (
                  <>
                    <span>Klientarbeid</span>
                    {collapsedSections['klientarbeid'] ? 
                      <ChevronRight className="h-3 w-3 opacity-50 group-hover:opacity-100" /> : 
                      <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                    }
                  </>
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {clientWorkItems.map((item) => {
                    const isItemActive = isActive(item.url)
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isItemActive}
                          className={isCollapsed ? "justify-center p-2" : "justify-start pl-2 pr-2"}
                          tooltip={isCollapsed ? item.title : undefined}
                        >
                          <Link to={item.url} className={isCollapsed ? "flex items-center justify-center w-full h-full" : "flex items-center gap-2 w-full"}>
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && <span className="text-xs truncate">{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}

                  {/* Lønn sub-section */}
                  {clientId && payrollItems.length > 0 && (
                    <SidebarMenuItem>
                      <Collapsible 
                        open={!collapsedSections['payroll']} 
                        onOpenChange={() => toggleSection('payroll')}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 flex-shrink-0" />
                              {!isCollapsed && <span className="text-xs truncate">Lønn</span>}
                            </div>
                            {!isCollapsed && (
                              collapsedSections['payroll'] ? 
                                <ChevronRight className="h-3 w-3 opacity-50 group-hover:opacity-100" /> : 
                                <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {payrollItems.map((item) => {
                              const isItemActive = isActive(item.url)
                              
                              return (
                                <SidebarMenuItem key={item.title}>
                                  <SidebarMenuSubButton 
                                    asChild 
                                    isActive={isItemActive}
                                  >
                                    <Link to={item.url} className="flex items-center gap-2 w-full">
                                      <item.icon className="h-3 w-3 flex-shrink-0" />
                                      <span className="text-xs truncate">{item.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  )}

                  {/* Salg sub-section (placeholder) */}
                  {clientId && salesItems.length > 0 && (
                    <SidebarMenuItem>
                      <Collapsible 
                        open={!collapsedSections['sales']} 
                        onOpenChange={() => toggleSection('sales')}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 flex-shrink-0" />
                              {!isCollapsed && <span className="text-xs truncate">Salg</span>}
                            </div>
                            {!isCollapsed && (
                              collapsedSections['sales'] ? 
                                <ChevronRight className="h-3 w-3 opacity-50 group-hover:opacity-100" /> : 
                                <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {salesItems.map((item) => {
                              const isItemActive = isActive(item.url)
                              
                              return (
                                <SidebarMenuItem key={item.title}>
                                  <SidebarMenuSubButton 
                                    asChild 
                                    isActive={isItemActive}
                                  >
                                    <Link to={item.url} className="flex items-center gap-2 w-full">
                                      <item.icon className="h-3 w-3 flex-shrink-0" />
                                      <span className="text-xs truncate">{item.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  )}

                  {/* Kostnader sub-section (placeholder) */}
                  {clientId && costItems.length > 0 && (
                    <SidebarMenuItem>
                      <Collapsible 
                        open={!collapsedSections['costs']} 
                        onOpenChange={() => toggleSection('costs')}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 flex-shrink-0" />
                              {!isCollapsed && <span className="text-xs truncate">Kostnader</span>}
                            </div>
                            {!isCollapsed && (
                              collapsedSections['costs'] ? 
                                <ChevronRight className="h-3 w-3 opacity-50 group-hover:opacity-100" /> : 
                                <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {costItems.map((item) => {
                              const isItemActive = isActive(item.url)
                              
                              return (
                                <SidebarMenuItem key={item.title}>
                                  <SidebarMenuSubButton 
                                    asChild 
                                    isActive={isItemActive}
                                  >
                                    <Link to={item.url} className="flex items-center gap-2 w-full">
                                      <item.icon className="h-3 w-3 flex-shrink-0" />
                                      <span className="text-xs truncate">{item.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  )}

                  {/* Investeringer sub-section */}
                  {clientId && investmentItems.length > 0 && (
                    <SidebarMenuItem>
                      <Collapsible 
                        open={!collapsedSections['investments']} 
                        onOpenChange={() => toggleSection('investments')}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 flex-shrink-0" />
                              {!isCollapsed && <span className="text-xs truncate">Investeringer</span>}
                            </div>
                            {!isCollapsed && (
                              collapsedSections['investments'] ? 
                                <ChevronRight className="h-3 w-3 opacity-50 group-hover:opacity-100" /> : 
                                <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {investmentItems.map((item) => {
                              const isItemActive = isActive(item.url)
                              
                              return (
                                <SidebarMenuItem key={item.title}>
                                  <SidebarMenuSubButton 
                                    asChild 
                                    isActive={isItemActive}
                                  >
                                    <Link to={item.url} className="flex items-center gap-2 w-full">
                                      <item.icon className="h-3 w-3 flex-shrink-0" />
                                      <span className="text-xs truncate">{item.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuItem>
                              )
                            })}
                           </SidebarMenuSub>
                         </CollapsibleContent>
                       </Collapsible>
                     </SidebarMenuItem>
                   )}
                 </SidebarMenu>
               </SidebarGroupContent>
             </CollapsibleContent>
           </SidebarGroup>
         </Collapsible>

         {/* Globale ressurser seksjon - kun når vi er i en klient-kontekst */}
         {clientId && (
           <Collapsible 
             open={!collapsedSections['global-resources']} 
             onOpenChange={() => toggleSection('global-resources')}
           >
             <SidebarGroup>
               <CollapsibleTrigger asChild>
                 <SidebarGroupLabel className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between group">
                   {!isCollapsed && (
                     <>
                       <span>Globale ressurser</span>
                       {collapsedSections['global-resources'] ? 
                         <ChevronRight className="h-3 w-3 opacity-50 group-hover:opacity-100" /> : 
                         <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                       }
                     </>
                   )}
                 </SidebarGroupLabel>
               </CollapsibleTrigger>
               <CollapsibleContent>
                 <SidebarGroupContent>
                   <SidebarMenu className="space-y-1">
                     {resourceReferenceItems.map((item) => {
                       const isItemActive = isActive(item.url)
                       
                       return (
                         <SidebarMenuItem key={item.title}>
                           <SidebarMenuButton 
                             asChild 
                             isActive={isItemActive}
                             className={isCollapsed ? "justify-center p-2" : "justify-start pl-2 pr-2"}
                             tooltip={isCollapsed ? item.title : undefined}
                           >
                             <Link to={item.url} className={isCollapsed ? "flex items-center justify-center w-full h-full" : "flex items-center gap-2 w-full"}>
                               <item.icon className="h-4 w-4 flex-shrink-0" />
                               {!isCollapsed && <span className="text-xs truncate">{item.title}</span>}
                             </Link>
                           </SidebarMenuButton>
                         </SidebarMenuItem>
                       )
                     })}
                   </SidebarMenu>
                 </SidebarGroupContent>
               </CollapsibleContent>
             </SidebarGroup>
           </Collapsible>
         )}


        {/* Ressurser seksjon */}
        <Collapsible 
          open={!collapsedSections['resources']} 
          onOpenChange={() => toggleSection('resources')}
        >
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between group">
                {!isCollapsed && (
                  <>
                    <span>Ressurser</span>
                    {collapsedSections['resources'] ? 
                      <ChevronRight className="h-3 w-3 opacity-50 group-hover:opacity-100" /> : 
                      <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                    }
                  </>
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {resourceItems.map((item) => {
                    const isItemActive = isActive(item.url)
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isItemActive}
                          className={isCollapsed ? "justify-center p-2" : "justify-start pl-2 pr-2"}
                          tooltip={isCollapsed ? item.title : undefined}
                        >
                          <Link to={item.url} className={isCollapsed ? "flex items-center justify-center w-full h-full" : "flex items-center gap-2 w-full"}>
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && <span className="text-xs truncate">{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </ShadcnSidebar>
  )
}

export default ResizableLeftSidebar
