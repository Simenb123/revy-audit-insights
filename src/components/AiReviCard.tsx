import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import RevyAvatar from '@/components/Revy/RevyAvatar'
import SmartReviAssistant from '@/components/Revy/SmartReviAssistant'
import { cn } from '@/lib/utils'
import { RevyContext } from '@/types/revio'

export type AiReviVariant = 'dashboard' | 'knowledge' | 'client'

interface AiReviCardProps {
  variant: AiReviVariant
  className?: string
  context?: RevyContext
  clientData?: any
  userRole?: string
}

const getSystemPrompt = (variant: AiReviVariant): string => {
  const prompts: Record<AiReviVariant, string> = {
    dashboard: 'Du er AI-Revi og hjelper brukeren i dashboardet.',
    knowledge: 'Du er AI-Revi og svarer på kunnskapsbaserte spørsmål.',
    client: 'Du er AI-Revi med fokus på valgt klient.'
  }
  return prompts[variant]
}

const AiReviCard: React.FC<AiReviCardProps> = ({
  variant,
  className = '',
  context = 'general',
  clientData,
  userRole
}) => {
  const systemPrompt = getSystemPrompt(variant)

  return (
    <Card className={cn('h-full w-full flex flex-col shadow-none border-none rounded-none', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <RevyAvatar size="sm" />
          <div>
            <CardTitle className="text-base">AI-Revi</CardTitle>
            <CardDescription className="text-xs">{systemPrompt}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col flex-1">
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

export default AiReviCard
