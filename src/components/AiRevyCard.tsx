import React from 'react'
import RevyAvatar from '@/components/Revy/RevyAvatar'
import SmartReviAssistant from '@/components/Revy/SmartReviAssistant'
import { cn } from '@/lib/utils'
import { RevyContext } from '@/types/revio'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import SimpleChatPanel from '@/components/Communication/SimpleChatPanel'

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
      <div className="p-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <RevyAvatar size="md" />
          <div>
            <div className="text-sm font-medium">AI-Revy</div>
            <div className="text-xs text-muted-foreground">{systemPrompt}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0">
        {hideTabs ? (
          // Desktop: Render directly without Tabs wrapper
          <div className="flex-1 min-h-0 flex flex-col">
            {currentTab === 'ai' ? (
              <SmartReviAssistant
                embedded
                context={context}
                clientData={clientData}
                userRole={userRole}
              />
            ) : (
              <SimpleChatPanel />
            )}
          </div>
        ) : (
          // Mobile: Use Tabs with visible tab list
          <Tabs value={currentTab} onValueChange={(v) => handleTabChange(v as 'ai' | 'chat')} className="flex-1 flex flex-col min-h-0">
            <div className="px-2 pt-2">
              <TabsList>
                <TabsTrigger value="ai">AI</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="ai" className="flex-1 min-h-0 flex flex-col">
              <SmartReviAssistant
                embedded
                context={context}
                clientData={clientData}
                userRole={userRole}
              />
            </TabsContent>
            <TabsContent value="chat" className="flex-1 min-h-0 flex flex-col">
              <SimpleChatPanel />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

export default AiRevyCard
