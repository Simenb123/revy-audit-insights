import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import RevyAvatar from '@/components/Revy/RevyAvatar'
import SmartReviAssistant from '@/components/Revy/SmartReviAssistant'
import { cn } from '@/lib/utils'
import { RevyContext } from '@/types/revio'

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
  userRole
}) => {
  const systemPrompt = getSystemPrompt(variant)

  return (
    <Card className={cn('h-full w-full flex flex-col shadow-none border-none rounded-none', className)}>
      <CardHeader className="p-2 pb-0">
        <div className="flex items-center gap-2">
          <RevyAvatar size="sm" />
          <div>
            <CardTitle className="text-base">AI-Revy</CardTitle>
            <CardDescription className="text-xs">{systemPrompt}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 pb-0 flex flex-col flex-1">
        <SmartReviAssistant
          embedded
          context={context}
          clientData={clientData}
          userRole={userRole}
        />
      </CardContent>
    </Card>
  )
}

export default AiRevyCard
