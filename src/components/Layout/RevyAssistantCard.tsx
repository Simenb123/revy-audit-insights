
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import RevyAvatar from '@/components/Revy/RevyAvatar'
import { cn } from '@/lib/utils'
import SmartReviAssistant from '@/components/Revy/SmartReviAssistant'
import { RevyContext } from '@/types/revio'

interface RevyAssistantCardProps {
  title: string
  description: string
  className?: string
  context?: RevyContext
  clientData?: any
  userRole?: string
}

const RevyAssistantCard: React.FC<RevyAssistantCardProps> = ({
  title,
  description,
  className = '',
  context = 'general',
  clientData,
  userRole
}) => {

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <RevyAvatar size="sm" />
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
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
};

export default RevyAssistantCard;
