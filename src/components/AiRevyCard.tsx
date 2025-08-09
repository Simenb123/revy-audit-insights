import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import RevyAvatar from '@/components/Revy/RevyAvatar'
import SmartReviAssistant from '@/components/Revy/SmartReviAssistant'
import { cn } from '@/lib/utils'
import { RevyContext } from '@/types/revio'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import GroupChatSidebar from '@/components/Communication/GroupChatSidebar'

export type AiRevyVariant =
  | 'dashboard'
  | 'knowledge'
  | 'client'
  | 'admin'
  | 'general'

interface AiRevyCardProps {
  variant: AiRevyVariant
  className?: string
  context?: RevyContext
  clientData?: any
  userRole?: string
  activeTab?: 'ai' | 'chat'
  onTabChange?: (tab: 'ai' | 'chat') => void
  hideTabs?: boolean
}

const getSystemPrompt = (variant: AiRevyVariant): string => {
  const prompts: Record<AiRevyVariant, string> = {
    dashboard: 'Du er AI-Revy og hjelper brukeren i dashboardet.',
    knowledge: 'Du er AI-Revy og svarer på kunnskapsbaserte spørsmål.',
    client: 'Du er AI-Revy med fokus på valgt klient.',
    admin: 'Du er AI-Revy og bistår administratorer med oppgaver i admin-grensesnittet.',
    general: 'Du er AI-Revy og hjelper brukeren generelt.'
  }
  return prompts[variant]
}

const AiRevyCard: React.FC<AiRevyCardProps> = ({
  variant,
  className = '',
  context = 'general',
  clientData,
  userRole,
  activeTab,
  onTabChange,
  hideTabs = false,
}) => {
  const systemPrompt = getSystemPrompt(variant)

  const [internalTab, setInternalTab] = React.useState<'ai' | 'chat'>("ai")
  const currentTab = activeTab ?? internalTab
  const handleTabChange = (tab: 'ai' | 'chat') => {
    if (onTabChange) onTabChange(tab)
    else setInternalTab(tab)
  }

  return (
    <div className={cn('h-full w-full flex flex-col', className)}>
      <div className="p-2 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <RevyAvatar size="sm" />
          <div>
            <div className="text-sm font-medium">AI-Revy</div>
            <div className="text-xs text-muted-foreground">{systemPrompt}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0">
        <Tabs value={currentTab} onValueChange={(v) => handleTabChange(v as 'ai' | 'chat')} className="flex-1 flex flex-col min-h-0 h-full">
          { !hideTabs && (
            <div className="px-2 pt-2">
              <TabsList>
                <TabsTrigger value="ai">AI</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
              </TabsList>
            </div>
          ) }
          <TabsContent value="ai" className="mt-0 flex-1 min-h-0 h-full flex flex-col">
            <div className="flex-1 min-h-0 h-full">
              <SmartReviAssistant
                embedded
                context={context}
                clientData={clientData}
                userRole={userRole}
              />
            </div>
          </TabsContent>
          <TabsContent value="chat" className="flex-1 min-h-0 flex flex-col">
            <GroupChatSidebar />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AiRevyCard
